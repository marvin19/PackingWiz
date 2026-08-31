import { reconcileActivePackingListId } from '@/domain/active-packing-list';
import type { PackingList } from '@/domain/packing-list';
import type { PackingProfile } from '@/domain/packing-profile';
import type { ImportantItemsByProfileId } from '@/domain/profile-important-items';
import type { PackingMode, Trip } from '@/domain/trip';
import {
  appendTravellerPackingListToTrip,
  applyTripSharedDetailsEdit,
  detectTripPackingRelevantChanges,
  removeTravellerPackingListFromTrip,
  snapshotPackingListsState,
  tripHasPackingProfile,
  TripEditError,
  type RemoveTravellerFromTripInput,
  type TripPackingRelevantChanges,
  type TripSharedDetailsUserEdit,
} from '@/domain/trip-edit';
import { tripToTripDraft } from '@/domain/trip-to-draft';
import { normalizeTrip } from '@/domain/trip-compatibility';
import { dedupeInsights } from '@/domain/trip-packing-lists';
import type { TripRepository } from '@/repositories/trips/trip-repository';
import { assemblePackingListForProfile } from '@/services/trip-assembly';
import type { PackingGenerator } from '@/services/packing/packing-generator';

export type UpdateTripSharedDetailsResult = {
  trip: Trip;
  packingRelevantChanges: TripPackingRelevantChanges;
};

export type AddTravellerToTripInput = {
  trip: Trip;
  profile: PackingProfile;
  packingMode: PackingMode;
  importantByProfileId?: ImportantItemsByProfileId;
};

export type AddTravellerToTripResult = {
  trip: Trip;
  addedList: PackingList;
  insights: string[];
};

export function updateTripSharedDetails(
  trip: Trip,
  patch: TripSharedDetailsUserEdit,
): UpdateTripSharedDetailsResult {
  const updatedTrip = applyTripSharedDetailsEdit(trip, patch);

  return {
    trip: updatedTrip,
    packingRelevantChanges: detectTripPackingRelevantChanges(trip, updatedTrip),
  };
}

/** Add one traveller PackingList to an existing trip — never regenerates existing lists. */
export async function addTravellerToTrip(
  input: AddTravellerToTripInput,
  services: { packingGenerator: PackingGenerator },
): Promise<AddTravellerToTripResult> {
  const { trip, profile, packingMode, importantByProfileId } = input;

  if (tripHasPackingProfile(trip, profile)) {
    throw new TripEditError(
      `Profile already has a packing list on trip ${trip.id}`,
      'PROFILE_ALREADY_ON_TRIP',
    );
  }

  const draft = tripToTripDraft(trip);
  const { list, insights } = await assemblePackingListForProfile(draft, profile, services, {
    tripId: trip.id,
    packingMode,
    importantByProfileId,
  });

  const appendedTrip = appendTravellerPackingListToTrip(trip, list);
  const tripWithInsights =
    packingMode === 'generated' && insights.length > 0
      ? {
          ...appendedTrip,
          insights: dedupeInsights([...appendedTrip.insights, ...insights]),
        }
      : appendedTrip;

  return {
    trip: normalizeTrip(tripWithInsights),
    addedList: list,
    insights,
  };
}

export function removeTravellerFromTrip(trip: Trip, input: RemoveTravellerFromTripInput): Trip {
  return removeTravellerPackingListFromTrip(trip, input);
}

/**
 * Reconcile activePackingListId after a traveller list removal.
 * Does not use MP3A primary fallback when explicit selection is required.
 */
export function reconcileActiveListAfterTravellerRemoval(
  activeTripId: string | null,
  previousActivePackingListId: string | null,
  removedListId: string,
  updatedTrip: Trip,
): string | null {
  if (activeTripId !== updatedTrip.id) {
    return previousActivePackingListId;
  }

  if (previousActivePackingListId !== removedListId) {
    if (
      previousActivePackingListId &&
      updatedTrip.packingLists.some((list) => list.id === previousActivePackingListId)
    ) {
      return previousActivePackingListId;
    }

    return reconcileActivePackingListId(activeTripId, previousActivePackingListId, [updatedTrip])
      .activePackingListId;
  }

  return reconcileActivePackingListId(activeTripId, null, [updatedTrip]).activePackingListId;
}

export function mapTripById(trips: Trip[], tripId: string, updater: (trip: Trip) => Trip): Trip[] {
  return trips.map((entry) => (entry.id === tripId ? updater(entry) : entry));
}

/** Persist one edited trip; rethrows on failure so callers can roll back optimistic state. */
export async function persistEditedTrip(
  tripRepository: TripRepository,
  nextTrip: Trip,
): Promise<Trip> {
  return tripRepository.save(nextTrip);
}

export function assertExistingListsUnchanged(before: Trip, after: Trip): void {
  const beforeLists = snapshotPackingListsState(before);
  const afterLists = after.packingLists.slice(0, beforeLists.length);

  for (let index = 0; index < beforeLists.length; index += 1) {
    expectSnapshotListEqual(beforeLists[index], afterLists[index]);
  }
}

function expectSnapshotListEqual(
  before: ReturnType<typeof snapshotPackingListsState>[number],
  after: ReturnType<typeof snapshotPackingListsState>[number] | undefined,
): void {
  if (!after) {
    throw new Error('Expected existing packing list to be preserved');
  }

  if (JSON.stringify(before) !== JSON.stringify(after)) {
    throw new Error(`Packing list ${before.id} was mutated during edit orchestration`);
  }
}
