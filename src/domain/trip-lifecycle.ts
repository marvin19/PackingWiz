import { parseDate, toIsoDate } from '@/domain/dates';
import type { Trip, TripStatus } from '@/domain/trip';

/** Date-derived lifecycle bucket for committed trips (drafts excluded). */
export type TripLifecycleBucket = 'upcoming' | 'past';

export type TripLifecycleMutation = 'permanent_delete';

export type ActiveTripReconciliation = {
  activeTripId: string | null;
  activePackingListId: string | null;
};

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Calendar-day rule for Upcoming vs Previous:
 * - endDate strictly before the reference day → Previous (`past`)
 * - endDate on or after the reference day → Upcoming (includes trips ending today)
 */
export function deriveTripDateBucket(trip: Trip, referenceDate: Date): TripStatus {
  const referenceDay = startOfLocalDay(referenceDate).getTime();
  const endDay = startOfLocalDay(parseDate(trip.endDate)).getTime();
  return endDay < referenceDay ? 'past' : 'upcoming';
}

export function classifyTripLifecycle(trip: Trip, referenceDate: Date): TripLifecycleBucket {
  return deriveTripDateBucket(trip, referenceDate);
}

export function isUpcomingTrip(trip: Trip, referenceDate: Date): boolean {
  return classifyTripLifecycle(trip, referenceDate) === 'upcoming';
}

/** Product "Previous" trips — stored status bucket `past`. */
export function isPreviousTrip(trip: Trip, referenceDate: Date): boolean {
  return classifyTripLifecycle(trip, referenceDate) === 'past';
}

/** Clears active trip/list when the deleted trip was active; never auto-selects another trip. */
export function reconcileActiveTripAfterLifecycleChange(
  activeTripId: string | null,
  activePackingListId: string | null,
  affectedTripId: string,
  mutation: TripLifecycleMutation,
): ActiveTripReconciliation {
  if (mutation !== 'permanent_delete') {
    return { activeTripId, activePackingListId };
  }

  if (activeTripId !== affectedTripId) {
    return { activeTripId, activePackingListId };
  }

  return {
    activeTripId: null,
    activePackingListId: null,
  };
}

/** Reference ISO date (yyyy-mm-dd) helper for deterministic tests. */
export function referenceDateFromIso(iso: string): Date {
  return parseDate(iso);
}

/** Sort previous trips with most recent end dates first; tie-break by id desc. */
export function compareTripsByRecentEndDate(left: Trip, right: Trip): number {
  const byEndDate = right.endDate.localeCompare(left.endDate);
  if (byEndDate !== 0) {
    return byEndDate;
  }

  return right.id.localeCompare(left.id);
}

/** Sort upcoming trips with nearest start dates first; tie-break by id asc. */
export function compareTripsByNearestStartDate(left: Trip, right: Trip): number {
  const byStartDate = left.startDate.localeCompare(right.startDate);
  if (byStartDate !== 0) {
    return byStartDate;
  }

  return left.id.localeCompare(right.id);
}

export function todayIsoDate(referenceDate: Date = new Date()): string {
  return toIsoDate(referenceDate);
}
