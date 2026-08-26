import { getDestinationLabel } from '@/domain/destination';
import { createEmptyTripDraft, type TripDraft } from '@/domain/trip-draft';
import { normalizeTripDraft } from '@/domain/trip-draft-profiles';
import { canProceedFromStep } from '@/features/trip-creation/utils/wizard-validation';
import { WIZARD_STEP_COUNT } from '@/features/trip-creation/constants';

export function isDraftInProgress(draft: TripDraft): boolean {
  const empty = createEmptyTripDraft();
  const normalizedDraft = normalizeTripDraft(draft);

  return (
    getDestinationLabel(normalizedDraft.destination).trim() !== '' ||
    normalizedDraft.startDate !== '' ||
    normalizedDraft.endDate !== '' ||
    normalizedDraft.tripContext.length > 0 ||
    normalizedDraft.accommodation !== null ||
    normalizedDraft.laundry !== null ||
    normalizedDraft.bags.length > 0 ||
    normalizedDraft.note.trim() !== '' ||
    normalizedDraft.packingProfiles.length !== empty.packingProfiles.length ||
    normalizedDraft.packingProfiles.some(
      (profile, index) =>
        profile.id !== empty.packingProfiles[index]?.id ||
        profile.name !== empty.packingProfiles[index]?.name ||
        profile.age !== empty.packingProfiles[index]?.age,
    )
  );
}

export function canReviewDraft(draft: TripDraft): boolean {
  for (let step = 0; step < WIZARD_STEP_COUNT - 1; step += 1) {
    if (!canProceedFromStep(step, draft)) {
      return false;
    }
  }

  return true;
}
