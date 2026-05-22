// =============================================================================
// DEV-ONLY API KEYS — TEMPLATE
// -----------------------------------------------------------------------------
// Copy this file to `apiKeys.ts` and paste your keys for local testing.
// `apiKeys.ts` is gitignored — DO NOT COMMIT real keys.
//
// At runtime, if a key here is non-empty, it OVERRIDES anything the user
// entered via Profile → API keys. Leave empty ("") to force using the
// in-app Profile screen / expo-secure-store value.
//
// For production: remove these constants and proxy all calls through a
// backend that holds the keys server-side.
// =============================================================================

export const DEV_API_KEYS = {
  groq: '',
  googlePlaces: '',
} as const;

export function hasDevKey(k: keyof typeof DEV_API_KEYS): boolean {
  return DEV_API_KEYS[k].trim().length > 0;
}
