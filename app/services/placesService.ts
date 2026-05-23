import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Hospital, LatLng, Specialty } from '@app/types';
import { haversineKm } from '@app/utils/distance';

// =================== Result cache ===================
// 30-min TTL, keyed by rounded coords + specialty + radius. Hospital data
// rarely changes; OSM tile-level queries are deterministic. Cache key is
// rounded to ~1km so small phone drift still hits the cache.
const CACHE_TTL_MS = 30 * 60 * 1000;
const CACHE_PREFIX = 'medroute.overpass.v1.';

interface CacheEntry {
  ts: number;
  hospitals: Hospital[];
}

function cacheKey(origin: LatLng, kind: string, radiusM: number): string {
  const lat = origin.lat.toFixed(2); // ~1.1km bucket
  const lng = origin.lng.toFixed(2);
  return `${CACHE_PREFIX}${kind}@${lat},${lng}@${radiusM}`;
}

async function readCache(key: string): Promise<Hospital[] | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() - entry.ts > CACHE_TTL_MS) return null;
    return entry.hospitals;
  } catch {
    return null;
  }
}

async function writeCache(key: string, hospitals: Hospital[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ ts: Date.now(), hospitals }));
  } catch {
    // swallow
  }
}

// =============================================================================
// OpenStreetMap-backed hospital lookup. Free, no API key.
// -----------------------------------------------------------------------------
// Uses Overpass API (https://overpass-api.de) for nearby search and Nominatim
// (https://nominatim.openstreetmap.org) for per-place geocoding when needed.
//
// Limits to respect:
//   - Overpass: a few req/sec is fine; we set a small per-call timeout.
//   - Nominatim: 1 req/sec, User-Agent required.
//
// The function signatures still accept `apiKey` for back-compat with the rest
// of the app — it's ignored. Pass an empty string.
// =============================================================================

// Multiple public Overpass instances — we try them in order so a single mirror
// outage doesn't break the app.
// Public Overpass mirrors that accept requests without a custom User-Agent.
// NOTE: `overpass-api.de` returns HTTP 406 to default RN/CFNetwork UA.
// NOTE: `overpass.osm.ch` returns HTTP 200 but with empty `elements` arrays
//        for non-EU regions (stale sync) — excluded so we don't get fake-success.
const OVERPASS_MIRRORS = [
  'https://overpass.openstreetmap.fr/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

export class PlacesError extends Error {}

// OSM tags we map into our Hospital shape.
interface OsmElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements?: OsmElement[];
}

function coordsOf(el: OsmElement): { lat: number; lng: number } | null {
  if (typeof el.lat === 'number' && typeof el.lon === 'number') {
    return { lat: el.lat, lng: el.lon };
  }
  if (el.center) return { lat: el.center.lat, lng: el.center.lon };
  return null;
}

function addressOf(t: Record<string, string>): string {
  const parts = [
    t['addr:housenumber'],
    t['addr:street'],
    t['addr:suburb'] ?? t['addr:neighbourhood'],
    t['addr:city'] ?? t['addr:town'] ?? t['addr:village'],
    t['addr:postcode'],
  ].filter(Boolean);
  if (parts.length > 0) return parts.join(', ');
  return t['addr:full'] ?? '';
}

function phoneOf(t: Record<string, string>): string | undefined {
  return t['phone'] ?? t['contact:phone'] ?? t['phone:mobile'];
}

function toHospital(el: OsmElement, origin: LatLng, isEmergency: boolean): Hospital | null {
  const c = coordsOf(el);
  if (!c) return null;
  const t = el.tags ?? {};
  const name = t['name'] ?? t['operator'] ?? '(Unnamed clinic)';
  return {
    placeId: `${el.type}/${el.id}`,
    name,
    address: addressOf(t),
    location: c,
    distanceKm: haversineKm(origin, c),
    phone: phoneOf(t),
    isEmergency,
  };
}

// Wrap fetch in a manual Promise.race timeout because AbortController is flaky
// on older RN runtimes.
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new PlacesError(`${label} timed out after ${ms}ms`)), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

const MIRROR_TIMEOUT_MS = 25000; // RN's first-hit fetch can be slow (DNS+TLS+OS overhead); give wide margin

async function runOverpassAt(url: string, query: string, signal: AbortSignal): Promise<OsmElement[]> {
  const trimmed = query.replace(/\s+/g, ' ').trim();
  // GET ?data=... — lighter than POST + form body in React Native.
  const fullUrl = `${url}?data=${encodeURIComponent(trimmed)}`;
  const host = url.replace(/^https?:\/\//, '').split('/')[0];
  const t0 = Date.now();
  const res = await withTimeout(
    fetch(fullUrl, { method: 'GET', signal }),
    MIRROR_TIMEOUT_MS,
    `Overpass ${host}`,
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new PlacesError(`Overpass HTTP ${res.status} @ ${host}: ${text.slice(0, 120)}`);
  }
  const data = (await res.json()) as OverpassResponse;
  // eslint-disable-next-line no-console
  console.log(`[overpass] ${host} ok ${Date.now() - t0}ms ${(data.elements ?? []).length} elements`);
  return data.elements ?? [];
}

// Race all mirrors in parallel — first successful response wins. Once one
// succeeds, in-flight stragglers are aborted so no socket leaks. If every
// mirror fails, the overall failure surfaces after MIRROR_TIMEOUT_MS at most.
async function runOverpass(query: string): Promise<OsmElement[]> {
  const errors: string[] = [];
  const controllers = OVERPASS_MIRRORS.map(() => new AbortController());
  return new Promise<OsmElement[]>((resolve, reject) => {
    let resolved = false;
    let pendingCount = OVERPASS_MIRRORS.length;
    OVERPASS_MIRRORS.forEach((url, i) => {
      runOverpassAt(url, query, controllers[i].signal)
        .then((result) => {
          if (resolved) return;
          resolved = true;
          // Abort any other still-pending mirrors so they don't waste sockets.
          controllers.forEach((c, j) => { if (j !== i) c.abort(); });
          resolve(result);
        })
        .catch((err) => {
          errors.push(`${url}: ${String(err).slice(0, 100)}`);
          // eslint-disable-next-line no-console
          console.warn('[overpass] mirror failed', url, String(err));
          pendingCount -= 1;
          if (pendingCount === 0 && !resolved) {
            reject(new PlacesError(`All Overpass mirrors failed:\n${errors.join('\n')}`));
          }
        });
    });
  });
}

interface NearbyOpts {
  apiKey?: string; // ignored
  origin: LatLng;
  radiusM?: number;
}

// Used for emergency flow — any hospital, sorted by distance. Prefer ones
// tagged emergency=yes when available.
export async function nearestEmergencyHospitals({ origin, radiusM = 6000 }: NearbyOpts): Promise<Hospital[]> {
  const key = cacheKey(origin, 'er', radiusM);
  const cached = await readCache(key);
  if (cached) return cached;

  // `out center tags 30;` caps response at 30 features for speed. Drop ways —
  // nodes alone give us 90% of hospitals and are far faster.
  const query = `
    [out:json][timeout:8];
    node["amenity"="hospital"](around:${radiusM},${origin.lat},${origin.lng});
    out center tags 30;
  `;
  let elements: OsmElement[];
  try {
    elements = await runOverpass(query);
  } catch (e) {
    throw e instanceof PlacesError ? e : new PlacesError(String(e));
  }
  const hospitals = elements
    .map((el) => toHospital(el, origin, true))
    .filter((h): h is Hospital => !!h);

  const seen = new Set<string>();
  const unique = hospitals.filter((h) => {
    const k = `${h.name}@${h.location.lat.toFixed(3)},${h.location.lng.toFixed(3)}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const result = unique.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 8);
  writeCache(key, result);
  return result;
}

// OSM regex keyword per specialty — matched against both `healthcare:speciality`
// and the place `name`. Empty regex means "any hospital/clinic" (general/ER).
const SPECIALTY_REGEX: Record<Specialty, string> = {
  general: '',
  cardiology: 'cardio|heart',
  orthopedics: 'ortho|bone|joint',
  pediatrics: 'pediatric|paediatric|child|shishu',
  neurology: 'neuro|brain|stroke',
  pulmonology: 'pulmon|chest|respir|lung',
  gastroenterology: 'gastro|liver|digest',
  dermatology: 'derma|skin',
  ent: 'ent|otolaryng|ear nose throat',
  ophthalmology: 'eye|ophthal|netra',
  dentistry: 'dent|tooth|teeth|oral|denta',
  obgyn: 'gyn|obstet|maternity|matru',
  psychiatry: 'psych|mental|mind',
  urology: 'urolog|kidney|nephro',
  oncology: 'oncolog|cancer',
  toxicology: 'poison|toxic',
  emergency_medicine: '',
};

interface SpecialtyOpts {
  apiKey?: string; // ignored
  origin: LatLng;
  specialty: Specialty;
  radiusM?: number;
}

// Used for routine/urgent flow. For specialties with a regex, we filter by
// healthcare:speciality OR name match. Falls back to ALL nearby hospitals/
// clinics if the filtered list is too short (OSM tag coverage is uneven).
export async function hospitalsBySpecialty({ origin, specialty, radiusM = 8000 }: SpecialtyOpts): Promise<Hospital[]> {
  const key = cacheKey(origin, `sp:${specialty}`, radiusM);
  const cached = await readCache(key);
  if (cached) return cached;

  const re = SPECIALTY_REGEX[specialty];
  const base = specialty === 'dentistry'
    ? `["amenity"~"^(dentist|clinic|doctors)$"]`
    : `["amenity"~"^(hospital|clinic|doctors)$"]`;
  const around = `(around:${radiusM},${origin.lat},${origin.lng})`;

  // Single-query approach using nodes only (90% coverage, 5–10x faster than
  // including ways). `out center tags 50;` caps response size.
  const filteredQuery = re
    ? `
      [out:json][timeout:10];
      (
        node${base}["healthcare:speciality"~"${re}",i]${around};
        node${base}["name"~"${re}",i]${around};
      );
      out center tags 50;
    `
    : `
      [out:json][timeout:10];
      node${base}${around};
      out center tags 50;
    `;

  let elements: OsmElement[] = [];
  try {
    elements = await runOverpass(filteredQuery);
  } catch (e) {
    throw e instanceof PlacesError ? e : new PlacesError(String(e));
  }

  // Fallback only if filtered list is empty.
  if (re && elements.length === 0) {
    const fallback = `
      [out:json][timeout:10];
      node${base}${around};
      out center tags 30;
    `;
    try {
      elements = await runOverpass(fallback);
    } catch {
      // ignore — show what we have
    }
  }

  const hospitals = elements
    .map((el) => toHospital(el, origin, false))
    .filter((h): h is Hospital => !!h);

  const seen = new Set<string>();
  const unique = hospitals.filter((h) => {
    const k = `${h.name}@${h.location.lat.toFixed(3)},${h.location.lng.toFixed(3)}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const result = unique.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 20);
  writeCache(key, result);
  return result;
}

// Kept for API parity with the old Google-backed version. OSM phone numbers
// already come in the main query, so this is a no-op.
export async function placeDetails(_: { apiKey?: string; placeId: string }): Promise<{ phone?: string }> {
  return {};
}
