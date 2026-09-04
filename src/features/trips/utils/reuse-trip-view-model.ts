import { getPersistenceMode } from '@/config/persistence';
import type { Bag } from '@/domain/bag';
import type { Destination } from '@/domain/destination';
import { formatRange } from '@/domain/dates';
import {
  getNewTripDateValidationMessage,
  validateNewTripDateRange,
} from '@/domain/new-trip-date-validation';
import type { PackingList } from '@/domain/packing-list';
import type { PackingProfile } from '@/domain/packing-profile';
import {
  formatPackingListProfileName,
  formatTripPeopleCount,
  getTripPackingPeopleCount,
} from '@/domain/packing-list-display';
import type { AccommodationId, LaundryOption, Trip } from '@/domain/trip';
import { getTripName } from '@/domain/trip-name';
import {
  buildReuseTripChangesSummary,
  type ReuseTripChangesSummary,
} from '@/domain/reuse-trip-changes';
import { REUSE_SELECT_PERSON_ERROR } from '@/features/trips/utils/reuse-trip-display';
import { countReuseResultingLists } from '@/features/trips/utils/reuse-plan-profiles';
import type { ReuseTripInput } from '@/services/trip-reuse-orchestration';
import { SUPABASE_MULTI_LIST_SAVE_ERROR } from '@/repositories/trips/supabase-trip-save-guard';
import { createUuid } from '@/lib/id';

export type ReuseNewTravellerEntry = {
  id: string;
  profile: PackingProfile;
  packingMode: 'generated' | 'manual';
};

export type ReuseTripFormState = {
  name: string;
  destination: Destination;
  startDate: string;
  endDate: string;
  tripContext: string[];
  accommodation: AccommodationId;
  laundry: LaundryOption;
  bags: Bag[];
  note: string;
  selectedPackingListIds: string[];
  newTravellers: ReuseNewTravellerEntry[];
};

export type ReuseTripTravellerRow = {
  listId: string;
  profileId: string;
  label: string;
  selected: boolean;
};

export type ReuseTripNewTravellerRow = {
  entryId: string;
  label: string;
  packingModeLabel: string;
};

export type ReuseTripSourceSummary = {
  tripName: string;
  dateRangeLabel: string;
  peopleLabel: string;
  accessibilityLabel: string;
};

export type ReuseTripValidation = {
  canSubmit: boolean;
  dateError: string | null;
  travellerError: string | null;
  persistenceError: string | null;
};

export function createReuseFormStateFromTrip(sourceTrip: Trip): ReuseTripFormState {
  return {
    name: getTripName(sourceTrip),
    destination: { ...sourceTrip.destination },
    startDate: '',
    endDate: '',
    tripContext: [...sourceTrip.tripContext],
    accommodation: sourceTrip.accommodation,
    laundry: sourceTrip.laundry,
    bags: sourceTrip.bags.map((bag) => ({ ...bag })),
    note: sourceTrip.note,
    selectedPackingListIds: sourceTrip.packingLists.map((list) => list.id),
    newTravellers: [],
  };
}

export function getReuseSourceSummary(sourceTrip: Trip): ReuseTripSourceSummary {
  const tripName = getTripName(sourceTrip);
  const dateRangeLabel = formatRange(sourceTrip.startDate, sourceTrip.endDate);
  const peopleLabel = formatTripPeopleCount(getTripPackingPeopleCount(sourceTrip));

  return {
    tripName,
    dateRangeLabel,
    peopleLabel,
    accessibilityLabel: `${tripName}, ${dateRangeLabel}, ${peopleLabel}`,
  };
}

export function getReuseTravellerRows(
  sourceTrip: Trip,
  selectedPackingListIds: string[],
): ReuseTripTravellerRow[] {
  const selected = new Set(selectedPackingListIds);

  return sourceTrip.packingLists.map((list) => ({
    listId: list.id,
    profileId: list.packingProfileId,
    label: formatPackingListProfileName(list.profileSnapshot),
    selected: selected.has(list.id),
  }));
}

export function getReuseNewTravellerRows(form: ReuseTripFormState): ReuseTripNewTravellerRow[] {
  return form.newTravellers.map((entry) => ({
    entryId: entry.id,
    label: entry.profile.isSelf ? 'Me' : entry.profile.name,
    packingModeLabel: entry.packingMode === 'generated' ? 'Generated list' : 'Manual list',
  }));
}

export function toggleReuseTravellerSelection(
  selectedPackingListIds: string[],
  listId: string,
): string[] {
  if (selectedPackingListIds.includes(listId)) {
    return selectedPackingListIds.filter((id) => id !== listId);
  }

  return [...selectedPackingListIds, listId];
}

export function addReuseNewTraveller(
  form: ReuseTripFormState,
  profile: PackingProfile,
  packingMode: 'generated' | 'manual',
): ReuseTripFormState {
  return {
    ...form,
    newTravellers: [
      ...form.newTravellers,
      {
        id: createUuid(),
        profile,
        packingMode,
      },
    ],
  };
}

export function removeReuseNewTraveller(
  form: ReuseTripFormState,
  entryId: string,
): ReuseTripFormState {
  return {
    ...form,
    newTravellers: form.newTravellers.filter((entry) => entry.id !== entryId),
  };
}

export function validateReuseTripForm(
  form: ReuseTripFormState,
  referenceDate: Date = new Date(),
): ReuseTripValidation {
  const dateValidation = validateNewTripDateRange(form.startDate, form.endDate, referenceDate);
  const dateError = getNewTripDateValidationMessage(dateValidation);

  const totalTravellers = countReuseResultingLists(form);
  const travellerError = totalTravellers === 0 ? REUSE_SELECT_PERSON_ERROR : null;

  const persistenceError =
    getPersistenceMode() === 'supabase' && totalTravellers > 1
      ? SUPABASE_MULTI_LIST_SAVE_ERROR
      : null;

  const canSubmit = dateValidation.ok && !travellerError && !persistenceError;

  return {
    canSubmit,
    dateError,
    travellerError,
    persistenceError,
  };
}

export function buildReuseTripInput(
  form: ReuseTripFormState,
  referenceDate?: Date,
): ReuseTripInput {
  return {
    packingListIds: [...form.selectedPackingListIds],
    sharedDetails: {
      name: form.name.trim() || undefined,
      destination: { ...form.destination },
      startDate: form.startDate,
      endDate: form.endDate,
      tripContext: [...form.tripContext],
      accommodation: form.accommodation,
      laundry: form.laundry,
      bags: form.bags.map((bag) => ({ ...bag })),
      note: form.note,
    },
    newTravellers: form.newTravellers.map((entry) => ({
      profile: entry.profile,
      packingMode: entry.packingMode,
    })),
    referenceDate,
  };
}

export function listsForSelectedIds(
  sourceTrip: Trip,
  selectedPackingListIds: string[],
): PackingList[] {
  const idSet = new Set(selectedPackingListIds);
  return sourceTrip.packingLists.filter((list) => idSet.has(list.id));
}

export function getReuseTripChangesSummary(
  sourceTrip: Trip,
  form: ReuseTripFormState,
): ReuseTripChangesSummary {
  const selectedLists = listsForSelectedIds(sourceTrip, form.selectedPackingListIds);

  return buildReuseTripChangesSummary({
    sourceTrip,
    plannedStartDate: form.startDate,
    plannedEndDate: form.endDate,
    plannedDestination: form.destination,
    plannedTripContext: form.tripContext,
    plannedAccommodation: form.accommodation,
    plannedLaundry: form.laundry,
    plannedBags: form.bags,
    selectedSourceProfileSnapshots: selectedLists.map((list) => list.profileSnapshot),
    newTravellerSnapshots: form.newTravellers.map((entry) => ({
      id: entry.profile.id,
      name: entry.profile.name,
      age: entry.profile.age,
      birthDate: entry.profile.birthDate,
      isSelf: entry.profile.isSelf,
    })),
  });
}

export function getReuseTripExplanation(
  form: ReuseTripFormState,
  changes: ReuseTripChangesSummary,
): string {
  const copiedCount = form.selectedPackingListIds.length;
  const newCount = form.newTravellers.length;

  if (copiedCount > 0 && newCount > 0) {
    const copiedPart = changes.durationDiffers
      ? 'Selected packing items and quantities will be copied as-is.'
      : 'Selected packing lists will be copied';
    return `${copiedPart} New travellers get fresh packing lists. Packing progress will start fresh.`;
  }

  if (copiedCount > 0) {
    if (changes.durationDiffers) {
      return 'Packing items and quantities will be copied as-is. Packing progress will start fresh.';
    }

    return 'Packing items will be copied and packing progress will start fresh.';
  }

  if (newCount > 0) {
    return 'Fresh packing lists will be created. Packing progress will start fresh.';
  }

  return 'Packing items will be copied and packing progress will start fresh.';
}
