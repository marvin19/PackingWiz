import type { Bag } from '@/domain/bag';
import type { Destination } from '@/domain/destination';
import { getDestinationCountryLabel, getDestinationLabel } from '@/domain/destination';
import type { PackingItem } from '@/domain/packing-item';
import type { PackingList } from '@/domain/packing-list';
import type { PackingProfile, PackingProfileSnapshot } from '@/domain/packing-profile';
import type { Traveler } from '@/domain/traveler';
import type { Trip, PackingMode } from '@/domain/trip';
import type { TripWeather, WeatherDay } from '@/domain/weather';
import {
  findPackingListById,
  normalizeTrip,
  type TripLike,
} from '@/domain/trip-compatibility';
import { buildPackingListForProfile } from '@/domain/trip-packing-lists';
import { profileToTraveler } from '@/domain/trip-draft-profiles';

/**
 * Fields a future Edit Trip form may expose directly (MP5 UI).
 * Excludes system-managed Trip fields such as weather, status, and image.
 */
export type TripSharedDetailsUserEdit = Partial<
  Pick<
    Trip,
    | 'name'
    | 'startDate'
    | 'endDate'
    | 'tripContext'
    | 'accommodation'
    | 'laundry'
    | 'note'
  >
> & {
  destination?: Destination;
  bags?: Bag[];
};

/**
 * Internal shared-Trip patch accepted by applyTripSharedDetailsEdit.
 * Extends user-editable fields with system/orchestration fields (weather, status, image).
 * Presence here does not imply those fields are user-editable in Edit Trip UI.
 */
export type TripSharedDetailsPatch = TripSharedDetailsUserEdit &
  Partial<Pick<Trip, 'status' | 'image'>> & {
    weather?: TripWeather;
  };

export type TripEditErrorCode =
  | 'PROFILE_ALREADY_ON_TRIP'
  | 'DUPLICATE_PACKING_LIST'
  | 'PACKING_LIST_NOT_FOUND'
  | 'CANNOT_REMOVE_ONLY_LIST';

export class TripEditError extends Error {
  readonly code: TripEditErrorCode;

  constructor(message: string, code: TripEditErrorCode) {
    super(message);
    this.name = 'TripEditError';
    this.code = code;
  }
}

export type RemoveTravellerFromTripInput =
  | { packingListId: string; packingProfileId?: undefined }
  | { packingProfileId: string; packingListId?: undefined };

export type TripPackingRelevantField =
  | 'destination'
  | 'startDate'
  | 'endDate'
  | 'tripContext'
  | 'accommodation'
  | 'laundry';

export type TripPackingRelevantChanges = Partial<Record<TripPackingRelevantField, true>>;

function clonePackingItem(item: PackingItem): PackingItem {
  return { ...item };
}

function clonePackingList(list: PackingList): PackingList {
  return {
    ...list,
    profileSnapshot: { ...list.profileSnapshot },
    items: list.items.map(clonePackingItem),
  };
}

function cloneBag(bag: Bag): Bag {
  return { ...bag };
}

function cloneWeather(weather: TripWeather): TripWeather {
  return {
    ...weather,
    days: weather.days?.map((day: WeatherDay) => ({ ...day })),
  };
}

function snapshotToProfile(snapshot: PackingProfileSnapshot): PackingProfile {
  return {
    id: snapshot.id,
    name: snapshot.name,
    age: snapshot.age,
    birthDate: snapshot.birthDate,
    isSelf: snapshot.isSelf,
  };
}

function cloneTraveler(traveler: Traveler): Traveler {
  return { ...traveler };
}

/**
 * Resolve the legacy travelers[] row for a PackingList.
 * PackingLists remain authoritative; this is a best-effort mirror lookup until MP6.
 */
function findTravelerIndexForPackingList(travelers: Traveler[], list: PackingList): number {
  if (list.profileSnapshot.isSelf) {
    return travelers.findIndex((traveler) => traveler.id === 't-you' || traveler.name === 'You');
  }

  const profileId = list.packingProfileId;
  const snapshotId = list.profileSnapshot.id;

  return travelers.findIndex(
    (traveler) => traveler.id === profileId || traveler.id === snapshotId,
  );
}

/** Append one legacy traveler row for a newly added list; preserve existing rows as-is. */
function appendLegacyTravelerMirror(
  existingTravelers: Traveler[],
  newList: PackingList,
): Traveler[] {
  const preserved = existingTravelers.map(cloneTraveler);

  if (findTravelerIndexForPackingList(preserved, newList) >= 0) {
    return preserved;
  }

  return [
    ...preserved,
    profileToTraveler(snapshotToProfile(newList.profileSnapshot)),
  ];
}

/** Remove the legacy traveler row for a removed list; preserve unrelated rows as-is. */
function removeLegacyTravelerMirror(
  existingTravelers: Traveler[],
  removedList: PackingList,
): Traveler[] {
  const removeIndex = findTravelerIndexForPackingList(existingTravelers, removedList);

  if (removeIndex < 0) {
    return existingTravelers.map(cloneTraveler);
  }

  return existingTravelers
    .filter((_, index) => index !== removeIndex)
    .map(cloneTraveler);
}

/** Find a PackingList by profile id (self or non-self). */
export function findPackingListByProfileId(
  trip: Trip,
  profileId: string,
): PackingList | undefined {
  return trip.packingLists.find(
    (list) =>
      list.packingProfileId === profileId || list.profileSnapshot.id === profileId,
  );
}

/** Find the PackingList owned by a profile on this trip. */
export function findPackingListForProfile(
  trip: Trip,
  profile: Pick<PackingProfile, 'id' | 'isSelf'>,
): PackingList | undefined {
  if (profile.isSelf) {
    return trip.packingLists.find((list) => list.profileSnapshot.isSelf);
  }

  return trip.packingLists.find(
    (list) =>
      !list.profileSnapshot.isSelf &&
      (list.packingProfileId === profile.id || list.profileSnapshot.id === profile.id),
  );
}

export function tripHasPackingProfile(
  trip: Trip,
  profile: Pick<PackingProfile, 'id' | 'isSelf'>,
): boolean {
  return findPackingListForProfile(trip, profile) !== undefined;
}

/**
 * Apply shared Trip-detail edits without regenerating or mutating PackingLists.
 * Does not call PackingGenerator or Important merge.
 */
export function applyTripSharedDetailsEdit(trip: Trip, patch: TripSharedDetailsPatch): Trip {
  const preservedLists = trip.packingLists.map(clonePackingList);

  const nextTrip: TripLike = {
    ...trip,
    name: patch.name ?? trip.name,
    startDate: patch.startDate ?? trip.startDate,
    endDate: patch.endDate ?? trip.endDate,
    tripContext: patch.tripContext ? [...patch.tripContext] : [...trip.tripContext],
    accommodation: patch.accommodation ?? trip.accommodation,
    laundry: patch.laundry ?? trip.laundry,
    note: patch.note ?? trip.note,
    status: patch.status ?? trip.status,
    image: patch.image ?? trip.image,
    destination: patch.destination ? { ...patch.destination } : { ...trip.destination },
    bags: patch.bags ? patch.bags.map(cloneBag) : trip.bags.map(cloneBag),
    weather: patch.weather ? cloneWeather(patch.weather) : cloneWeather(trip.weather),
    packingLists: preservedLists,
  };

  return normalizeTrip(nextTrip);
}

/** Build an empty PackingList shell for a new traveller (orchestration fills items later). */
export function buildEmptyTravellerPackingListForTrip(
  trip: Trip,
  profile: PackingProfile,
  packingMode: PackingMode = 'manual',
): PackingList {
  if (tripHasPackingProfile(trip, profile)) {
    throw new TripEditError(
      `Profile already has a packing list on trip ${trip.id}`,
      'PROFILE_ALREADY_ON_TRIP',
    );
  }

  return buildPackingListForProfile(trip.id, profile, packingMode, []);
}

/** Append exactly one new PackingList for a traveller; existing lists remain unchanged. */
export function appendTravellerPackingListToTrip(
  trip: Trip,
  packingList: PackingList,
): Trip {
  if (findPackingListById(trip, packingList.id)) {
    throw new TripEditError(
      `Packing list already exists: ${packingList.id}`,
      'DUPLICATE_PACKING_LIST',
    );
  }

  if (tripHasPackingProfile(trip, packingList.profileSnapshot)) {
    throw new TripEditError(
      `Profile already has a packing list on trip ${trip.id}`,
      'PROFILE_ALREADY_ON_TRIP',
    );
  }

  const nextLists = [...trip.packingLists.map(clonePackingList), clonePackingList(packingList)];

  return normalizeTrip({
    ...trip,
    packingLists: nextLists,
    travelers: appendLegacyTravelerMirror(trip.travelers, packingList),
  });
}

/**
 * Remove one traveller's Trip-specific PackingList.
 * Destructive for that list only — does not touch reusable profile Important master.
 */
export function removeTravellerPackingListFromTrip(
  trip: Trip,
  input: RemoveTravellerFromTripInput,
): Trip {
  let targetList: PackingList | undefined;

  if (input.packingListId !== undefined) {
    targetList = findPackingListById(trip, input.packingListId);
  } else if (input.packingProfileId !== undefined) {
    targetList = findPackingListByProfileId(trip, input.packingProfileId);
  } else {
    targetList = undefined;
  }

  if (!targetList) {
    throw new TripEditError('Packing list not found for removal', 'PACKING_LIST_NOT_FOUND');
  }

  if (trip.packingLists.length <= 1) {
    throw new TripEditError(
      'Cannot remove the only packing list from a trip',
      'CANNOT_REMOVE_ONLY_LIST',
    );
  }

  const nextLists = trip.packingLists
    .filter((list) => list.id !== targetList.id)
    .map(clonePackingList);

  return normalizeTrip({
    ...trip,
    packingLists: nextLists,
    travelers: removeLegacyTravelerMirror(trip.travelers, targetList),
  });
}

function destinationEqual(left: Destination, right: Destination): boolean {
  return (
    getDestinationLabel(left) === getDestinationLabel(right) &&
    left.placeId === right.placeId &&
    left.latitude === right.latitude &&
    left.longitude === right.longitude &&
    left.countryCode === right.countryCode &&
    getDestinationCountryLabel(left) === getDestinationCountryLabel(right)
  );
}

function tripContextEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((tag, index) => tag === right[index]);
}

/** Signal whether packing-relevant shared context changed (for future recommendation UX). */
export function detectTripPackingRelevantChanges(
  before: Trip,
  after: Trip,
): TripPackingRelevantChanges {
  const changes: TripPackingRelevantChanges = {};

  if (!destinationEqual(before.destination, after.destination)) {
    changes.destination = true;
  }

  if (before.startDate !== after.startDate) {
    changes.startDate = true;
  }

  if (before.endDate !== after.endDate) {
    changes.endDate = true;
  }

  if (!tripContextEqual(before.tripContext, after.tripContext)) {
    changes.tripContext = true;
  }

  if (before.accommodation !== after.accommodation) {
    changes.accommodation = true;
  }

  if (before.laundry !== after.laundry) {
    changes.laundry = true;
  }

  return changes;
}

export function hasTripPackingRelevantChanges(changes: TripPackingRelevantChanges): boolean {
  return Object.keys(changes).length > 0;
}

/** Deep snapshot of list/item state for regression tests and edit verification. */
export function snapshotPackingListsState(trip: Trip) {
  return trip.packingLists.map((list) => ({
    id: list.id,
    packingProfileId: list.packingProfileId,
    profileSnapshot: { ...list.profileSnapshot },
    packingMode: list.packingMode,
    items: list.items.map((item) => ({ ...item })),
  }));
}

export function packingListsStateEqual(before: Trip, after: Trip): boolean {
  return (
    JSON.stringify(snapshotPackingListsState(before)) ===
    JSON.stringify(snapshotPackingListsState(after))
  );
}
