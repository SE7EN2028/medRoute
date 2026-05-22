import type { TriageResult } from '@app/types';
import { matchEmergencyKeyword } from '@app/data/emergencyKeywords';
import { parseTriageJson } from '@app/utils/validators';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';
const WHISPER_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const WHISPER_MODEL = 'whisper-large-v3-turbo';

const SYSTEM_PROMPT = `You are a clinical triage classifier for a healthcare-routing app used in India.

Your ONLY job is to classify a user's described symptoms. You MUST NOT diagnose specific diseases or recommend medication doses.

Rules — follow strictly:
1. Always err on the side of caution. When ambiguous, choose the HIGHER severity.
2. Output ONLY valid JSON matching the schema. No prose, no markdown, no code fences.
3. Always include exactly 3 immediateSteps — short, imperative, actionable. Even routine cases get 3 steps (e.g. "rest", "hydrate", "monitor"). Emergencies must include "Call 108 now." as step 1.
4. Specialty must be ONE of: general, cardiology, orthopedics, pediatrics, neurology, pulmonology, gastroenterology, dermatology, ent, ophthalmology, obgyn, psychiatry, urology, oncology, toxicology, emergency_medicine.
5. Severity must be exactly one of: emergency, urgent, routine.
   - emergency: immediate life/limb risk (chest pain, stroke signs, severe bleeding, anaphylaxis, suicidal ideation, unresponsive, snakebite, severe breathing trouble).
   - urgent: see a doctor today/within 24h (high fever in infant, fracture, persistent vomiting, dehydration, moderate burns).
   - routine: can wait 1–7 days (mild cold, mild rash, routine checkup).
6. Confidence is your own self-rating 0–1. Be honest; low confidence is fine.
7. Rationale: one short sentence, non-diagnostic. "Symptoms suggest a cardiology consult" — not "You have angina".

Schema:
{
  "severity": "emergency" | "urgent" | "routine",
  "specialty": "<one of the allowed values>",
  "immediateSteps": ["step 1", "step 2", "step 3"],
  "confidence": <0..1>,
  "rationale": "<one short sentence>"
}`;

export class GroqError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'GroqError';
    this.status = status;
  }
}

interface TriageOpts {
  apiKey: string;
  symptom: string;
}

export async function triageSymptom({ apiKey, symptom }: TriageOpts): Promise<TriageResult> {
  const trimmed = symptom.trim();
  if (!trimmed) throw new GroqError('Empty symptom');

  // Safety net: hard-coded keyword rules override the LLM.
  const kw = matchEmergencyKeyword(trimmed);

  if (!apiKey) {
    // No key — use the safety net or a minimal fallback so the app still works offline-ish.
    if (kw) {
      return {
        severity: 'emergency',
        specialty: kw.specialty,
        immediateSteps: [...kw.steps],
        confidence: 0.95,
        rationale: 'Matched emergency keyword (offline fallback).',
        overrideReason: kw.reason,
        rawSymptom: trimmed,
        createdAt: Date.now(),
      };
    }
    throw new GroqError('Groq API key not set. Add it in Profile → API keys.');
  }

  let llmResult: TriageResult | null = null;
  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: 'json_object' },
        temperature: 0.2,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Symptom description: """${trimmed}"""` },
        ],
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new GroqError(`Groq HTTP ${res.status}: ${text.slice(0, 200)}`, res.status);
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content ?? '';
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new GroqError('Groq returned non-JSON content.');
    }
    llmResult = parseTriageJson(parsed, trimmed);
    if (!llmResult) throw new GroqError('Groq JSON failed schema validation.');
  } catch (err) {
    // If LLM call failed but keyword fired, still return safe emergency result.
    if (kw) {
      return {
        severity: 'emergency',
        specialty: kw.specialty,
        immediateSteps: [...kw.steps],
        confidence: 0.9,
        rationale: 'Emergency keyword override (LLM unavailable).',
        overrideReason: kw.reason,
        rawSymptom: trimmed,
        createdAt: Date.now(),
      };
    }
    throw err instanceof GroqError ? err : new GroqError(String(err));
  }

  // Keyword override takes precedence on severity + steps even when LLM responded.
  if (kw) {
    return {
      ...llmResult,
      severity: 'emergency',
      specialty: kw.specialty,
      immediateSteps: [...kw.steps],
      confidence: Math.max(llmResult.confidence, 0.9),
      overrideReason: kw.reason,
    };
  }

  return llmResult;
}

interface TranscribeOpts {
  apiKey: string;
  audioUri: string;
  mimeType?: string;
}

export async function transcribeAudio({ apiKey, audioUri, mimeType = 'audio/m4a' }: TranscribeOpts): Promise<string> {
  if (!apiKey) throw new GroqError('Groq API key not set.');
  const form = new FormData();
  // RN-friendly file blob shape
  form.append('file', {
    uri: audioUri,
    name: 'recording.m4a',
    type: mimeType,
  } as unknown as Blob);
  form.append('model', WHISPER_MODEL);
  form.append('response_format', 'text');
  const res = await fetch(WHISPER_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new GroqError(`Whisper HTTP ${res.status}: ${text.slice(0, 200)}`, res.status);
  }
  const text = await res.text();
  return text.trim();
}
