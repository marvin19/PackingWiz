import { getDestinationLabel } from '@/domain/destination';
import { isEndBeforeStart } from '@/domain/dates';
import type { TripDraft } from '@/domain/trip-draft';

export function canProceedFromStep(step: number, draft: TripDraft): boolean {
  switch (step) {
    case 0:
      return (
        getDestinationLabel(draft.destination).trim() !== '' &&
        draft.startDate !== '' &&
        draft.endDate !== '' &&
        !isEndBeforeStart(draft.startDate, draft.endDate)
      );
    case 1:
      return draft.tripContext.length > 0;
    case 2:
      return draft.accommodation !== null && draft.laundry !== null;
    case 3:
      return draft.travelers.length > 0;
    case 4:
    case 5:
      return true;
    default:
      return false;
  }
}

export function wizardContinueLabel(step: number, totalSteps: number): string {
  return step === totalSteps - 1 ? 'Review trip' : 'Continue';
}
