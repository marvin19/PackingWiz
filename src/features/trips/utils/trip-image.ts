import type { ImageSource } from 'expo-image';

import type { Trip } from '@/domain/trip';
import {
  getTripContextIcon,
  getTripContextTint,
} from '@/features/trips/utils/trip-context-icon';

/**
 * Local asset registry for trip hero images.
 * Add entries here as destination artwork becomes available.
 */
const TRIP_IMAGE_BY_ID: Partial<Record<string, ImageSource>> = {
  // 'tokyo-kyoto': require('@/assets/images/trips/tokyo.png'),
};

export function getTripImageSource(trip: Trip): ImageSource | null {
  if (trip.image) {
    // Reserved for future keyed local assets mapped from trip.image paths.
  }
  return TRIP_IMAGE_BY_ID[trip.id] ?? null;
}

export function getTripPlaceholderTint(trip: Trip): string {
  const primaryTag = trip.tripContext[0];
  return getTripContextTint(primaryTag);
}

export function getTripPrimaryIcon(trip: Trip) {
  return getTripContextIcon(trip.tripContext[0]);
}
