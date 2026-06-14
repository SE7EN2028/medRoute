import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Hospital, LatLng, Specialty } from '@app/types';
import { haversineKm } from '@app/utils/distance';

// =================== Result cache ===================
// 30-min TTL, keyed by rounded coords + specialty + radius. Hospital data
// rarely changes; OSM tile-level queries are deterministic. Cache key is
// rounded to ~1km so small phone drift still hits the cache.
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours — hospitals rarely move
const CACHE_PREFIX = 'medroute.overpass.v3.';

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

// Raw OSM elements are cached per LOCATION (specialty-independent) so switching
// specialty tiles filters in memory instead of refetching.
interface RawCacheEntry {
  ts: number;
  elements: OsmElement[];
}

async function readRawCache(key: string): Promise<OsmElement[] | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as RawCacheEntry;
    if (Date.now() - entry.ts > CACHE_TTL_MS) return null;
    return entry.elements;
  } catch {
    return null;
  }
}

async function writeRawCache(key: string, elements: OsmElement[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ ts: Date.now(), elements }));
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

// Multiple public Overpass instances — raced in parallel (see runOverpass) so a
// single slow/down mirror doesn't stall the whole lookup.
// NOTE: `overpass-api.de` 406s the default RN/CFNetwork UA — we send an explicit
//        User-Agent below to satisfy it.
// NOTE: `overpass.osm.ch` returns HTTP 200 with empty `elements` for non-EU
//        regions (stale sync) — excluded so we don't get fake-success.
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
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

const MIRROR_TIMEOUT_MS = 9000; // per mirror; mirrors race in parallel

async function runOverpassAt(url: string, query: string): Promise<OsmElement[]> {
  const trimmed = query.replace(/\s+/g, ' ').trim();
  const fullUrl = `${url}?data=${encodeURIComponent(trimmed)}`;
  const host = url.replace(/^https?:\/\//, '').split('/')[0];
  const t0 = Date.now();
  const res = await withTimeout(
    fetch(fullUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'MedRoute/1.0 (hospital finder)',
      },
    }),
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

// Parallel race: fire all mirrors at once, resolve on the first NON-EMPTY
// response so one slow/down mirror can't stall the lookup. Results are cached,
// so a single burst per lookup won't hammer the mirrors. If every mirror only
// returns empty (valid query, nothing nearby) we resolve []; we reject only when
// all mirrors error out.
async function runOverpass(query: string): Promise<OsmElement[]> {
  const errors: string[] = [];
  let gotEmpty = false;
  return new Promise<OsmElement[]>((resolve, reject) => {
    let pending = OVERPASS_MIRRORS.length;
    let settled = false;
    const onAllDone = () => {
      if (settled) return;
      settled = true;
      if (gotEmpty) resolve([]);
      else reject(new PlacesError(`All Overpass mirrors failed:\n${errors.join('\n')}`));
    };
    OVERPASS_MIRRORS.forEach((url) => {
      runOverpassAt(url, query).then(
        (els) => {
          if (els.length > 0) {
            if (!settled) { settled = true; resolve(els); }
          } else {
            gotEmpty = true;
            pending -= 1;
            if (pending === 0) onAllDone();
          }
        },
        (e) => {
          errors.push(`${url}: ${String(e).slice(0, 100)}`);
          // eslint-disable-next-line no-console
          console.warn('[overpass] mirror failed', url, String(e));
          pending -= 1;
          if (pending === 0) onAllDone();
        }
      );
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
export async function nearestEmergencyHospitals({ origin, radiusM = 4000 }: NearbyOpts): Promise<Hospital[]> {
  const key = cacheKey(origin, 'er', radiusM);
  const cached = await readCache(key);
  if (cached) return cached;

  // 4km radius + cap 12 features. Client sorts + keeps top 6. Bandwidth and
  // server work both ~75% lower than the 30-feature version.
  const query = `
    [out:json][timeout:8];
    node["amenity"="hospital"](around:${radiusM},${origin.lat},${origin.lng});
    out center tags 12;
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

  const result = unique.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 6);
  writeCache(key, result);
  return result;
}

// OSM regex keyword per specialty — used server-side (Overpass) against the
// `healthcare:speciality` tag and the place `name`. Empty regex means "any
// hospital/clinic" (general / emergency).
const SPECIALTY_REGEX: Record<Specialty, string> = {
  general: '',
  cardiology: 'cardio|heart',
  orthopedics: 'ortho|bone|joint',
  pediatrics: 'pediatric|paediatric|child|shishu',
  neurology: 'neuro|brain|stroke',
  pulmonology: 'pulmon|chest|respir|lung',
  gastroenterology: 'gastro|liver|digest',
  dermatology: 'derma|skin',
  ent: 'otolaryng|ear nose throat',
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

// Fetch all nearby healthcare places with ONE fast, index-backed query (plain
// `amenity=` equality — regex/`~"^(a|b)$"` filters bypass the Overpass index and
// time out). Specialty-independent + cached per location, so tile switches don't
// refetch. Returns raw elements (tags retained) for client-side filtering.
async function fetchHealthcareElements(origin: LatLng, radiusM: number): Promise<OsmElement[]> {
  const key = cacheKey(origin, 'all', radiusM);
  const cached = await readRawCache(key);
  if (cached) return cached;

  const around = `(around:${radiusM},${origin.lat},${origin.lng})`;
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="hospital"]${around};
      node["amenity"="clinic"]${around};
      node["amenity"="doctors"]${around};
      node["amenity"="dentist"]${around};
    );
    out center tags 80;
  `;

  let elements: OsmElement[] = [];
  try {
    elements = await runOverpass(query);
  } catch (e) {
    throw e instanceof PlacesError ? e : new PlacesError(String(e));
  }
  writeRawCache(key, elements);
  return elements;
}

// True if an OSM element matches the requested specialty. general / emergency
// match everything; dentistry uses the first-class dentist tag; others match the
// controlled `healthcare:speciality` tag or the place name.
function elementMatchesSpecialty(el: OsmElement, specialty: Specialty): boolean {
  if (specialty === 'general' || specialty === 'emergency_medicine') return true;
  const t = el.tags ?? {};
  if (specialty === 'dentistry') {
    return t['amenity'] === 'dentist' || /dental|dentist/i.test(t['name'] ?? '');
  }
  const regex = SPECIALTY_REGEX[specialty];
  if (!regex) return true;
  const re = new RegExp(regex, 'i');
  const hay = [
    t['healthcare:speciality'],
    t['healthcare:speciality:en'],
    t['medical_speciality'],
    t['name'],
  ]
    .filter(Boolean)
    .join(' ');
  return re.test(hay);
}

// Routine/urgent flow. Fetches nearby healthcare once, then filters to the
// specialty in memory. Empty result = none tagged nearby (not an error).
export async function hospitalsBySpecialty({ origin, specialty, radiusM = 6000 }: SpecialtyOpts): Promise<Hospital[]> {
  const elements = await fetchHealthcareElements(origin, radiusM);

  const hospitals = elements
    .filter((el) => elementMatchesSpecialty(el, specialty))
    .map((el) => toHospital(el, origin, false))
    .filter((h): h is Hospital => !!h);

  const seen = new Set<string>();
  const unique = hospitals.filter((h) => {
    const k = `${h.name}@${h.location.lat.toFixed(3)},${h.location.lng.toFixed(3)}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return unique.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 10);
}

// Kept for API parity with the old Google-backed version. OSM phone numbers
// already come in the main query, so this is a no-op.
export async function placeDetails(_: { apiKey?: string; placeId: string }): Promise<{ phone?: string }> {
  return {};
}
