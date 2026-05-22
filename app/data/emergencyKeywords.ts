// Hardcoded safety net. If user text matches any of these (case-insensitive,
// substring), the LLM classification is overridden to "emergency" regardless
// of model confidence. Better to over-triage than under-triage.

export interface KeywordRule {
  match: string[]; // any substring triggers
  specialty:
    | 'cardiology'
    | 'neurology'
    | 'toxicology'
    | 'pulmonology'
    | 'emergency_medicine'
    | 'psychiatry';
  steps: [string, string, string]; // exactly 3 first-aid steps
  reason: string;
}

export const EMERGENCY_KEYWORDS: KeywordRule[] = [
  {
    match: ['chest pain', 'crushing chest', 'pain in chest', 'tight chest', 'heart attack'],
    specialty: 'cardiology',
    steps: [
      'Call 108 now. Do not drive yourself.',
      'Sit upright, loosen tight clothing, stay calm.',
      'If aspirin is at hand and no allergy/bleeding, chew one 325mg tablet.',
    ],
    reason: 'Possible cardiac event — chest pain trigger',
  },
  {
    match: ['stroke', 'face drooping', 'slurred speech', 'one side weak', 'sudden weakness', 'sudden numbness'],
    specialty: 'neurology',
    steps: [
      'Call 108 now. Note the exact time symptoms started.',
      'Lay the person on their side, do not give food or water.',
      'Stay with them. Do not let them sleep or drive.',
    ],
    reason: 'Possible stroke — time-critical (FAST signs)',
  },
  {
    match: ['snakebite', 'snake bite'],
    specialty: 'toxicology',
    steps: [
      'Call 108 now. Identify the snake only from a safe distance.',
      'Keep the bitten limb still and below heart level. Remove rings/watches.',
      'Do NOT cut, suck, or apply tourniquet. Do not give alcohol.',
    ],
    reason: 'Snakebite — antivenom needed urgently',
  },
  {
    match: ['choking', 'cannot breathe', 'can\'t breathe', 'unable to breathe', 'turning blue'],
    specialty: 'emergency_medicine',
    steps: [
      'Call 108 now.',
      'If conscious: 5 back blows between shoulder blades, then 5 abdominal thrusts (Heimlich).',
      'If unconscious: start CPR — 30 compressions, 2 breaths, repeat.',
    ],
    reason: 'Airway obstruction',
  },
  {
    match: ['severe bleeding', 'heavy bleeding', 'bleeding heavily', 'won\'t stop bleeding', 'spurting blood'],
    specialty: 'emergency_medicine',
    steps: [
      'Call 108 now.',
      'Press firmly on the wound with a clean cloth. Do not lift to check.',
      'Elevate the injured area above heart level if possible.',
    ],
    reason: 'Hemorrhage risk',
  },
  {
    match: ['suicide', 'kill myself', 'end my life', 'want to die', 'self harm', 'suicidal'],
    specialty: 'psychiatry',
    steps: [
      'You are not alone. Call iCall 9152987821 or Vandrevala 1860-2662-345 right now.',
      'Stay with someone or move to a safe place. Remove access to anything harmful.',
      'Reach out to one trusted person — even a short message helps.',
    ],
    reason: 'Mental health crisis — immediate support needed',
  },
  {
    match: ['unconscious', 'passed out', 'not waking up', 'no pulse', 'not breathing'],
    specialty: 'emergency_medicine',
    steps: [
      'Call 108 now.',
      'Check breathing. If absent, start CPR — 30 compressions, 2 breaths.',
      'Place in recovery position if breathing. Do not leave them alone.',
    ],
    reason: 'Unresponsive — possible cardiac arrest',
  },
  {
    match: ['severe allergic', 'anaphylaxis', 'face swelling', 'throat closing', 'tongue swelling'],
    specialty: 'emergency_medicine',
    steps: [
      'Call 108 now.',
      'Use epinephrine auto-injector (EpiPen) on outer thigh if available.',
      'Lay flat, raise legs. If breathing trouble, sit upright.',
    ],
    reason: 'Possible anaphylaxis',
  },
];

export function matchEmergencyKeyword(text: string): KeywordRule | null {
  const t = text.toLowerCase();
  for (const rule of EMERGENCY_KEYWORDS) {
    if (rule.match.some((m) => t.includes(m))) return rule;
  }
  return null;
}
