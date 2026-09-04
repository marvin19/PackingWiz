import {
  buildReusedTrip,
  type BuildReusedTripInput,
  type TripReuseListSelection,
  type TripReuseNewTraveller,
  type TripReuseSharedDetails,
  validateReuseTravellerPlan,
} from '@/domain/trip-reuse';
import type { ImportantItemsByProfileId } from '@/domain/profile-important-items';
import type { Trip } from '@/domain/trip';
import {
  appendTravellerPackingListToTrip,
  tripHasPackingProfile,
  TripEditError,
} from '@/domain/trip-edit';
import { tripToTripDraft } from '@/domain/trip-to-draft';
import { normalizeTrip } from '@/domain/trip-compatibility';
import type { TripRepository } from '@/repositories/trips/trip-repository';
import { SUPABASE_MULTI_LIST_SAVE_ERROR } from '@/repositories/trips/supabase-trip-save-guard';
import { assemblePackingListForProfile } from '@/services/trip-assembly';
import type { PackingGenerator } from '@/services/packing/packing-generator';

export type ReuseTripInput = TripReuseListSelection & {
  sharedDetails: TripReuseSharedDetails;
  referenceDate?: Date;
  newTravellers?: TripReuseNewTraveller[];
};

export type ReuseTripDependencies = {
  tripRepository: TripRepository;
  packingGenerator: PackingGenerator;
  importantByProfileId?: ImportantItemsByProfileId;
};

function assertNoDuplicateNewTravellers(trip: Trip, newTravellers: TripReuseNewTraveller[]): void {
  for (const entry of newTravellers) {
    if (tripHasPackingProfile(trip, entry.profile)) {
      throw new TripEditError(
        `Profile already has a packing list on trip ${trip.id}`,
        'PROFILE_ALREADY_ON_TRIP',
      );
    }
  }

  const seen = new Set<string>();
  for (const entry of newTravellers) {
    const key = entry.profile.isSelf ? 'self' : entry.profile.id;
    if (seen.has(key)) {
      throw new TripEditError(
        `Duplicate profile in reuse plan: ${entry.profile.name}`,
        'PROFILE_ALREADY_ON_TRIP',
      );
    }
    seen.add(key);
  }
}

/**
 * Create a new Trip by reusing packing-list content from an existing Trip,
 * optionally adding fresh generated/manual lists for new travellers.
 *
 * Copied lists: no PackingGenerator, weather fetch, or Important reinjection.
 * New travellers: one assemblePackingListForProfile call each (generated or manual).
 * Source trip is never mutated; one repository create after the full aggregate is built.
 */
export async function reuseTrip(
  sourceTrip: Trip,
  input: ReuseTripInput,
  dependencies: ReuseTripDependencies,
): Promise<Trip> {
  const newTravellers = input.newTravellers ?? [];
  const selectedCopiedCount =
    'packingListIds' in input && input.packingListIds
      ? input.packingListIds.length
      : (input.packingProfileIds?.length ?? 0);

  validateReuseTravellerPlan(selectedCopiedCount, newTravellers.length);

  const buildInput: BuildReusedTripInput = {
    sourceTrip,
    sharedDetails: input.sharedDetails,
    referenceDate: input.referenceDate,
    allowEmptyCopiedLists: newTravellers.length > 0,
    ...(input.packingListIds
      ? { packingListIds: input.packingListIds }
      : { packingProfileIds: input.packingProfileIds! }),
  };

  let trip = buildReusedTrip(buildInput);
  assertNoDuplicateNewTravellers(trip, newTravellers);

  if (newTravellers.length > 0) {
    const draft = tripToTripDraft(trip);
    const importantByProfileId = dependencies.importantByProfileId ?? {};

    for (const entry of newTravellers) {
      const { list } = await assemblePackingListForProfile(draft, entry.profile, dependencies, {
        tripId: trip.id,
        packingMode: entry.packingMode,
        importantByProfileId,
      });

      trip = appendTravellerPackingListToTrip(trip, list);
    }

    trip = normalizeTrip(trip);
  }

  return dependencies.tripRepository.createTrip(trip);
}

/** Mirrors SupabaseTripRepository.createTrip multi-list guard for clearer reuse failures. */
export function assertMultiListReusePersistenceSupported(trip: Trip): void {
  if (trip.packingLists.length > 1) {
    throw new Error(SUPABASE_MULTI_LIST_SAVE_ERROR);
  }
}
