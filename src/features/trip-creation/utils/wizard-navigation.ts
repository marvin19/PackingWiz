import type { Href } from 'expo-router';

import { WIZARD_STEP_COUNT } from '@/features/trip-creation/constants';

/** Stable step identifiers — map 1:1 to wizard step indices. */
export const WIZARD_STEP_KEYS = {
  destination: 0,
  'trip-context': 1,
  accommodation: 2,
  'packing-profiles': 3,
  travelers: 3,
  bags: 4,
  note: 5,
} as const;

export type WizardStepKey = keyof typeof WIZARD_STEP_KEYS;

export type WizardReturnTo = 'summary';

const STEP_ALIASES: Record<string, WizardStepKey> = {
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
};

export function wizardStepIndexForKey(stepKey: WizardStepKey): number {
  return WIZARD_STEP_KEYS[stepKey];
}

export function isWizardStepKey(value: string): value is WizardStepKey {
  return Object.hasOwn(WIZARD_STEP_KEYS, value);
}

export function parseWizardStepParam(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  const alias = STEP_ALIASES[normalized];
  if (alias) {
    return wizardStepIndexForKey(alias);
  }

  if (/^\d+$/.test(normalized)) {
    const index = Number.parseInt(normalized, 10);
    if (index >= 0 && index < WIZARD_STEP_COUNT) {
      return index;
    }
  }

  return null;
}

export function parseWizardReturnToParam(raw: string | string[] | undefined): WizardReturnTo | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === 'summary' ? 'summary' : null;
}

export function buildCreateTripEditHref(stepKey: WizardStepKey): Href {
  return `/trip/create?step=${stepKey}&returnTo=summary`;
}

export function isWizardEditFromSummary(returnTo: WizardReturnTo | null): boolean {
  return returnTo === 'summary';
}
