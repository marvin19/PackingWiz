import { createDestinationFromText } from '@/domain/destination';
import { parseDate } from '@/domain/dates';
import { NEW_TRIP_START_DATE_PAST_MESSAGE } from '@/domain/new-trip-date-validation';
import { createEmptyTripDraft, type TripDraft } from '@/domain/trip-draft';
import { normalizeTripDraft } from '@/domain/trip-draft-profiles';
import {
  getWizardStepContinueBlockReason,
  WIZARD_CONTINUE_HINT_ACCOMMODATION_REQUIRED,
  WIZARD_CONTINUE_HINT_LAUNDRY_REQUIRED,
  WIZARD_CONTINUE_HINT_TRIP_CONTEXT_REQUIRED,
} from '@/features/trip-creation/utils/wizard-continue-hint';
import { canProceedFromStepId } from '@/features/trip-creation/utils/wizard-validation';

function draftWithDates(startDate: string, endDate: string): TripDraft {
  return normalizeTripDraft({
    ...createEmptyTripDraft(),
    destination: createDestinationFromText('Tokyo'),
    startDate,
    endDate,
  });
}

describe('getWizardStepContinueBlockReason', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(parseDate('2026-09-02'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns null when the step can proceed', () => {
    const draft = draftWithDates('2026-09-03', '2026-09-10');
    expect(canProceedFromStepId('destination', draft)).toBe(true);
    expect(getWizardStepContinueBlockReason('destination', draft)).toBeNull();
  });

  it('does not show footer hints on the destination step (D5-2A)', () => {
    expect(getWizardStepContinueBlockReason('destination', createEmptyTripDraft())).toBeNull();

    expect(
      getWizardStepContinueBlockReason(
        'destination',
        normalizeTripDraft({
          ...createEmptyTripDraft(),
          destination: createDestinationFromText('Oslo'),
          startDate: '2026-09-03',
        }),
      ),
    ).toBeNull();

    expect(getWizardStepContinueBlockReason('destination', draftWithDates('2026-09-01', '2026-09-05'))).toBeNull();
    expect(canProceedFromStepId('destination', draftWithDates('2026-09-01', '2026-09-05'))).toBe(false);
    expect(NEW_TRIP_START_DATE_PAST_MESSAGE).toMatch(/past/);
  });

  it('requires at least one trip context tag', () => {
    const draft = normalizeTripDraft({
      ...createEmptyTripDraft(),
      destination: createDestinationFromText('Oslo'),
      startDate: '2026-09-03',
      endDate: '2026-09-05',
      tripContext: [],
    });

    expect(getWizardStepContinueBlockReason('trip-context', draft)).toBe(
      WIZARD_CONTINUE_HINT_TRIP_CONTEXT_REQUIRED,
    );
  });

  it('requires accommodation before laundry guidance', () => {
    const draft = normalizeTripDraft({
      ...createEmptyTripDraft(),
      accommodation: null,
      laundry: null,
    });

    expect(getWizardStepContinueBlockReason('accommodation', draft)).toBe(
      WIZARD_CONTINUE_HINT_ACCOMMODATION_REQUIRED,
    );
  });

  it('requires laundry when accommodation is selected', () => {
    const draft = normalizeTripDraft({
      ...createEmptyTripDraft(),
      accommodation: 'hotel',
      laundry: null,
    });

    expect(getWizardStepContinueBlockReason('accommodation', draft)).toBe(
      WIZARD_CONTINUE_HINT_LAUNDRY_REQUIRED,
    );
  });

  it('returns null for optional wizard steps', () => {
    const draft = createEmptyTripDraft();
    expect(getWizardStepContinueBlockReason('bags', draft)).toBeNull();
    expect(getWizardStepContinueBlockReason('note', draft)).toBeNull();
  });
});
