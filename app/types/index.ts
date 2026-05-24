// All shared types for MedRoute. Keep this file as the single source of truth.

export type Severity = 'emergency' | 'urgent' | 'routine';

export type Specialty =
  | 'general'
  | 'cardiology'
  | 'orthopedics'
  | 'pediatrics'
  | 'neurology'
  | 'pulmonology'
  | 'gastroenterology'
  | 'dermatology'
  | 'ent'
  | 'ophthalmology'
  | 'dentistry'
  | 'obgyn'
  | 'psychiatry'
  | 'urology'
  | 'oncology'
  | 'toxicology'
  | 'emergency_medicine';

export interface TriageResult {
  severity: Severity;
  specialty: Specialty;
  immediateSteps: string[]; // exactly 3 short, imperative steps
  confidence: number; // 0..1
  rationale: string; // one-sentence, non-diagnostic
  selfCare?: string; // 2–4 sentence conversational home-remedy / comfort advice
  overrideReason?: string; // set if hardcoded keyword forced emergency
  rawSymptom: string;
  createdAt: number; // epoch ms
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Hospital {
  placeId: string;
  name: string;
  address: string;
  location: LatLng;
  distanceKm: number;
  rating?: number;
  userRatingsTotal?: number;
  openNow?: boolean;
  phone?: string;
  isEmergency?: boolean;
}

export interface CostEstimate {
  procedure: string;
  specialty: Specialty;
  minInr: number;
  maxInr: number;
}

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface BloodCamp {
  id: string;
  name: string;
  organizer: string;
  slots?: number;
  urgent?: boolean;
  address: string;
  location: LatLng;
  date: string; // ISO date
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  bloodTypesNeeded: BloodType[];
  contactPhone: string;
  notes?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation?: string;
}

export interface ApiKeys {
  groq: string;
  googlePlaces: string;
}

export interface OnboardingState {
  hasCompletedOnboarding: boolean;
  hasAcceptedDisclaimer: boolean;
}

export interface UserProfile {
  name: string;       // editable display name
  photoUri?: string;  // local file URI from image picker
}

export interface ManualLocation {
  label: string;      // human-readable address from Nominatim
  lat: number;
  lng: number;
}

export interface MedicalInfo {
  bloodType?: string;
  allergies: string[];
  conditions: string[];
  medications: string[];
}
