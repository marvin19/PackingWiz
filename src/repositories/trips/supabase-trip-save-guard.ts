import type { Trip } from '@/domain/trip';

export const SUPABASE_MULTI_LIST_SAVE_ERROR =
  'Multi-person trip edits are not supported in Supabase mode until MP5 persistence. Use mock persistence.';

/**
 * Guard for SupabaseTripRepository.save() updates (MP5A).
 *
 * Intended semantics until nested PackingList persistence exists:
 *
 * A. Single-list trip, metadata-only edit → allowed (list count unchanged, one list)
 * B. Single-list trip, any save with list count unchanged → allowed
 * C. Multi-list trip, metadata-only shared edit → rejected (flat schema cannot
 *    round-trip secondary lists; a successful save would misrepresent persistence)
 * D. Multi-list trip, add/remove traveller → rejected (list count change and/or
 *    multiple lists)
 * E. Multi-list trip, ordinary save from unrelated code → rejected whenever either
 *    side has more than one list, even if counts match
 *
 * New trips with multiple lists remain blocked by createTrip().
 */
export function assertSupabaseTripSaveSupported(existing: Trip, trip: Trip): void {
  const listCountChanged = existing.packingLists.length !== trip.packingLists.length;
  const involvesMultipleLists =
    existing.packingLists.length > 1 || trip.packingLists.length > 1;

  if (involvesMultipleLists || listCountChanged) {
    throw new Error(SUPABASE_MULTI_LIST_SAVE_ERROR);
  }
}
