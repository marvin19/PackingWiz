import { formatRange } from '@/domain/dates';
import { getDestinationLabel } from '@/domain/destination';
import { formatTripPeopleCount } from '@/domain/packing-list-display';
import type { TripDraft } from '@/domain/trip-draft';
import type { StoredTripDraft } from '@/domain/trip-drafts-state';
import {
  buildActiveWizardSteps,
  clampWizardStepIndex,
  WIZARD_STEP_COUNT,
} from '@/features/trip-creation/utils/wizard-steps';

export const DRAFT_HOME_FALLBACK_TITLE = 'New trip';
export const DRAFT_HOME_DATES_NOT_ADDED = 'Dates not added';

export function getDraftDisplayTitle(draft: TripDraft): string {
  const destination = getDestinationLabel(draft.destination).trim();
  return destination.length > 0 ? destination : DRAFT_HOME_FALLBACK_TITLE;
}

export function getDraftDateRangeLabel(draft: TripDraft): string {
  if (draft.startDate && draft.endDate) {
    return formatRange(draft.startDate, draft.endDate);
  }

  return DRAFT_HOME_DATES_NOT_ADDED;
}

export function getDraftPeopleCountLabel(draft: TripDraft): string {
  return formatTripPeopleCount(draft.packingProfiles.length);
}

export function getDraftMetadataLine(draft: TripDraft): string {
  return `${getDraftDateRangeLabel(draft)} · ${getDraftPeopleCountLabel(draft)}`;
}

export function getDraftWizardProgressLabel(stored: StoredTripDraft): string {
  if (stored.reachedSummary) {
    return 'Review trip';
  }

  const steps = buildActiveWizardSteps();
  const stepIndex = clampWizardStepIndex(steps, stored.wizardStep);
  return `Step ${stepIndex + 1} of ${WIZARD_STEP_COUNT}`;
}

export function buildDraftCardAccessibilityLabel(stored: StoredTripDraft): string {
  const title = getDraftDisplayTitle(stored.draft);
  const metadata = getDraftMetadataLine(stored.draft);
  return `Continue planning ${title}, ${metadata}`;
}

export function buildDraftDeleteAccessibilityLabel(stored: StoredTripDraft): string {
  return `Delete ${getDraftDisplayTitle(stored.draft)} draft`;
}

export function resolveDraftResumeRoute(
  stored: StoredTripDraft,
): '/trip/summary' | '/trip/create' {
  return stored.reachedSummary ? '/trip/summary' : '/trip/create';
}

/** Explicit Trips/Home target — never router.back() from Summary (stack includes wizard). */
export function resolveDraftSaveAndCloseRoute(): '/(tabs)' {
  return '/(tabs)';
}
