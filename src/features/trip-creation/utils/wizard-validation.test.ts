import { createDestinationFromText } from '@/domain/destination';
import { parseDate } from '@/domain/dates';
import { createEmptyTripDraft, type TripDraft } from '@/domain/trip-draft';
import { normalizeTripDraft } from '@/domain/trip-draft-profiles';
import { canProceedFromStepId } from '@/features/trip-creation/utils/wizard-validation';

function draftWithDates(startDate: string, endDate: string): TripDraft {
  return normalizeTripDraft({
    ...createEmptyTripDraft(),
    destination: createDestinationFromText('Tokyo'),
    startDate,
    endDate,
  });
}

describe('wizard destination date validation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(parseDate('2026-09-02'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('blocks continue when start date is before today', () => {
    const draft = draftWithDates('2026-09-01', '2026-09-05');
    expect(canProceedFromStepId('destination', draft)).toBe(false);
  });

  it('allows continue for today and future ranges', () => {
    expect(canProceedFromStepId('destination', draftWithDates('2026-09-02', '2026-09-02'))).toBe(
      true,
    );
    expect(canProceedFromStepId('destination', draftWithDates('2026-09-03', '2026-09-10'))).toBe(
      true,
    );
  });
});
