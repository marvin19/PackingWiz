import type { Bag } from '@/domain/bag';
import type { Destination } from '@/domain/destination';
import type { PackingItem } from '@/domain/packing-item';
import type { PackingList } from '@/domain/packing-list';
import type { PackingProfile, PackingProfileSnapshot } from '@/domain/packing-profile';
import {
  getNewTripDateValidationMessage,
  validateNewTripDateRange,
  type NewTripDateValidationIssue,
} from '@/domain/new-trip-date-validation';
import type { Traveler } from '@/domain/traveler';
import type { Trip } from '@/domain/trip';
import type { TripSharedDetailsUserEdit } from '@/domain/trip-edit';
import { deriveTripDateBucket } from '@/domain/trip-lifecycle';
import { normalizeTrip } from '@/domain/trip-compatibility';
import { profileToTraveler } from '@/domain/trip-draft-profiles';
import { emptyTripWeather } from '@/domain/weather';
import { createPackingItemId, createUuid } from '@/lib/id';

export type TripReuseErrorCode =
  | 'NO_LISTS_SELECTED'
  | 'UNKNOWN_PACKING_LIST'
  | 'UNKNOWN_PACKING_PROFILE'
  | 'INVALID_DATES';

export class TripReuseError extends Error {
  readonly code: TripReuseErrorCode;
  readonly dateIssue?: NewTripDateValidationIssue;

  constructor(
    message: string,
    code: TripReuseErrorCode,
    dateIssue?: NewTripDateValidationIssue,
  ) {
    super(message);
    this.name = 'TripReuseError';
    this.code = code;
    this.dateIssue = dateIssue;
  }
}

/** Shared Trip facts supplied for the new trip — dates required; other fields default from source. */
export type TripReuseSharedDetails = TripSharedDetailsUserEdit & {
  startDate: string;
  endDate: string;
};

export type TripReuseListSelection =
  | { packingListIds: string[]; packingProfileIds?: undefined }
  | { packingProfileIds: string[]; packingListIds?: undefined };

/** New traveller planned during reuse — no source PackingList; list created at commit. */
export type TripReuseNewTraveller = {
  profile: PackingProfile;
  packingMode: PackingList['packingMode'];
};

export type BuildReusedTripInput = TripReuseListSelection & {
  sourceTrip: Trip;
  sharedDetails: TripReuseSharedDetails;
  referenceDate?: Date;
  /** When true, copied-list selection may be empty (new travellers supply lists in orchestration). */
  allowEmptyCopiedLists?: boolean;
  createTripId?: () => string;
  createListId?: () => string;
  createItemId?: () => string;
  createBagId?: () => string;
};

export function countReuseTravellerPlan(
  selectedCopiedListCount: number,
  newTravellerCount: number,
): number {
  return selectedCopiedListCount + newTravellerCount;
}

export function validateReuseTravellerPlan(
  selectedCopiedListCount: number,
  newTravellerCount: number,
): void {
  if (countReuseTravellerPlan(selectedCopiedListCount, newTravellerCount) === 0) {
    throw new TripReuseError('At least one person must be included', 'NO_LISTS_SELECTED');
  }
}

function cloneProfileSnapshot(snapshot: PackingProfileSnapshot): PackingProfileSnapshot {
  return { ...snapshot };
}

function cloneBag(bag: Bag): Bag {
  return { ...bag };
}

function copyItemForReuse(item: PackingItem, createItemId: () => string): PackingItem {
  return {
    ...item,
    id: createItemId(),
    packed: false,
  };
}

function copyListForReuse(
  sourceList: PackingList,
  createListId: () => string,
  createItemId: () => string,
  allowedTravelerIds: Set<string>,
): PackingList {
  return {
    id: createListId(),
    packingProfileId: sourceList.packingProfileId,
    profileSnapshot: cloneProfileSnapshot(sourceList.profileSnapshot),
    packingMode: sourceList.packingMode,
    items: sourceList.items.map((item) => {
      const copied = copyItemForReuse(item, createItemId);
      return {
        ...copied,
        assignedTo:
          copied.assignedTo && allowedTravelerIds.has(copied.assignedTo)
            ? copied.assignedTo
            : null,
      };
    }),
  };
}

function snapshotToTravelerKey(snapshot: PackingProfileSnapshot): string {
  return snapshot.isSelf ? 'self' : snapshot.id;
}

function buildTravelersForSelectedLists(lists: PackingList[]): Traveler[] {
  const travelers: Traveler[] = [];
  const seen = new Set<string>();

  for (const list of lists) {
    const key = snapshotToTravelerKey(list.profileSnapshot);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    travelers.push(
      profileToTraveler({
        id: list.profileSnapshot.id,
        name: list.profileSnapshot.name,
        age: list.profileSnapshot.age,
        birthDate: list.profileSnapshot.birthDate,
        isSelf: list.profileSnapshot.isSelf,
      }),
    );
  }

  return travelers;
}

function resolveSelectedLists(
  sourceTrip: Trip,
  selection: TripReuseListSelection,
): PackingList[] {
  if ('packingListIds' in selection && selection.packingListIds) {
    const ids = selection.packingListIds;

    if (ids.length === 0) {
      return [];
    }

    const unknown = ids.filter(
      (id) => !sourceTrip.packingLists.some((list) => list.id === id),
    );
    if (unknown.length > 0) {
      throw new TripReuseError(
        `Unknown packing list selection: ${unknown.join(', ')}`,
        'UNKNOWN_PACKING_LIST',
      );
    }

    const idSet = new Set(ids);
    return sourceTrip.packingLists.filter((list) => idSet.has(list.id));
  }

  const profileIds = selection.packingProfileIds ?? [];

  if (profileIds.length === 0) {
    return [];
  }

  const resolved: PackingList[] = [];
  const unknownProfiles: string[] = [];

  for (const profileId of profileIds) {
    const list = sourceTrip.packingLists.find(
      (entry) =>
        entry.packingProfileId === profileId || entry.profileSnapshot.id === profileId,
    );

    if (!list) {
      unknownProfiles.push(profileId);
      continue;
    }

    if (!resolved.some((entry) => entry.id === list.id)) {
      resolved.push(list);
    }
  }

  if (unknownProfiles.length > 0) {
    throw new TripReuseError(
      `Unknown packing profile selection: ${unknownProfiles.join(', ')}`,
      'UNKNOWN_PACKING_PROFILE',
    );
  }

  return resolved;
}

function resolveSharedDestination(
  sourceTrip: Trip,
  patch: TripReuseSharedDetails,
): Destination {
  return patch.destination ? { ...patch.destination } : { ...sourceTrip.destination };
}

function resolveSharedBags(
  sourceTrip: Trip,
  patch: TripReuseSharedDetails,
  createBagId: () => string,
): Bag[] {
  if (patch.bags) {
    return patch.bags.map(cloneBag);
  }

  return sourceTrip.bags.map((bag) => ({
    ...cloneBag(bag),
    id: createBagId(),
  }));
}

/**
 * Pure builder: copy selected packing-list content from a source Trip into a new Trip aggregate.
 *
 * - Fresh trip/list/item ids (never derived from source ids)
 * - Resets packed progress on copied items
 * - Preserves list snapshots, packingMode, and Important master links
 * - Does not copy weather, insights, or image metadata
 * - Does not mutate the source trip
 */
export function buildReusedTrip(input: BuildReusedTripInput): Trip {
  const {
    sourceTrip,
    sharedDetails,
    referenceDate = new Date(),
    createTripId = createUuid,
    createListId = createUuid,
    createItemId = createPackingItemId,
    createBagId = createUuid,
  } = input;

  const selectedSourceLists = resolveSelectedLists(sourceTrip, input);

  if (selectedSourceLists.length === 0 && !input.allowEmptyCopiedLists) {
    throw new TripReuseError('At least one packing list must be selected', 'NO_LISTS_SELECTED');
  }

  const dateValidation = validateNewTripDateRange(
    sharedDetails.startDate,
    sharedDetails.endDate,
    referenceDate,
  );

  if (!dateValidation.ok) {
    throw new TripReuseError(
      getNewTripDateValidationMessage(dateValidation) ?? 'Trip dates are invalid.',
      'INVALID_DATES',
      dateValidation.issue,
    );
  }

  const travelers = buildTravelersForSelectedLists(selectedSourceLists);
  const allowedTravelerIds = new Set(travelers.map((traveler) => traveler.id));

  const packingLists = selectedSourceLists.map((list) =>
    copyListForReuse(list, createListId, createItemId, allowedTravelerIds),
  );

  const newTripId = createTripId();
  const name = sharedDetails.name?.trim() || sourceTrip.name;
  const tripContext = sharedDetails.tripContext
    ? [...sharedDetails.tripContext]
    : [...sourceTrip.tripContext];

  const reusedTrip = normalizeTrip({
    id: newTripId,
    name,
    title: name,
    destination: resolveSharedDestination(sourceTrip, sharedDetails),
    startDate: sharedDetails.startDate,
    endDate: sharedDetails.endDate,
    tripContext,
    accommodation: sharedDetails.accommodation ?? sourceTrip.accommodation,
    laundry: sharedDetails.laundry ?? sourceTrip.laundry,
    note: sharedDetails.note ?? sourceTrip.note,
    travelers,
    bags: resolveSharedBags(sourceTrip, sharedDetails, createBagId),
    weather: emptyTripWeather(),
    packingLists,
    insights: [],
    status: deriveTripDateBucket(
      {
        ...sourceTrip,
        startDate: sharedDetails.startDate,
        endDate: sharedDetails.endDate,
      },
      referenceDate,
    ),
    items: packingLists[0]?.items ?? [],
    packingMode: packingLists[0]?.packingMode ?? sourceTrip.packingMode,
    generated: (packingLists[0]?.packingMode ?? sourceTrip.packingMode) === 'generated',
  });

  if (selectedSourceLists.length === 0 && input.allowEmptyCopiedLists) {
    return {
      ...reusedTrip,
      packingLists: [],
      travelers: [],
      items: [],
      packingMode: 'manual',
      generated: false,
    };
  }

  return reusedTrip;
}
