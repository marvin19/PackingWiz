import { getDestinationLabel } from '@/domain/destination';
import { isEndBeforeStart } from '@/domain/dates';
import { normalizeTripDraft } from '@/domain/trip-draft-profiles';
import type { TripDraft } from '@/domain/trip-draft';
import type { WizardStepId } from '@/features/trip-creation/utils/wizard-steps';

export function canProceedFromStepId(stepId: WizardStepId, draft: TripDraft): boolean {
  const normalizedDraft = normalizeTripDraft(draft);

  switch (stepId) {
    case 'destination':
      return (
        getDestinationLabel(normalizedDraft.destination).trim() !== '' &&
        normalizedDraft.startDate !== '' &&
        normalizedDraft.endDate !== '' &&
        !isEndBeforeStart(normalizedDraft.startDate, normalizedDraft.endDate)
      );
    case 'trip-context':
      return normalizedDraft.tripContext.length > 0;
    case 'accommodation':
      return normalizedDraft.accommodation !== null && normalizedDraft.laundry !== null;
    case 'packing-profiles':
      return normalizedDraft.packingProfiles.length > 0;
    case 'bags':
    case 'important':
    case 'note':
      return true;
    default:
      return false;
  }
}

/** @deprecated Use canProceedFromStepId with fixed wizard steps. */
export function canProceedFromStep(step: number, draft: TripDraft): boolean {
  const stepIds: WizardStepId[] = [
    'destination',
    'trip-context',
    'accommodation',
    'packing-profiles',
    'bags',
    'important',
    'note',
  ];
  const stepId = stepIds[step];
  if (!stepId) {
    return false;
  }

  return canProceedFromStepId(stepId, draft);
}

export function wizardContinueLabel(
  stepIndex: number,
  totalSteps: number,
  options: { returnToSummary?: boolean } = {},
): string {
  if (options.returnToSummary) {
    return 'Done';
  }

  return stepIndex === totalSteps - 1 ? 'Review trip' : 'Continue';
}
