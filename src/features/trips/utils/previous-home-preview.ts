import type { Trip } from '@/domain/trip';
import { listPreviousTrips } from '@/domain/trip-selectors';

export const HOME_PREVIOUS_PREVIEW_LIMIT = 2;

export type HomePreviousPreview = {
  visibleTrips: Trip[];
  totalCount: number;
  hasMore: boolean;
};

export function getHomePreviousPreview(
  trips: Trip[],
  limit: number = HOME_PREVIOUS_PREVIEW_LIMIT,
  referenceDate: Date = new Date(),
): HomePreviousPreview {
  const ordered = listPreviousTrips(trips, referenceDate);

  return {
    visibleTrips: ordered.slice(0, limit),
    totalCount: ordered.length,
    hasMore: ordered.length > limit,
  };
}

export function buildViewAllPreviousTripsLabel(totalCount: number): string {
  return `View all previous trips (${totalCount})`;
}

export function buildViewAllPreviousTripsAccessibilityLabel(totalCount: number): string {
  return `View all ${totalCount} previous trips`;
}
