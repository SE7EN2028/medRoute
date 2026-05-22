import * as Location from 'expo-location';
import type { LatLng } from '@app/types';

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
