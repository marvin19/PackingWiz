import {
  buildReusedTrip,
  type BuildReusedTripInput,
  type TripReuseListSelection,
  type TripReuseSharedDetails,
} from '@/domain/trip-reuse';
import type { Trip } from '@/domain/trip';
import type { TripRepository } from '@/repositories/trips/trip-repository';
import { SUPABASE_MULTI_LIST_SAVE_ERROR } from '@/repositories/trips/supabase-trip-save-guard';

export type ReuseTripInput = TripReuseListSelection & {
  sharedDetails: TripReuseSharedDetails;
  referenceDate?: Date;
};

export type ReuseTripDependencies = {
  tripRepository: TripRepository;
};

/**
 * Create a new Trip by reusing packing-list content from an existing Trip.
 *
 * No PackingGenerator, InsightGenerator, weather fetch, or Important injection.
 * Source trip is never mutated; persistence happens only after the aggregate is built.
 */
export async function reuseTrip(
  sourceTrip: Trip,
  input: ReuseTripInput,
  dependencies: ReuseTripDependencies,
): Promise<Trip> {
  const buildInput: BuildReusedTripInput = {
    sourceTrip,
    sharedDetails: input.sharedDetails,
    referenceDate: input.referenceDate,
    ...(input.packingListIds
      ? { packingListIds: input.packingListIds }
      : { packingProfileIds: input.packingProfileIds! }),
  };

  const newTrip = buildReusedTrip(buildInput);

  return dependencies.tripRepository.createTrip(newTrip);
}

/** Mirrors SupabaseTripRepository.createTrip multi-list guard for clearer reuse failures. */
export function assertMultiListReusePersistenceSupported(trip: Trip): void {
  if (trip.packingLists.length > 1) {
    throw new Error(SUPABASE_MULTI_LIST_SAVE_ERROR);
  }
}
