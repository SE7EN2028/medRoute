import type { Specialty, TriageResult } from '@app/types';
import { matchEmergencyKeyword } from '@app/data/emergencyKeywords';
import { parseTriageJson } from '@app/utils/validators';

// Post-LLM safety net for obvious specialty miscategorisations. The model
// sometimes drifts (e.g. routes "headache" to dentistry). These rules are
// strict — applied only when the symptom clearly maps to one specialty.
function correctSpecialty(symptom: string, llmPick: Specialty): Specialty {
  const t = symptom.toLowerCase();

  const has = (...words: string[]) => words.some((w) => t.includes(w));

  // Hard rules — symptom text contains an unambiguous keyword.
  if (has('tooth', 'teeth', 'molar', 'wisdom tooth', 'gum', 'gums', 'cavity', 'dental', 'oral cavity'))
    return 'dentistry';

  if (llmPick === 'dentistry' && !has('tooth', 'teeth', 'molar', 'wisdom', 'gum', 'cavity', 'jaw', 'dental', 'oral'))
    // Model picked dentistry but no oral words in text → fall back.
    return has('headache', 'migraine', 'sudden severe head')
      ? (has('throbbing', 'migraine', 'aura', 'one side', 'light hurt', 'photophobia') ? 'neurology' : 'general')
      : 'general';

  if (has('chest pain', 'crushing chest', 'tight chest', 'heart attack')) return 'cardiology';
  if (has('snake bite', 'snakebite', 'snake')) return 'toxicology';
  if (has('eye', 'vision', 'eyesight', 'blurred')) {
    if (!has('headache', 'migraine')) return 'ophthalmology';
  }
  if (has('rash', 'pimple', 'acne', 'skin')) return 'dermatology';
  if (has('twist', 'sprain', 'fracture', 'broken bone', 'ankle', 'wrist', 'knee')) return 'orthopedics';
  if (has('pregnant', 'period', 'menstrual', 'pregnancy', 'vagin')) return 'obgyn';
  if (has('depress', 'anxious', 'panic', 'suicid', 'hopeless')) return 'psychiatry';
  if (has('cough', 'breath', 'wheez', 'asthma')) return 'pulmonology';

  return llmPick;
}

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
4. Specialty must be ONE of: general, cardiology, orthopedics, pediatrics, neurology, pulmonology, gastroenterology, dermatology, ent, ophthalmology, dentistry, obgyn, psychiatry, urology, oncology, toxicology, emergency_medicine.
5. Severity must be exactly one of: emergency, urgent, routine.
   - emergency: immediate life/limb risk (chest pain, stroke signs, severe bleeding, anaphylaxis, suicidal ideation, unresponsive, snakebite, severe breathing trouble).
   - urgent: see a doctor today/within 24h (high fever in infant, fracture, persistent vomiting, dehydration, moderate burns).
   - routine: can wait 1–7 days (mild cold, mild rash, routine checkup).
6. Confidence is your own self-rating 0–1. Be honest; low confidence is fine.
7. Rationale: one short sentence, non-diagnostic. "Symptoms suggest a cardiology consult" — not "You have angina".

8. Specialty disambiguation — pick the closest match. DENTISTRY only when text explicitly mentions tooth/teeth/gum/molar/wisdom/jaw/oral/cavity/dental. Otherwise NEVER pick dentistry.

9. Worked examples (study these — match new inputs by closest analogy):
   - "I have a headache" → general, routine.
   - "Headache for 3 days, light hurts my eyes" → neurology, urgent.
   - "Migraine again, throbbing on left side" → neurology, routine.
   - "Sinus pressure and stuffy nose for 5 days" → ent, routine.
   - "My tooth hurts when I chew" → dentistry, routine.
   - "Wisdom tooth painful, gum is swollen" → dentistry, urgent.
   - "Jaw locks when I open wide" → dentistry, routine.
   - "Sore throat and ear ache" → ent, routine.
   - "Chest pain when climbing stairs" → cardiology, urgent.
   - "Twisted ankle, can't put weight" → orthopedics, urgent.
   - "Rash on arm for 3 days" → dermatology, routine.
   - "Toddler fever 101°F won't eat" → pediatrics, urgent.
   - "Eye is red and blurry vision" → ophthalmology, urgent.
   - "Burning when peeing" → urology, urgent.
   - "Feeling hopeless, want to disappear" → psychiatry, emergency.
   - "Snakebite" → toxicology, emergency.
   - "Can't breathe" → emergency_medicine, emergency.

10. If symptoms mention TWO body systems, pick the more specific one.

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
        temperature: 0,
        top_p: 0.9,
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

  // Final guard — fix obvious specialty miscategorisations the LLM may produce.
  const fixedSpecialty = correctSpecialty(trimmed, llmResult.specialty);
  if (fixedSpecialty !== llmResult.specialty) {
    return { ...llmResult, specialty: fixedSpecialty };
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
