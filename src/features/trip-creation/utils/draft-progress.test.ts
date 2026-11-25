import { toIsoDate } from '@/domain/dates';
import { createDestinationFromText } from '@/domain/destination';
import {
  addStoredDraft,
  createStoredTripDraft,
  emptyTripDraftsState,
  getStoredDraftById,
  listInProgressDraftsOrdered,
  updateStoredDraftMeta,
  updateStoredDraftTrip,
} from '@/domain/trip-drafts-state';
import {
  isDraftInProgress,
  isEmptyDraftContent,
  isStoredDraftContentEmpty,
  isStoredDraftInProgress,
  resolveEmptyDraftBaselineDate,
} from '@/features/trip-creation/utils/draft-progress';

describe('isDraftInProgress', () => {
  it('treats a brand-new empty draft as not in progress', () => {
    const stored = createStoredTripDraft();
    expect(isStoredDraftContentEmpty(stored)).toBe(true);
    expect(isStoredDraftInProgress(stored)).toBe(false);
  });

  it('treats Tokyo + dates + Business as in progress', () => {
    const stored = createStoredTripDraft();
    let state = addStoredDraft(emptyTripDraftsState(), stored);
    state = updateStoredDraftTrip(state, stored.id, {
      destination: createDestinationFromText('Tokyo'),
      startDate: '2026-09-12',
      endDate: '2026-09-18',
      tripContext: ['Business'],
    });

    const updated = state.drafts[0]!;
    expect(isStoredDraftInProgress(updated)).toBe(true);
    expect(listInProgressDraftsOrdered(state)).toHaveLength(1);
  });
});

describe('PW-TECH-001G-C: stable empty draft detection', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('untouched draft remains empty on the creation calendar date', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-24T14:30:00'));

    const stored = createStoredTripDraft();
    expect(stored.draft.startDate).toBe('2026-11-24');
    expect(stored.draft.endDate).toBe('2026-11-25');
    expect(isStoredDraftContentEmpty(stored)).toBe(true);
    expect(listInProgressDraftsOrdered(addStoredDraft(emptyTripDraftsState(), stored))).toEqual([]);
  });

  it('untouched draft remains empty after local midnight (regression)', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-24T23:50:00'));

    const stored = createStoredTripDraft();
    const state = addStoredDraft(emptyTripDraftsState(), stored);

    jest.setSystemTime(new Date('2026-11-25T00:10:00'));

    expect(isEmptyDraftContent(stored.draft)).toBe(false);
    expect(isStoredDraftContentEmpty(stored)).toBe(true);
    expect(listInProgressDraftsOrdered(state)).toEqual([]);
  });

  it('untouched draft remains empty several days later', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-12-30T10:00:00'));

    const stored = createStoredTripDraft();
    jest.setSystemTime(new Date('2027-01-03T09:00:00'));

    expect(isStoredDraftContentEmpty(stored)).toBe(true);
  });

  it('explicit date changes count as meaningful content', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-24T12:00:00'));

    const stored = createStoredTripDraft();
    let state = addStoredDraft(emptyTripDraftsState(), stored);
    state = updateStoredDraftTrip(state, stored.id, {
      startDate: '2026-12-01',
      endDate: '2026-12-10',
    });

    const updated = state.drafts[0]!;
    expect(isStoredDraftInProgress(updated)).toBe(true);
    expect(listInProgressDraftsOrdered(state)).toHaveLength(1);
  });

  it('destination input makes a draft visible', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-24T12:00:00'));

    const stored = createStoredTripDraft();
    let state = addStoredDraft(emptyTripDraftsState(), stored);
    state = updateStoredDraftTrip(state, stored.id, {
      destination: createDestinationFromText('Bergen'),
    });

    expect(isStoredDraftInProgress(state.drafts[0]!)).toBe(true);
    expect(listInProgressDraftsOrdered(state)).toHaveLength(1);
  });

  it('resumed drafts keep stored dates and empty baseline', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-24T12:00:00'));

    let state = addStoredDraft(emptyTripDraftsState(), createStoredTripDraft());
    const stored = state.drafts[0]!;
    jest.setSystemTime(new Date('2026-11-28T12:00:00'));

    state = updateStoredDraftMeta(state, stored.id, { wizardStep: 1 });
    const resumed = state.drafts[0]!;
    expect(resumed.draft.startDate).toBe('2026-11-24');
    expect(resumed.draft.endDate).toBe('2026-11-25');
    expect(isStoredDraftContentEmpty(resumed)).toBe(true);
  });

  it('handles month and year boundaries for baseline', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-12-31T20:00:00'));

    const stored = createStoredTripDraft();
    expect(stored.draft.startDate).toBe('2026-12-31');
    expect(stored.draft.endDate).toBe('2027-01-01');

    jest.setSystemTime(new Date('2027-01-05T08:00:00'));
    expect(toIsoDate(resolveEmptyDraftBaselineDate(stored))).toBe('2026-12-31');
    expect(isStoredDraftContentEmpty(stored)).toBe(true);
  });

  it('legacy stored drafts without createdAt use updatedAt baseline', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-24T08:00:00'));

    const stored = createStoredTripDraft();
    const legacy: typeof stored = { ...stored, createdAt: undefined };

    jest.setSystemTime(new Date('2026-11-26T08:00:00'));
    expect(isStoredDraftContentEmpty(legacy)).toBe(true);
  });

  it('draft-only isDraftInProgress uses the current calendar day unless a baseline is passed', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-24T12:00:00'));
    const stored = createStoredTripDraft();

    jest.setSystemTime(new Date('2026-11-25T12:00:00'));
    expect(isDraftInProgress(stored.draft)).toBe(true);
    expect(
      isDraftInProgress(stored.draft, resolveEmptyDraftBaselineDate(stored)),
    ).toBe(false);
    expect(isStoredDraftContentEmpty(stored)).toBe(true);
  });
});

describe('MP5B-B regression: save and close draft visibility', () => {
  it('lists the draft with entered values and preserved wizard step after wizard edits', () => {
    const stored = createStoredTripDraft();
    let state = addStoredDraft(emptyTripDraftsState(), stored);

    state = updateStoredDraftTrip(state, stored.id, {
      destination: createDestinationFromText('Tokyo'),
      startDate: '2026-09-12',
      endDate: '2026-09-18',
    });
    state = updateStoredDraftMeta(state, stored.id, { wizardStep: 1 });
    state = updateStoredDraftTrip(state, stored.id, {
      tripContext: ['Business'],
    });

    const ordered = listInProgressDraftsOrdered(state);

    expect(ordered).toHaveLength(1);
    expect(ordered[0]!.id).toBe(stored.id);
    expect(ordered[0]!.draft.destination.displayName).toBe('Tokyo');
    expect(ordered[0]!.draft.startDate).toBe('2026-09-12');
    expect(ordered[0]!.draft.endDate).toBe('2026-09-18');
    expect(ordered[0]!.draft.tripContext).toEqual(['Business']);
    expect(ordered[0]!.wizardStep).toBe(1);
    expect(state.activeDraftId).toBe(stored.id);
  });

  it('does not list a fresh empty draft before meaningful edits', () => {
    const stored = createStoredTripDraft();
    const state = addStoredDraft(emptyTripDraftsState(), stored);

    expect(listInProgressDraftsOrdered(state)).toEqual([]);
    expect(state.drafts).toHaveLength(1);
    expect(state.activeDraftId).toBe(stored.id);
  });

  it('leaves Draft B unchanged when Draft A is edited', () => {
    const draftA = createStoredTripDraft({ destination: createDestinationFromText('Tokyo') });
    const draftB = createStoredTripDraft({ destination: createDestinationFromText('Paris') });
    let state = addStoredDraft(addStoredDraft(emptyTripDraftsState(), draftA), draftB);

    state = updateStoredDraftTrip(state, draftA.id, {
      tripContext: ['Business'],
    });

    expect(getStoredDraftById(state, draftB.id)!.draft.destination.displayName).toBe('Paris');
    expect(getStoredDraftById(state, draftB.id)!.draft.tripContext).toEqual([]);
    expect(listInProgressDraftsOrdered(state).map((entry) => entry.id).sort()).toEqual(
      [draftA.id, draftB.id].sort(),
    );
  });
});
