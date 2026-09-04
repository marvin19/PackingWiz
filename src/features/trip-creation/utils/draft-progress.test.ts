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
} from '@/features/trip-creation/utils/draft-progress';

describe('isDraftInProgress', () => {
  it('treats a brand-new empty draft as not in progress', () => {
    const stored = createStoredTripDraft();
    expect(isEmptyDraftContent(stored.draft)).toBe(true);
    expect(isDraftInProgress(stored.draft)).toBe(false);
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

    const draft = state.drafts[0]!.draft;
    expect(isDraftInProgress(draft)).toBe(true);
    expect(listInProgressDraftsOrdered(state)).toHaveLength(1);
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
