/** Stable wizard step identifiers — fixed sequence before Review trip. */
export type WizardStepId =
  | 'destination'
  | 'trip-context'
  | 'accommodation'
  | 'packing-profiles'
  | 'bags'
  | 'important'
  | 'note';

export const WIZARD_STEPS: WizardStepId[] = [
  'destination',
  'trip-context',
  'accommodation',
  'packing-profiles',
  'bags',
  'important',
  'note',
];

export const WIZARD_STEP_COUNT = WIZARD_STEPS.length;

/** Index of the final wizard step before Review trip (Anything else). */
export const LAST_WIZARD_STEP_INDEX = WIZARD_STEPS.length - 1;

export const WIZARD_STEP_TITLE_BY_ID: Record<WizardStepId, string> = {
  destination: 'Where are you going?',
  'trip-context': 'What kind of trip is this?',
  accommodation: 'Where are you staying?',
  'packing-profiles': 'Who are you packing for?',
  bags: 'What are you packing in?',
  important: 'Important items',
  note: 'Anything else?',
};

/** Fixed wizard steps before Summary — Important is always included. */
export function buildActiveWizardSteps(): WizardStepId[] {
  return [...WIZARD_STEPS];
}

export function wizardStepTitle(stepId: WizardStepId): string {
  return WIZARD_STEP_TITLE_BY_ID[stepId];
}

export function wizardStepIndexForId(steps: WizardStepId[], stepId: WizardStepId): number {
  return steps.indexOf(stepId);
}

export function clampWizardStepIndex(steps: WizardStepId[], index: number): number {
  if (steps.length === 0) {
    return 0;
  }

  return Math.min(Math.max(index, 0), steps.length - 1);
}

export function resolveLastWizardStepIndex(): number {
  return LAST_WIZARD_STEP_INDEX;
}

export function resolveLastWizardStepId(): WizardStepId {
  return WIZARD_STEPS[LAST_WIZARD_STEP_INDEX] ?? 'note';
}

export function resolveWizardStepIndex(
  steps: WizardStepId[],
  options: { index?: number | null; stepId?: WizardStepId | null },
): number {
  if (options.stepId) {
    const byId = wizardStepIndexForId(steps, options.stepId);
    if (byId >= 0) {
      return byId;
    }
  }

  if (options.index !== null && options.index !== undefined) {
    return clampWizardStepIndex(steps, options.index);
  }

  return 0;
}
