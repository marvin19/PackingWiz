import { parseDate, toIsoDate } from '@/domain/dates';
import type { Trip, TripStatus } from '@/domain/trip';

/** User-visible lifecycle bucket for committed trips (drafts are excluded). */
export type TripLifecycleBucket = 'upcoming' | 'past' | 'archived';

export type TripLifecycleMutation = 'archive' | 'permanent_delete' | 'restore';

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
export function deriveTripDateBucket(trip: Trip, referenceDate: Date): Exclude<TripStatus, 'archived'> {
  const referenceDay = startOfLocalDay(referenceDate).getTime();
  const endDay = startOfLocalDay(parseDate(trip.endDate)).getTime();
  return endDay < referenceDay ? 'past' : 'upcoming';
}

export function isArchivedTrip(trip: Trip): boolean {
  return trip.status === 'archived';
}

export function classifyTripLifecycle(trip: Trip, referenceDate: Date): TripLifecycleBucket {
  if (isArchivedTrip(trip)) {
    return 'archived';
  }

  return deriveTripDateBucket(trip, referenceDate);
}

export function isUpcomingTrip(trip: Trip, referenceDate: Date): boolean {
  return classifyTripLifecycle(trip, referenceDate) === 'upcoming';
}

/** Product "Previous" trips — stored status bucket `past`. */
export function isPreviousTrip(trip: Trip, referenceDate: Date): boolean {
  return classifyTripLifecycle(trip, referenceDate) === 'past';
}

/** Persisted status for a non-archived trip from its dates. */
export function statusForRestoredTrip(trip: Trip, referenceDate: Date): Exclude<TripStatus, 'archived'> {
  return deriveTripDateBucket(trip, referenceDate);
}

/**
 * Archive a committed trip — lifecycle metadata only; full nested snapshot preserved.
 * Idempotent when already archived.
 */
export function archiveTrip(trip: Trip): Trip {
  if (isArchivedTrip(trip)) {
    return trip;
  }

  return {
    ...trip,
    status: 'archived',
  };
}

/**
 * Restore an archived trip — returns trip to date-derived Upcoming/Previous status.
 * Idempotent when not archived (status unchanged).
 */
export function restoreArchivedTrip(trip: Trip, referenceDate: Date = new Date()): Trip {
  if (!isArchivedTrip(trip)) {
    return trip;
  }

  return {
    ...trip,
    status: statusForRestoredTrip(trip, referenceDate),
  };
}

/** Clears active trip/list when the affected trip was active; never auto-selects another trip. */
export function reconcileActiveTripAfterLifecycleChange(
  activeTripId: string | null,
  activePackingListId: string | null,
  affectedTripId: string,
  mutation: TripLifecycleMutation,
): ActiveTripReconciliation {
  if (mutation === 'restore') {
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

/** Sort previous/archived trips with most recent end dates first; tie-break by id desc. */
export function compareTripsByRecentEndDate(left: Trip, right: Trip): number {
  const byEndDate = right.endDate.localeCompare(left.endDate);
  if (byEndDate !== 0) {
    return byEndDate;
  }

  return right.id.localeCompare(left.id);
}

export function todayIsoDate(referenceDate: Date = new Date()): string {
  return toIsoDate(referenceDate);
}
