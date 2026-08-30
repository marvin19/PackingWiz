import type { Href } from 'expo-router';

import type { WizardStepId } from '@/features/trip-creation/utils/wizard-steps';

/** Legacy aliases map to stable step ids (not numeric indices). */
export type WizardStepKey = WizardStepId | 'travelers';

export type WizardReturnTo = 'summary';

const STEP_ALIASES: Record<string, WizardStepId> = {
  destination: 'destination',
  dates: 'destination',
  'destination-dates': 'destination',
  'trip-context': 'trip-context',
  context: 'trip-context',
  accommodation: 'accommodation',
  laundry: 'accommodation',
  'accommodation-laundry': 'accommodation',
  travelers: 'packing-profiles',
  'packing-profiles': 'packing-profiles',
  'packing-for': 'packing-profiles',
  bags: 'bags',
  note: 'note',
  'additional-information': 'note',
  important: 'important',
  'important-items': 'important',
};

export function parseWizardStepKeyParam(raw: string | string[] | undefined): WizardStepId | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return STEP_ALIASES[normalized] ?? null;
}

/** @deprecated Prefer parseWizardStepKeyParam — numeric indices are not stable across flows. */
export function parseWizardStepParam(raw: string | string[] | undefined): number | null {
  const stepId = parseWizardStepKeyParam(raw);
  if (stepId) {
    return null;
  }

  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value && /^\d+$/.test(value.trim())) {
    return Number.parseInt(value.trim(), 10);
  }

  return null;
}

export function parseWizardReturnToParam(raw: string | string[] | undefined): WizardReturnTo | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === 'summary' ? 'summary' : null;
}

export function buildCreateTripEditHref(stepKey: WizardStepKey): Href {
  const stepId: WizardStepId = stepKey === 'travelers' ? 'packing-profiles' : stepKey;
  return `/trip/create?step=${stepId}&returnTo=summary`;
}

export function isWizardEditFromSummary(returnTo: WizardReturnTo | null): boolean {
  return returnTo === 'summary';
}
