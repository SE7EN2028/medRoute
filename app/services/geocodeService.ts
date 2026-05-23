import type { LatLng } from '@app/types';

// Nominatim is OSM's free geocoder. Strict rate limit: 1 req/sec + UA header.
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const UA = 'MedRoute/0.1 (https://github.com/medroute/app)';

export interface GeocodeHit {
  label: string;
  location: LatLng;
}

export class GeocodeError extends Error {}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export async function geocodeQuery(text: string): Promise<GeocodeHit | null> {
  const q = text.trim();
  if (!q) throw new GeocodeError('Empty query');
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(q)}&format=json&limit=1&addressdetails=0`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) throw new GeocodeError(`Geocode HTTP ${res.status}`);
  const arr = (await res.json()) as NominatimResult[];
  if (!arr.length) return null;
  const r = arr[0];
  return {
    label: r.display_name,
    location: { lat: parseFloat(r.lat), lng: parseFloat(r.lon) },
  };
}

const REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';

interface ReverseResult {
  display_name: string;
  address?: {
    suburb?: string;
    neighbourhood?: string;
    village?: string;
    city?: string;
    town?: string;
    state?: string;
  };
}

/** Lat/lng → human-readable label via Nominatim reverse geocoder. */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = `${REVERSE_URL}?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=14`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (!res.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    const r = (await res.json()) as ReverseResult;
    return r.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}
