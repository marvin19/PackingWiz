export const GENERATION_STEPS = [
  'Checking your trip',
  'Looking at the weather',
  'Considering your activities',
  'Personalizing for travelers',
  'Building your packing list',
] as const;

export const GENERATION_STEP_DELAY_MS = 650;
export const GENERATION_FINISH_DELAY_MS = 700;

export function getGenerationStepStatus(
  stepIndex: number,
  activeStep: number,
): 'pending' | 'active' | 'done' {
  if (activeStep > stepIndex) {
    return 'done';
  }
  if (activeStep === stepIndex) {
    return 'active';
  }
  return 'pending';
}

export function getTotalGenerationDurationMs(): number {
  return GENERATION_STEP_DELAY_MS * GENERATION_STEPS.length + GENERATION_FINISH_DELAY_MS;
}
