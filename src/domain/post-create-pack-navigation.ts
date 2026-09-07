import type { Trip } from '@/domain/trip';
import { resolveTripPackEntry } from '@/domain/trip-pack-entry';

export type PostCreatePackHref = '/(tabs)/pack' | '/(tabs)/pack/select-list';

/** Resolve Pack tab href after a successful trip commit — persistence-mode agnostic. */
export function resolvePostCreatePackHref(trip: Trip): PostCreatePackHref {
  const entry = resolveTripPackEntry(trip.id, null, null, [trip]);
  return entry.destination === 'select-list' ? '/(tabs)/pack/select-list' : '/(tabs)/pack';
}

/** Returns Pack navigation target only when commit succeeded. */
export function resolvePostCreateNavigationAfterCommit(
  result: { ok: true; trip: Trip } | { ok: false },
): PostCreatePackHref | null {
  if (!result.ok) {
    return null;
  }

  return resolvePostCreatePackHref(result.trip);
}
