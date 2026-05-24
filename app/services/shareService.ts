import { Linking, Share, Platform } from 'react-native';
import type { Hospital } from '@app/types';

export interface ShareArgs {
  hospital: Hospital;
  condition: string;
}

function mapsLink(h: Hospital): string {
  // Only include query_place_id when it looks like a real Google Place ID
  // (starts with "ChIJ"). Our mock IDs (e.g. "c18", "b3") would 400 the URL.
  const validPlaceId = typeof h.placeId === 'string' && h.placeId.startsWith('ChIJ');
  const base = `https://www.google.com/maps/search/?api=1&query=${h.location.lat},${h.location.lng}`;
  return validPlaceId ? `${base}&query_place_id=${h.placeId}` : base;
}

export function buildShareMessage({ hospital, condition }: ShareArgs): string {
  const cond = condition.trim() || 'a health concern';
  return `I'm going to ${hospital.name} for ${cond}. Location: ${mapsLink(hospital)}. Please come if you can. — Sent from MedRoute`;
}

// Try WhatsApp first, fall back to native share sheet. Optional phone targets
// the message to a specific emergency contact.
export async function shareViaWhatsApp(args: ShareArgs, phone?: string): Promise<'whatsapp' | 'native'> {
  const message = buildShareMessage(args);
  const encoded = encodeURIComponent(message);
  const url = phone
    ? `whatsapp://send?phone=${phone.replace(/[^\d+]/g, '')}&text=${encoded}`
    : `whatsapp://send?text=${encoded}`;
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
    return 'whatsapp';
  }
  await Share.share({ message });
  return 'native';
}

export function callNumber(phone: string): Promise<void> {
  const cleaned = phone.replace(/\s|-/g, '');
  const url = Platform.select({
    ios: `telprompt:${cleaned}`,
    android: `tel:${cleaned}`,
    default: `tel:${cleaned}`,
  });
  return Linking.openURL(url);
}

export function openDirections(h: Hospital): Promise<void> {
  return Linking.openURL(mapsLink(h));
}
