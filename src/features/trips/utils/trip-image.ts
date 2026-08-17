import type { ImageSource } from 'expo-image';

import type { Trip, TripTypeId } from '@/domain/trip';

/**
 * Local asset registry for trip hero images.
 * Add entries here as destination artwork becomes available.
 */
const TRIP_IMAGE_BY_ID: Partial<Record<string, ImageSource>> = {
  // 'tokyo-kyoto': require('@/assets/images/trips/tokyo.png'),
};

const PLACEHOLDER_TINTS: Record<TripTypeId, string> = {
  vacation: '#D4E8E6',
  business: '#DDE3EA',
  city: '#E0E4EC',
  beach: '#E8DFCF',
  outdoor: '#D8E6DA',
  training: '#E2E6DE',
  race: '#E5E0EC',
  ski: '#DDE4EE',
  camping: '#E0E8DA',
  family: '#E8E4DC',
  other: '#E5EAE9',
};

export function getTripImageSource(trip: Trip): ImageSource | null {
  if (trip.image) {
    // Reserved for future keyed local assets mapped from trip.image paths.
  }
  return TRIP_IMAGE_BY_ID[trip.id] ?? null;
}

export function getTripPlaceholderTint(trip: Trip): string {
  const primaryType = trip.types[0] ?? 'vacation';
  return PLACEHOLDER_TINTS[primaryType];
}
