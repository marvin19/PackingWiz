import { normalizeTripDraft } from '@/domain/trip-draft-profiles';
import type { TripDraft } from '@/domain/trip-draft';
import { canProceedFromStepId } from '@/features/trip-creation/utils/wizard-validation';
import type { WizardStepId } from '@/features/trip-creation/utils/wizard-steps';

export const WIZARD_CONTINUE_HINT_TRIP_CONTEXT_REQUIRED =
  'Select at least one trip tag to continue.';

export const WIZARD_CONTINUE_HINT_ACCOMMODATION_REQUIRED =
  'Select where you\u2019re staying to continue.';

export const WIZARD_CONTINUE_HINT_LAUNDRY_REQUIRED =
  'Choose a laundry option to continue.';

export type WizardContinueHintContext = {
  referenceDate?: Date;
};

/**
 * User-facing reason Continue is disabled — mirrors {@link canProceedFromStepId} without duplicating rules.
 * Destination step uses required-field indicators instead of footer hints (D5-2A).
 */
export function getWizardStepContinueBlockReason(
  stepId: WizardStepId,
  draft: TripDraft,
  _context: WizardContinueHintContext = {},
): string | null {
  const normalizedDraft = normalizeTripDraft(draft);

  if (canProceedFromStepId(stepId, normalizedDraft)) {
    return null;
  }

  switch (stepId) {
    case 'destination':
      return null;
    case 'trip-context':
      return WIZARD_CONTINUE_HINT_TRIP_CONTEXT_REQUIRED;
    case 'accommodation': {
      if (normalizedDraft.accommodation === null) {
        return WIZARD_CONTINUE_HINT_ACCOMMODATION_REQUIRED;
      }

      if (normalizedDraft.laundry === null) {
        return WIZARD_CONTINUE_HINT_LAUNDRY_REQUIRED;
      }

      return null;
    }
    default:
      return null;
  }
}
