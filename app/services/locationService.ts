import * as Location from 'expo-location';
import type { LatLng } from '@app/types';

// Default city center used when device location is unavailable. Bengaluru is a
// dense city so OSM hospital lookups always return results for the demo.
export const DEFAULT_LOCATION: LatLng = { lat: 12.9716, lng: 77.5946 };

export class LocationError extends Error {
  code: 'permission' | 'unavailable' | 'timeout';
  constructor(message: string, code: LocationError['code']) {
    super(message);
    this.name = 'LocationError';
    this.code = code;
  }
}

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getCurrentLocation(): Promise<LatLng> {
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status !== 'granted') {
    const ok = await requestLocationPermission();
    if (!ok) throw new LocationError('Location permission denied', 'permission');
  }
  try {
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch (err) {
    throw new LocationError(`Location unavailable: ${String(err)}`, 'unavailable');
  }
}

// Best-effort cached / last-known position. Useful on emergency screen.
export async function getLastKnownLocation(): Promise<LatLng | null> {
  try {
    const pos = await Location.getLastKnownPositionAsync({});
    if (!pos) return null;
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return null;
  }
}

export type LocationSource = 'manual' | 'device' | 'default';

/**
 * Resolution order: manual override → device GPS → DEFAULT_LOCATION.
 * Always resolves so hospital screens never hard-error when the user dismisses
 * the permission prompt.
 */
export async function getLocationOrDefault(
  manual?: LatLng | null
): Promise<{ location: LatLng; source: LocationSource }> {
  if (manual) return { location: manual, source: 'manual' };
  try {
    const last = await getLastKnownLocation();
    if (last) return { location: last, source: 'device' };
    const live = await getCurrentLocation();
    return { location: live, source: 'device' };
  } catch {
    return { location: DEFAULT_LOCATION, source: 'default' };
  }
}
