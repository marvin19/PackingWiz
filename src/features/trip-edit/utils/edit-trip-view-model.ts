import type { Bag } from '@/domain/bag';
import { getDestinationCountryLabel, getDestinationLabel } from '@/domain/destination';
import type { PackingProfile } from '@/domain/packing-profile';
import {
  formatPackingListProfileName,
  formatPackingListProfileSubtitle,
} from '@/domain/packing-list-display';
import type { TripDraft } from '@/domain/trip-draft';
import {
  hasTripPackingRelevantChanges,
  tripHasPackingProfile,
  type TripPackingRelevantChanges,
  type TripSharedDetailsUserEdit,
} from '@/domain/trip-edit';
import { tripToTripDraft } from '@/domain/trip-to-draft';
import type { Trip } from '@/domain/trip';
import { getTripName } from '@/domain/trip-name';

export type TripEditFormState = {
  name: string;
  draft: TripDraft;
};

export type EditTripTravellerRow = {
  listId: string;
  profileId: string;
  name: string;
  subtitle: string | null;
  canRemove: boolean;
};

export type EditTripReturnTo = 'overview' | 'pack';

export function createEditFormStateFromTrip(trip: Trip): TripEditFormState {
  return {
    name: getTripName(trip),
    draft: tripToTripDraft(trip),
  };
}

function destinationEqual(left: Trip['destination'], right: Trip['destination']): boolean {
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

function bagsEqual(left: Bag[], right: Bag[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

/** Build a user-editable patch from staged form state vs the persisted trip baseline. */
export function buildSharedDetailsPatch(
  form: TripEditFormState,
  trip: Trip,
): TripSharedDetailsUserEdit {
  const patch: TripSharedDetailsUserEdit = {};
  const trimmedName = form.name.trim();

  if (trimmedName !== getTripName(trip)) {
    patch.name = trimmedName;
  }

  if (!destinationEqual(form.draft.destination, trip.destination)) {
    patch.destination = { ...form.draft.destination };
  }

  if (form.draft.startDate !== trip.startDate) {
    patch.startDate = form.draft.startDate;
  }

  if (form.draft.endDate !== trip.endDate) {
    patch.endDate = form.draft.endDate;
  }

  if (!tripContextEqual(form.draft.tripContext, trip.tripContext)) {
    patch.tripContext = [...form.draft.tripContext];
  }

  const nextAccommodation = form.draft.accommodation ?? trip.accommodation;
  if (nextAccommodation !== trip.accommodation) {
    patch.accommodation = nextAccommodation;
  }

  const nextLaundry = form.draft.laundry ?? trip.laundry;
  if (nextLaundry !== trip.laundry) {
    patch.laundry = nextLaundry;
  }

  if (form.draft.note !== trip.note) {
    patch.note = form.draft.note;
  }

  if (!bagsEqual(form.draft.bags, trip.bags)) {
    patch.bags = form.draft.bags.map((bag) => ({ ...bag }));
  }

  return patch;
}

export function hasStagedSharedChanges(form: TripEditFormState, trip: Trip): boolean {
  return Object.keys(buildSharedDetailsPatch(form, trip)).length > 0;
}

export function resolveEditTripPrimaryFooterAction(hasStagedSharedChanges: boolean): 'save' | 'done' {
  return hasStagedSharedChanges ? 'save' : 'done';
}

export function getEditTripPrimaryFooterLabel(
  hasStagedSharedChanges: boolean,
  saving = false,
): string {
  if (saving) {
    return 'Saving…';
  }

  return resolveEditTripPrimaryFooterAction(hasStagedSharedChanges) === 'save'
    ? 'Save changes'
    : 'Done';
}

export function isEditTripPrimaryFooterEnabled(saving = false): boolean {
  return !saving;
}

export function buildTravellerAddedNotice(name: string): string {
  return `${name} added`;
}

export function buildTravellerRemovedNotice(name: string): string {
  return `${name} removed`;
}

export function canRemoveTravellerFromTrip(trip: Trip): boolean {
  return trip.packingLists.length > 1;
}

export function getEditTripTravellerRows(trip: Trip): EditTripTravellerRow[] {
  const removable = canRemoveTravellerFromTrip(trip);

  return trip.packingLists.map((list) => ({
    listId: list.id,
    profileId: list.packingProfileId,
    name: formatPackingListProfileName(list.profileSnapshot),
    subtitle: formatPackingListProfileSubtitle(list.profileSnapshot),
    canRemove: removable,
  }));
}

export function isProfileAlreadyOnTrip(trip: Trip, profile: Pick<PackingProfile, 'id' | 'isSelf'>): boolean {
  return tripHasPackingProfile(trip, profile);
}

export function buildPostSaveNotice(changes: TripPackingRelevantChanges): string | null {
  if (!hasTripPackingRelevantChanges(changes)) {
    return 'Trip details updated.';
  }

  return 'Trip details updated. Your existing packing lists were kept.';
}

export function shouldDiscardStagedEdits(hasChanges: boolean, confirmedDiscard: boolean): boolean {
  return !hasChanges || confirmedDiscard;
}

export function shouldExecuteRemoveTraveller(
  pendingRemoveListId: string | null,
  confirmed: boolean,
): boolean {
  return pendingRemoveListId !== null && confirmed;
}

export function availableSavedProfilesForTrip(
  savedProfiles: PackingProfile[],
  trip: Trip,
): PackingProfile[] {
  return savedProfiles.filter(
    (profile) => !profile.isSelf && !tripHasPackingProfile(trip, profile),
  );
}

export function shouldProceedWithAddTraveller(
  pendingProfile: PackingProfile | null,
  packingMode: 'generated' | 'manual' | null,
  confirmed: boolean,
): boolean {
  return pendingProfile !== null && packingMode !== null && confirmed;
}

export function buildAddTravellerConfirmTitle(profileName: string): string {
  return `Add ${profileName} to this trip`;
}

export function buildAddTravellerConfirmBody(
  profileName: string,
  existingNames: string[],
): string {
  const others =
    existingNames.length === 1
      ? `${existingNames[0]}'s packing list won't be changed.`
      : `${existingNames.join(' and ')}'s packing lists won't be changed.`;

  return `PackingWiz will create a new packing list for ${profileName}. ${others}`;
}

export function buildRemoveTravellerConfirmTitle(name: string): string {
  return `Remove ${name} from this trip?`;
}

export function buildRemoveTravellerConfirmBody(name: string): string {
  return `${name}'s packing list and packing progress for this trip will be permanently removed.\n\nThis will NOT delete:\n• ${name} from saved Packing Profiles\n• ${name}'s reusable Important items`;
}
