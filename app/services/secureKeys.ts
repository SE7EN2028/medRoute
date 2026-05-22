import * as SecureStore from 'expo-secure-store';
import type { ApiKeys } from '@app/types';

const GROQ_KEY = 'medroute.groqKey';
const PLACES_KEY = 'medroute.placesKey';

export async function loadApiKeys(): Promise<ApiKeys> {
  const [groq, places] = await Promise.all([
    SecureStore.getItemAsync(GROQ_KEY),
    SecureStore.getItemAsync(PLACES_KEY),
  ]);
  return { groq: groq ?? '', googlePlaces: places ?? '' };
}

export async function saveGroqKey(value: string): Promise<void> {
  if (value) await SecureStore.setItemAsync(GROQ_KEY, value);
  else await SecureStore.deleteItemAsync(GROQ_KEY);
}

export async function savePlacesKey(value: string): Promise<void> {
  if (value) await SecureStore.setItemAsync(PLACES_KEY, value);
  else await SecureStore.deleteItemAsync(PLACES_KEY);
}
