import { getDestinationLabel } from '@/domain/destination';
import { isEndBeforeStart } from '@/domain/dates';
import { normalizeTripDraft } from '@/domain/trip-draft-profiles';
import type { TripDraft } from '@/domain/trip-draft';

export function canProceedFromStep(step: number, draft: TripDraft): boolean {
  const normalizedDraft = normalizeTripDraft(draft);

  switch (step) {
    case 0:
      return (
        getDestinationLabel(normalizedDraft.destination).trim() !== '' &&
        normalizedDraft.startDate !== '' &&
        normalizedDraft.endDate !== '' &&
        !isEndBeforeStart(normalizedDraft.startDate, normalizedDraft.endDate)
      );
    case 1:
      return normalizedDraft.tripContext.length > 0;
    case 2:
      return normalizedDraft.accommodation !== null && normalizedDraft.laundry !== null;
    case 3:
      return normalizedDraft.packingProfiles.length > 0;
    case 4:
    case 5:
      return true;
    default:
      return false;
  }
}

export function wizardContinueLabel(
  step: number,
  totalSteps: number,
  options: { returnToSummary?: boolean } = {},
): string {
  if (options.returnToSummary) {
    return 'Done';
  }

  return step === totalSteps - 1 ? 'Review trip' : 'Continue';
}
