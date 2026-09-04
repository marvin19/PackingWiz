import { createEmptyTripDraft, type TripDraft } from '@/domain/trip-draft';
import { normalizeTripDraft } from '@/domain/trip-draft-profiles';
import { canProceedFromStepId } from '@/features/trip-creation/utils/wizard-validation';
import type { WizardStepId } from '@/features/trip-creation/utils/wizard-steps';
import { getDestinationLabel } from '@/domain/destination';

function draftContentEquals(left: TripDraft, right: TripDraft): boolean {
  const normalizedLeft = normalizeTripDraft(left);
  const normalizedRight = normalizeTripDraft(right);

  return (
    getDestinationLabel(normalizedLeft.destination).trim() ===
      getDestinationLabel(normalizedRight.destination).trim() &&
    normalizedLeft.startDate === normalizedRight.startDate &&
    normalizedLeft.endDate === normalizedRight.endDate &&
    normalizedLeft.tripContext.length === normalizedRight.tripContext.length &&
    normalizedLeft.tripContext.every((tag, index) => tag === normalizedRight.tripContext[index]) &&
    normalizedLeft.accommodation === normalizedRight.accommodation &&
    normalizedLeft.laundry === normalizedRight.laundry &&
    normalizedLeft.bags.length === normalizedRight.bags.length &&
    normalizedLeft.note.trim() === normalizedRight.note.trim() &&
    normalizedLeft.packingProfiles.length === normalizedRight.packingProfiles.length &&
    normalizedLeft.packingProfiles.every((profile, index) => {
      const other = normalizedRight.packingProfiles[index];
      return (
        profile.id === other?.id &&
        profile.name === other?.name &&
        profile.age === other?.age &&
        profile.rememberForFutureTrips === other?.rememberForFutureTrips
      );
    })
  );
}

export function isEmptyDraftContent(draft: TripDraft): boolean {
  return draftContentEquals(draft, createEmptyTripDraft());
}

export function isDraftInProgress(draft: TripDraft): boolean {
  return !isEmptyDraftContent(draft);
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
