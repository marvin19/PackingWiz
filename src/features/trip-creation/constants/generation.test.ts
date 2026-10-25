import {
  GENERATION_STEP_DELAY_MS,
  GENERATION_STEPS,
  getGenerationAnimationCompleteStep,
  getTotalGenerationDurationMs,
  isGenerationReadyToNavigate,
} from '@/features/trip-creation/constants/generation';

describe('generation constants', () => {
  it('requires all illustrative steps before post-success navigation', () => {
    expect(getGenerationAnimationCompleteStep()).toBe(GENERATION_STEPS.length);
    expect(isGenerationReadyToNavigate('success', GENERATION_STEPS.length - 1)).toBe(false);
    expect(isGenerationReadyToNavigate('success', GENERATION_STEPS.length)).toBe(true);
    expect(isGenerationReadyToNavigate('running', GENERATION_STEPS.length)).toBe(false);
    expect(isGenerationReadyToNavigate('error', GENERATION_STEPS.length)).toBe(false);
  });

  it('documents minimum visible duration for instant commit', () => {
    expect(getTotalGenerationDurationMs()).toBe(
      GENERATION_STEP_DELAY_MS * GENERATION_STEPS.length + 700,
    );
  });
});
