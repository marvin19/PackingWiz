import { getDestinationLabel } from '@/domain/destination';
import { createEmptyTripDraft, type TripDraft } from '@/domain/trip-draft';
import { canProceedFromStep } from '@/features/trip-creation/utils/wizard-validation';
import { WIZARD_STEP_COUNT } from '@/features/trip-creation/constants';

export function isDraftInProgress(draft: TripDraft): boolean {
  const empty = createEmptyTripDraft();

  return (
    getDestinationLabel(draft.destination).trim() !== '' ||
    draft.startDate !== '' ||
    draft.endDate !== '' ||
    draft.tripContext.length > 0 ||
    draft.accommodation !== null ||
    draft.laundry !== null ||
    draft.bags.length > 0 ||
    draft.note.trim() !== '' ||
    draft.travelers.length !== empty.travelers.length
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
