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
