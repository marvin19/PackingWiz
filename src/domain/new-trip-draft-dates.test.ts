import { parseDate, durationDays } from '@/domain/dates';
import {
  addLocalCalendarDays,
  createDefaultNewTripDateRange,
  withDefaultNewTripDatesIfUnset,
} from '@/domain/new-trip-draft-dates';
import { validateNewTripDateRange } from '@/domain/new-trip-date-validation';
import { createDestinationFromText } from '@/domain/destination';
import { createEmptyTripDraft, type TripDraft } from '@/domain/trip-draft';
import { normalizeTripDraft } from '@/domain/trip-draft-profiles';
import {
  addStoredDraft,
  createStoredTripDraft,
  emptyTripDraftsState,
  updateStoredDraftTrip,
} from '@/domain/trip-drafts-state';
import { canProceedFromStepId } from '@/features/trip-creation/utils/wizard-validation';

describe('createDefaultNewTripDateRange', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 8, 2, 15, 30, 0));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('uses today local calendar day as departure', () => {
    expect(createDefaultNewTripDateRange()).toEqual({
      startDate: '2026-09-02',
      endDate: '2026-09-03',
    });
  });

  it('sets return exactly one calendar day after departure', () => {
    const { startDate, endDate } = createDefaultNewTripDateRange();
    expect(durationDays(startDate, endDate)).toBe(2);
    expect(parseDate(endDate).getDate() - parseDate(startDate).getDate()).toBe(1);
  });

  it('crosses month boundaries', () => {
    jest.setSystemTime(new Date(2026, 0, 31, 12, 0, 0));
    expect(createDefaultNewTripDateRange()).toEqual({
      startDate: '2026-01-31',
      endDate: '2026-02-01',
    });
  });

  it('crosses year boundaries', () => {
    jest.setSystemTime(new Date(2026, 11, 31, 12, 0, 0));
    expect(createDefaultNewTripDateRange()).toEqual({
      startDate: '2026-12-31',
      endDate: '2027-01-01',
    });
  });

  it('advances local calendar days across a DST spring-forward boundary (US)', () => {
    const beforeDst = new Date(2026, 2, 7, 12, 0, 0);
    const after = addLocalCalendarDays(beforeDst, 1);
    expect(toLocalIso(after)).toBe('2026-03-08');
    expect(createDefaultNewTripDateRange(beforeDst)).toEqual({
      startDate: '2026-03-07',
      endDate: '2026-03-08',
    });
  });
});

function toLocalIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

describe('withDefaultNewTripDatesIfUnset', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(parseDate('2026-09-02'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('fills both dates when unset', () => {
    const base = { startDate: '', endDate: '' };
    expect(withDefaultNewTripDatesIfUnset(base)).toEqual({
      startDate: '2026-09-02',
      endDate: '2026-09-03',
    });
  });

  it('does not overwrite an existing range', () => {
    const existing = { startDate: '2026-10-01', endDate: '2026-10-05' };
    expect(withDefaultNewTripDatesIfUnset(existing)).toBe(existing);
  });

  it('does not fill when only departure is set', () => {
    const partial = { startDate: '2026-09-10', endDate: '' };
    expect(withDefaultNewTripDatesIfUnset(partial)).toBe(partial);
  });

  it('does not fill when only return is set', () => {
    const partial = { startDate: '', endDate: '2026-09-12' };
    expect(withDefaultNewTripDatesIfUnset(partial)).toBe(partial);
  });
});

describe('createStoredTripDraft date initialization', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(parseDate('2026-09-02'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes new stored drafts with default departure and return', () => {
    const stored = createStoredTripDraft();
    expect(stored.draft.startDate).toBe('2026-09-02');
    expect(stored.draft.endDate).toBe('2026-09-03');
  });

  it('preserves explicit overrides including partial dates', () => {
    const stored = createStoredTripDraft({
      startDate: '2026-11-01',
      endDate: '2026-11-08',
    });
    expect(stored.draft.startDate).toBe('2026-11-01');
    expect(stored.draft.endDate).toBe('2026-11-08');
  });

  it('does not overwrite partial date overrides on create', () => {
    const stored = createStoredTripDraft({ startDate: '2026-11-01', endDate: '' });
    expect(stored.draft.startDate).toBe('2026-11-01');
    expect(stored.draft.endDate).toBe('');
  });
});

describe('wizard and validation with default dates', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(parseDate('2026-09-02'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function draftWithDefaults(): TripDraft {
    return normalizeTripDraft({
      ...createEmptyTripDraft(),
      ...createDefaultNewTripDateRange(),
      destination: createDestinationFromText('Oslo', 'Norway'),
    });
  }

  it('enables Continue on destination when dates and destination satisfy validation', () => {
    expect(canProceedFromStepId('destination', draftWithDefaults())).toBe(true);
  });

  it('still allows same-day trips when explicitly set', () => {
    const draft = normalizeTripDraft({
      ...createEmptyTripDraft(),
      destination: createDestinationFromText('Oslo'),
      startDate: '2026-09-02',
      endDate: '2026-09-02',
    });
    expect(canProceedFromStepId('destination', draft)).toBe(true);
    expect(validateNewTripDateRange(draft.startDate, draft.endDate, parseDate('2026-09-02'))).toEqual({
      ok: true,
    });
  });

  it('rejects return before departure', () => {
    const draft = normalizeTripDraft({
      ...createEmptyTripDraft(),
      destination: createDestinationFromText('Oslo'),
      startDate: '2026-09-05',
      endDate: '2026-09-03',
    });
    expect(canProceedFromStepId('destination', draft)).toBe(false);
  });

  it('rejects past departure for new trips', () => {
    expect(
      validateNewTripDateRange('2026-09-01', '2026-09-03', parseDate('2026-09-02')),
    ).toEqual({ ok: false, issue: 'start_before_today' });
  });
});

describe('changing departure does not auto-adjust return', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(parseDate('2026-09-02'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps return date when departure changes in stored draft updates', () => {
    const stored = createStoredTripDraft();
    let state = addStoredDraft(emptyTripDraftsState(), stored);
    expect(stored.draft.endDate).toBe('2026-09-03');

    state = updateStoredDraftTrip(state, stored.id, { startDate: '2026-09-10' });
    const updated = state.drafts[0]!.draft;
    expect(updated.startDate).toBe('2026-09-10');
    expect(updated.endDate).toBe('2026-09-03');
  });
});