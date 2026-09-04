import type { PackingProfile } from '@/domain/packing-profile';
import type { Trip } from '@/domain/trip';
import { hasDuplicateDraftProfileName } from '@/domain/trip-draft-profiles';
import type { ReuseTripFormState } from '@/features/trips/utils/reuse-trip-view-model';
import { listsForSelectedIds } from '@/features/trips/utils/reuse-trip-view-model';

function profileFromListSnapshot(
  snapshot: Trip['packingLists'][number]['profileSnapshot'],
): PackingProfile {
  return {
    id: snapshot.id,
    name: snapshot.name,
    age: snapshot.age,
    birthDate: snapshot.birthDate,
    isSelf: snapshot.isSelf,
  };
}

export function getReusePlanProfiles(
  sourceTrip: Trip,
  form: Pick<ReuseTripFormState, 'selectedPackingListIds' | 'newTravellers'>,
): PackingProfile[] {
  const fromSource = listsForSelectedIds(sourceTrip, form.selectedPackingListIds).map((list) =>
    profileFromListSnapshot(list.profileSnapshot),
  );
  const fromNew = form.newTravellers.map((entry) => entry.profile);

  return [...fromSource, ...fromNew];
}

export function reusePlanHasProfile(
  sourceTrip: Trip,
  form: Pick<ReuseTripFormState, 'selectedPackingListIds' | 'newTravellers'>,
  profile: Pick<PackingProfile, 'id' | 'isSelf' | 'name'>,
): boolean {
  const planned = getReusePlanProfiles(sourceTrip, form);

  if (profile.isSelf) {
    return planned.some((entry) => entry.isSelf);
  }

  return planned.some(
    (entry) =>
      !entry.isSelf &&
      (entry.id === profile.id ||
        entry.name.trim().toLowerCase() === profile.name.trim().toLowerCase()),
  );
}

export function availableSavedProfilesForReusePlan(
  savedProfiles: PackingProfile[],
  sourceTrip: Trip,
  form: Pick<ReuseTripFormState, 'selectedPackingListIds' | 'newTravellers'>,
): PackingProfile[] {
  return savedProfiles.filter(
    (profile) =>
      !profile.isSelf && !reusePlanHasProfile(sourceTrip, form, profile),
  );
}

export function canAddProfileToReusePlan(
  sourceTrip: Trip,
  form: Pick<ReuseTripFormState, 'selectedPackingListIds' | 'newTravellers'>,
  profile: PackingProfile,
): boolean {
  if (profile.isSelf && reusePlanHasProfile(sourceTrip, form, profile)) {
    return false;
  }

  if (reusePlanHasProfile(sourceTrip, form, profile)) {
    return false;
  }

  const plannedProfiles = getReusePlanProfiles(sourceTrip, form);
  if (hasDuplicateDraftProfileName(plannedProfiles, profile.name, profile.id)) {
    return false;
  }

  return true;
}

export function getReusePlanExistingNames(
  sourceTrip: Trip,
  form: Pick<ReuseTripFormState, 'selectedPackingListIds' | 'newTravellers'>,
): string[] {
  return getReusePlanProfiles(sourceTrip, form).map((profile) =>
    profile.isSelf ? 'Me' : profile.name,
  );
}

/** Virtual trip shape for AddTravellerSheet saved-profile filtering (selected source lists only). */
export function buildReusePlanTripForSavedProfileFilter(
  sourceTrip: Trip,
  form: Pick<ReuseTripFormState, 'selectedPackingListIds' | 'newTravellers'>,
): Trip {
  const selectedLists = listsForSelectedIds(sourceTrip, form.selectedPackingListIds);
  const newLists = form.newTravellers.map((entry) => ({
    id: entry.id,
    packingProfileId: entry.profile.id,
    profileSnapshot: {
      id: entry.profile.id,
      name: entry.profile.name,
      age: entry.profile.age,
      birthDate: entry.profile.birthDate,
      isSelf: entry.profile.isSelf,
    },
    packingMode: entry.packingMode,
    items: [],
  }));

  return {
    ...sourceTrip,
    packingLists: [...selectedLists, ...newLists],
  };
}

export function countReuseResultingLists(
  form: Pick<ReuseTripFormState, 'selectedPackingListIds' | 'newTravellers'>,
): number {
  return form.selectedPackingListIds.length + form.newTravellers.length;
}
