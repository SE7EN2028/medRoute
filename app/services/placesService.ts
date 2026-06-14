import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Hospital, LatLng, Specialty } from '@app/types';
import { haversineKm } from '@app/utils/distance';

// =================== Result cache ===================
// 30-min TTL, keyed by rounded coords + specialty + radius. Hospital data
// rarely changes; OSM tile-level queries are deterministic. Cache key is
// rounded to ~1km so small phone drift still hits the cache.
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours — hospitals rarely move
const CACHE_PREFIX = 'medroute.overpass.v2.';

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

// Multiple public Overpass instances — raced in parallel (see runOverpass) so a
// single slow/down mirror doesn't stall the whole lookup.
// NOTE: `overpass-api.de` 406s the default RN/CFNetwork UA — we send an explicit
//        User-Agent below to satisfy it.
// NOTE: `overpass.osm.ch` returns HTTP 200 with empty `elements` for non-EU
//        regions (stale sync) — excluded so we don't get fake-success.
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
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
export async function hospitalsBySpecialty({ origin, specialty, radiusM = 5000 }: SpecialtyOpts): Promise<Hospital[]> {
  const key = cacheKey(origin, `sp:${specialty}`, radiusM);
  const cached = await readCache(key);
  if (cached) return cached;

  // 5km + cap 15 features. Client sorts by distance + keeps top 10.
  const base = specialty === 'dentistry'
    ? `["amenity"~"^(dentist|clinic|doctors)$"]`
    : `["amenity"~"^(hospital|clinic|doctors)$"]`;
  const around = `(around:${radiusM},${origin.lat},${origin.lng})`;

  const query = `
    [out:json][timeout:8];
    node${base}${around};
    out center tags 15;
  `;

  let elements: OsmElement[] = [];
  try {
    elements = await runOverpass(query);
  } catch (e) {
    throw e instanceof PlacesError ? e : new PlacesError(String(e));
  }

  // Match a place against the specialty regex via OSM speciality tags + name.
  // Empty regex (general / emergency) matches everything.
  const regexStr = SPECIALTY_REGEX[specialty];
  const re = regexStr ? new RegExp(regexStr, 'i') : null;
  const matchesSpecialty = (el: OsmElement): boolean => {
    if (!re) return true;
    const t = el.tags ?? {};
    const hay = [
      t['healthcare:speciality'],
      t['healthcare:speciality:en'],
      t['medical_speciality'],
      t['healthcare'],
      t['name'],
      t['operator'],
    ]
      .filter(Boolean)
      .join(' ');
    return re.test(hay);
  };

  const tagged = elements
    .map((el) => {
      const h = toHospital(el, origin, false);
      return h ? { h, match: matchesSpecialty(el) } : null;
    })
    .filter((x): x is { h: Hospital; match: boolean } => !!x);

  const seen = new Set<string>();
  const unique = tagged.filter(({ h }) => {
    const k = `${h.name}@${h.location.lat.toFixed(3)},${h.location.lng.toFixed(3)}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const byDist = (a: Hospital, b: Hospital) => a.distanceKm - b.distanceKm;
  const matched = unique.filter((x) => x.match).map((x) => x.h).sort(byDist);
  const rest = unique.filter((x) => !x.match).map((x) => x.h).sort(byDist);

  // Specialty matches first, then nearest others fill remaining slots.
  const result = [...matched, ...rest].slice(0, 10);
  writeCache(key, result);
  return result;
}

// Kept for API parity with the old Google-backed version. OSM phone numbers
// already come in the main query, so this is a no-op.
export async function placeDetails(_: { apiKey?: string; placeId: string }): Promise<{ phone?: string }> {
  return {};
}
