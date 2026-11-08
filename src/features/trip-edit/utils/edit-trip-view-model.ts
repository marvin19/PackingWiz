import type { TripDetailsSection } from '@/features/trip-edit/utils/trip-details-navigation';
import type { Bag } from '@/domain/bag';
import {
  getDestinationCountryLabel,
  getDestinationLabel,
  normalizeDestinationForPersist,
} from '@/domain/destination';
import {
  validateEditTripDateRange,
  validateEditTripSharedDetailsDates,
} from '@/domain/edit-trip-date-validation';
import {
  EDIT_TRIP_DESTINATION_REQUIRED_MESSAGE,
  EDIT_TRIP_TRIP_CONTEXT_REQUIRED_MESSAGE,
  isEditTripDestinationLabelValid,
  isEditTripTripContextValid,
} from '@/domain/edit-trip-shared-details-validation';
import { resolveCommittedTripNameFromDraft } from '@/domain/trip-draft-naming';
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

function resolveEditTripPersistedName(
  form: Pick<TripEditFormState, 'name' | 'draft'>,
): string {
  return resolveCommittedTripNameFromDraft({
    name: form.name,
    destination: form.draft.destination,
  });
}

function resolveEditTripBaselineName(trip: Trip): string {
  return resolveCommittedTripNameFromDraft({
    name: getTripName(trip),
    destination: trip.destination,
  });
}

/** Build a user-editable patch from staged form state vs the persisted trip baseline. */
export function buildSharedDetailsPatch(
  form: TripEditFormState,
  trip: Trip,
): TripSharedDetailsUserEdit {
  const patch: TripSharedDetailsUserEdit = {};
  const resolvedName = resolveEditTripPersistedName(form);
  const baselineName = resolveEditTripBaselineName(trip);

  if (resolvedName !== baselineName) {
    patch.name = resolvedName;
  }

  const normalizedDraftDestination = normalizeDestinationForPersist(form.draft.destination);
  if (!destinationEqual(normalizedDraftDestination, trip.destination)) {
    patch.destination = normalizedDraftDestination;
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

export function isEditDestinationSectionDateRangeValid(form: TripEditFormState): boolean {
  return validateEditTripDateRange(form.draft.startDate, form.draft.endDate).ok;
}

export function isEditDestinationSectionLabelValid(form: TripEditFormState): boolean {
  return isEditTripDestinationLabelValid(form.draft.destination);
}

export function getEditDestinationSectionLabelValidationMessage(
  form: TripEditFormState,
): string | null {
  return isEditDestinationSectionLabelValid(form)
    ? null
    : EDIT_TRIP_DESTINATION_REQUIRED_MESSAGE;
}

export function isEditTripContextSectionValid(form: TripEditFormState): boolean {
  return isEditTripTripContextValid(form.draft.tripContext);
}

export function getEditTripContextSectionValidationMessage(
  form: TripEditFormState,
): string | null {
  return isEditTripContextSectionValid(form)
    ? null
    : EDIT_TRIP_TRIP_CONTEXT_REQUIRED_MESSAGE;
}

export type DestinationSectionSaveGate = {
  sectionPatch: TripSharedDetailsUserEdit;
  hasSectionChanges: boolean;
  canPersist: boolean;
};

/**
 * Destination section save eligibility — form dates and merged patch must agree.
 * When either date changes, both dates are included in the patch so persistence matches the form.
 */
export function getDestinationSectionSaveGate(
  form: TripEditFormState,
  trip: Trip,
): DestinationSectionSaveGate {
  const sectionPatch = buildDestinationSectionPatchForSave(form, trip);
  const hasSectionChanges = Object.keys(sectionPatch).length > 0;

  if (!hasSectionChanges) {
    return { sectionPatch, hasSectionChanges, canPersist: true };
  }

  const formDatesOk = isEditDestinationSectionDateRangeValid(form);
  const mergedDatesOk = validateEditTripSharedDetailsDates(trip, sectionPatch).ok;
  const destinationLabelOk = isEditDestinationSectionLabelValid(form);

  return {
    sectionPatch,
    hasSectionChanges,
    canPersist: formDatesOk && mergedDatesOk && destinationLabelOk,
  };
}

export function buildDestinationSectionPatchForSave(
  form: TripEditFormState,
  trip: Trip,
): TripSharedDetailsUserEdit {
  const sectionPatch = pickSharedDetailsPatchForSection(
    'destination',
    buildSharedDetailsPatch(form, trip),
  );

  if (sectionPatch.startDate === undefined && sectionPatch.endDate === undefined) {
    return sectionPatch;
  }

  return {
    ...sectionPatch,
    startDate: form.draft.startDate,
    endDate: form.draft.endDate,
  };
}

/** When the destination section has staged changes, dates must be valid before Save. */
export function canSaveDestinationSectionEdit(
  form: TripEditFormState,
  trip: Trip,
  hasSectionChanges: boolean,
): boolean {
  if (!hasSectionChanges) {
    return true;
  }

  return getDestinationSectionSaveGate(form, trip).canPersist;
}

export function canSaveTripEditSection(
  section: TripDetailsSection,
  form: TripEditFormState,
  trip: Trip,
  hasSectionChanges: boolean,
): boolean {
  if (!hasSectionChanges) {
    return true;
  }

  if (section === 'destination') {
    if (!isEditDestinationSectionDateRangeValid(form)) {
      return false;
    }

    if (!isEditDestinationSectionLabelValid(form)) {
      return false;
    }

    return getDestinationSectionSaveGate(form, trip).canPersist;
  }

  if (section === 'trip-context') {
    return isEditTripContextSectionValid(form);
  }

  return true;
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

export const TRIP_EDIT_PACKING_NOTICE_TITLE = 'Trip updated';
export const TRIP_EDIT_PACKING_NOTICE_BODY =
  "Your packing lists haven't changed. They may need updating to match your new trip details.";

export function shouldStageTripEditPackingNotice(changes: TripPackingRelevantChanges): boolean {
  return hasTripPackingRelevantChanges(changes);
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

const SECTION_PATCH_KEYS: Record<TripDetailsSection, (keyof TripSharedDetailsUserEdit)[]> = {
  destination: ['name', 'destination', 'startDate', 'endDate'],
  'trip-context': ['tripContext'],
  accommodation: ['accommodation', 'laundry'],
  'packing-for': [],
  bags: ['bags'],
  note: ['note'],
};

export function getTripDetailsDoneLabel(): string {
  return 'Done';
}

export function pickSharedDetailsPatchForSection(
  section: TripDetailsSection,
  patch: TripSharedDetailsUserEdit,
): TripSharedDetailsUserEdit {
  const allowed = new Set(SECTION_PATCH_KEYS[section]);
  const picked: TripSharedDetailsUserEdit = {};

  for (const key of allowed) {
    if (patch[key] !== undefined) {
      (picked as Record<string, unknown>)[key] = patch[key];
    }
  }

  return picked;
}

export function getSectionSaveLabel(section: TripDetailsSection, saving = false): string {
  if (saving) {
    return 'Saving…';
  }

  return section === 'packing-for' ? 'Done' : 'Save';
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
