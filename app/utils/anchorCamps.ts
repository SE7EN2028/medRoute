import type { BloodCamp, LatLng } from '@app/types';
import { MOCK_BLOOD_CAMPS } from '@app/data/camps';
import { haversineKm } from './distance';

// Deterministic per-id offsets in lat/lng degrees. ~0.011° ≈ 1.2 km.
// Generated once so the same camp always lands in the same direction.
function hashOffset(id: string): { dLat: number; dLng: number } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  // pseudo-uniform within ~5km radius
  const angle = (Math.abs(h) % 360) * (Math.PI / 180);
  const dist = 0.005 + ((Math.abs(h >> 3) % 50) / 1000); // 0.005 – 0.055 deg
  return { dLat: Math.sin(angle) * dist, dLng: Math.cos(angle) * dist };
}

/**
 * Re-anchor mock camps to the user's actual location. Each camp gets a
 * deterministic offset (same camp = same offset) so the list feels stable.
 * Returns camps sorted by distance from origin.
 */
export function anchorCampsTo(origin: LatLng): BloodCamp[] {
  return MOCK_BLOOD_CAMPS
    .map((c) => {
      const off = hashOffset(c.id);
      return {
        ...c,
        location: { lat: origin.lat + off.dLat, lng: origin.lng + off.dLng },
      };
    })
    .sort((a, b) => haversineKm(origin, a.location) - haversineKm(origin, b.location));
}
