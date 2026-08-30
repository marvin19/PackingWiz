import { createEmptyTripDraft, type TripDraft } from '@/domain/trip-draft';
import { normalizeTripDraft } from '@/domain/trip-draft-profiles';
import { canProceedFromStepId } from '@/features/trip-creation/utils/wizard-validation';
import type { WizardStepId } from '@/features/trip-creation/utils/wizard-steps';
import { getDestinationLabel } from '@/domain/destination';

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

const REVIEW_REQUIRED_STEPS: WizardStepId[] = [
  'destination',
  'trip-context',
  'accommodation',
  'packing-profiles',
  'bags',
];

export function canReviewDraft(draft: TripDraft): boolean {
  return REVIEW_REQUIRED_STEPS.every((stepId) => canProceedFromStepId(stepId, draft));
}
