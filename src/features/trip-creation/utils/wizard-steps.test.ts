import {
  buildActiveWizardSteps,
  WIZARD_STEP_COUNT,
  wizardStepIndexForId,
} from '@/features/trip-creation/utils/wizard-steps';

describe('wizard step order', () => {
  it('places bags, important, and note in fixed order', () => {
    const steps = buildActiveWizardSteps();

    expect(wizardStepIndexForId(steps, 'bags')).toBeLessThan(wizardStepIndexForId(steps, 'important'));
    expect(wizardStepIndexForId(steps, 'important')).toBeLessThan(wizardStepIndexForId(steps, 'note'));
    expect(steps[wizardStepIndexForId(steps, 'important') + 1]).toBe('note');
  });

  it('always includes Important with a stable step count', () => {
    const first = buildActiveWizardSteps();
    const second = buildActiveWizardSteps();

    expect(first).toEqual(second);
    expect(first).toContain('important');
    expect(first.length).toBe(WIZARD_STEP_COUNT);
    expect(first.length).toBe(7);
  });
});
