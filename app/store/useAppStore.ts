import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  ApiKeys,
  EmergencyContact,
  Hospital,
  LatLng,
  MedicalInfo,
  OnboardingState,
  TriageResult,
  UserProfile,
} from '@app/types';
import { loadApiKeys, saveGroqKey, savePlacesKey } from '@app/services/secureKeys';
import { DEV_API_KEYS } from '@app/config/apiKeys';

const STORAGE_KEY = 'medroute.persisted.v2';

interface PersistedState {
  onboarding: OnboardingState;
  user: UserProfile;
  contacts: EmergencyContact[];
  lastTriage: TriageResult | null;
  lastHospitals: Hospital[];
  lastLocation: LatLng | null;
  medicalInfo: MedicalInfo;
}

interface AppState extends PersistedState {
  apiKeys: ApiKeys;
  hydrated: boolean;

  hydrate: () => Promise<void>;

  // onboarding
  completeOnboarding: () => void;
  acceptDisclaimer: () => void;
  resetOnboarding: () => void;

  // api keys
  setGroqKey: (key: string) => Promise<void>;
  setPlacesKey: (key: string) => Promise<void>;

  // user profile
  setUserName: (name: string) => void;
  setUserPhoto: (uri: string | undefined) => void;

  // contacts
  addContact: (c: Omit<EmergencyContact, 'id'>) => void;
  removeContact: (id: string) => void;

  // triage flow
  setTriageResult: (r: TriageResult) => void;
  clearTriage: () => void;

  // places / location cache
  setLastHospitals: (h: Hospital[]) => void;
  setLastLocation: (l: LatLng) => void;

  // medical profile
  setBloodType: (v: string) => void;
  addAllergy: (v: string) => void;
  removeAllergy: (v: string) => void;
  addCondition: (v: string) => void;
  removeCondition: (v: string) => void;
  addMedication: (v: string) => void;
  removeMedication: (v: string) => void;
}

const DEFAULT_MEDICAL: MedicalInfo = {
  bloodType: undefined,
  allergies: [],
  conditions: [],
  medications: [],
};

const DEFAULT_PERSISTED: PersistedState = {
  onboarding: { hasCompletedOnboarding: false, hasAcceptedDisclaimer: false },
  user: { name: '', photoUri: undefined },
  contacts: [],
  lastTriage: null,
  lastHospitals: [],
  lastLocation: null,
  medicalInfo: DEFAULT_MEDICAL,
};

async function readPersisted(): Promise<PersistedState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PERSISTED;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      ...DEFAULT_PERSISTED,
      ...parsed,
      user: { ...DEFAULT_PERSISTED.user, ...(parsed.user ?? {}) },
      medicalInfo: { ...DEFAULT_MEDICAL, ...(parsed.medicalInfo ?? {}) },
    };
  } catch {
    return DEFAULT_PERSISTED;
  }
}

async function writePersisted(state: PersistedState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // swallow — persistence is best effort
  }
}

function persistedSnapshot(s: AppState): PersistedState {
  return {
    onboarding: s.onboarding,
    user: s.user,
    contacts: s.contacts,
    lastTriage: s.lastTriage,
    lastHospitals: s.lastHospitals,
    lastLocation: s.lastLocation,
    medicalInfo: s.medicalInfo,
  };
}

function dedupeAdd(list: string[], value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return list;
  if (list.some((x) => x.toLowerCase() === trimmed.toLowerCase())) return list;
  return [...list, trimmed];
}

export const useAppStore = create<AppState>((set, get) => ({
  ...DEFAULT_PERSISTED,
  apiKeys: { groq: '', googlePlaces: '' },
  hydrated: false,

  hydrate: async () => {
    const [persisted, stored] = await Promise.all([readPersisted(), loadApiKeys()]);
    const apiKeys = {
      groq: DEV_API_KEYS.groq.trim() || stored.groq,
      googlePlaces: DEV_API_KEYS.googlePlaces.trim() || stored.googlePlaces,
    };
    set({ ...persisted, apiKeys, hydrated: true });
  },

  completeOnboarding: () => {
    set((s) => ({ onboarding: { ...s.onboarding, hasCompletedOnboarding: true } }));
    writePersisted(persistedSnapshot(get()));
  },
  acceptDisclaimer: () => {
    set((s) => ({ onboarding: { ...s.onboarding, hasAcceptedDisclaimer: true } }));
    writePersisted(persistedSnapshot(get()));
  },
  resetOnboarding: () => {
    set({ onboarding: { hasCompletedOnboarding: false, hasAcceptedDisclaimer: false } });
    writePersisted(persistedSnapshot(get()));
  },

  setGroqKey: async (key) => {
    await saveGroqKey(key);
    set((s) => ({ apiKeys: { ...s.apiKeys, groq: key } }));
  },
  setPlacesKey: async (key) => {
    await savePlacesKey(key);
    set((s) => ({ apiKeys: { ...s.apiKeys, googlePlaces: key } }));
  },

  setUserName: (name) => {
    set((s) => ({ user: { ...s.user, name } }));
    writePersisted(persistedSnapshot(get()));
  },
  setUserPhoto: (uri) => {
    set((s) => ({ user: { ...s.user, photoUri: uri } }));
    writePersisted(persistedSnapshot(get()));
  },

  addContact: (c) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((s) => ({ contacts: [...s.contacts, { ...c, id }] }));
    writePersisted(persistedSnapshot(get()));
  },
  removeContact: (id) => {
    set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) }));
    writePersisted(persistedSnapshot(get()));
  },

  setTriageResult: (r) => {
    set({ lastTriage: r });
    writePersisted(persistedSnapshot(get()));
  },
  clearTriage: () => {
    set({ lastTriage: null });
    writePersisted(persistedSnapshot(get()));
  },

  setLastHospitals: (h) => {
    set({ lastHospitals: h });
    writePersisted(persistedSnapshot(get()));
  },
  setLastLocation: (l) => {
    set({ lastLocation: l });
    writePersisted(persistedSnapshot(get()));
  },

  setBloodType: (v) => {
    set((s) => ({ medicalInfo: { ...s.medicalInfo, bloodType: v.trim() || undefined } }));
    writePersisted(persistedSnapshot(get()));
  },
  addAllergy: (v) => {
    set((s) => ({ medicalInfo: { ...s.medicalInfo, allergies: dedupeAdd(s.medicalInfo.allergies, v) } }));
    writePersisted(persistedSnapshot(get()));
  },
  removeAllergy: (v) => {
    set((s) => ({ medicalInfo: { ...s.medicalInfo, allergies: s.medicalInfo.allergies.filter((x) => x !== v) } }));
    writePersisted(persistedSnapshot(get()));
  },
  addCondition: (v) => {
    set((s) => ({ medicalInfo: { ...s.medicalInfo, conditions: dedupeAdd(s.medicalInfo.conditions, v) } }));
    writePersisted(persistedSnapshot(get()));
  },
  removeCondition: (v) => {
    set((s) => ({ medicalInfo: { ...s.medicalInfo, conditions: s.medicalInfo.conditions.filter((x) => x !== v) } }));
    writePersisted(persistedSnapshot(get()));
  },
  addMedication: (v) => {
    set((s) => ({ medicalInfo: { ...s.medicalInfo, medications: dedupeAdd(s.medicalInfo.medications, v) } }));
    writePersisted(persistedSnapshot(get()));
  },
  removeMedication: (v) => {
    set((s) => ({ medicalInfo: { ...s.medicalInfo, medications: s.medicalInfo.medications.filter((x) => x !== v) } }));
    writePersisted(persistedSnapshot(get()));
  },
}));
