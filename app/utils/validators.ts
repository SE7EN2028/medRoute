import type { TriageResult, Severity, Specialty } from '@app/types';

const SEVERITIES: Severity[] = ['emergency', 'urgent', 'routine'];
const SPECIALTIES: Specialty[] = [
  'general', 'cardiology', 'orthopedics', 'pediatrics', 'neurology',
  'pulmonology', 'gastroenterology', 'dermatology', 'ent', 'ophthalmology',
  'obgyn', 'psychiatry', 'urology', 'oncology', 'toxicology', 'emergency_medicine',
];

// Defensive parser: LLM JSON output cannot be trusted blindly.
export function parseTriageJson(raw: unknown, rawSymptom: string): TriageResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const severity = typeof r.severity === 'string' ? r.severity.toLowerCase() : '';
  const specialty = typeof r.specialty === 'string' ? r.specialty.toLowerCase() : '';
  if (!SEVERITIES.includes(severity as Severity)) return null;
  if (!SPECIALTIES.includes(specialty as Specialty)) return null;
  const steps = Array.isArray(r.immediateSteps) ? r.immediateSteps : [];
  const cleanSteps = steps
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    .slice(0, 3);
  if (cleanSteps.length < 3) return null;
  const confidence = typeof r.confidence === 'number' ? Math.max(0, Math.min(1, r.confidence)) : 0.5;
  const rationale = typeof r.rationale === 'string' ? r.rationale.slice(0, 240) : '';
  const selfCare = typeof r.selfCare === 'string' ? r.selfCare.slice(0, 600).trim() : undefined;
  return {
    severity: severity as Severity,
    specialty: specialty as Specialty,
    immediateSteps: cleanSteps as string[],
    confidence,
    rationale,
    selfCare: selfCare && selfCare.length > 0 ? selfCare : undefined,
    rawSymptom,
    createdAt: Date.now(),
  };
}

export function isNonEmpty(s: string): boolean {
  return s.trim().length > 0;
}

export function isPhoneish(s: string): boolean {
  return /^[+\d][\d\s\-()]{6,}$/.test(s.trim());
}
