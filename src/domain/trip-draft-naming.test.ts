import { createDestinationFromText } from '@/domain/destination';
import { createEmptyTripDraft } from '@/domain/trip-draft';
import {
  applyTripDraftPatch,
  createTripDraftNameInputPatch,
  createUserEditedTripDraftNamePatch,
  resolveCommittedTripNameFromDraft,
  resolveTripDraftName,
} from '@/domain/trip-draft-naming';
import {
  addStoredDraft,
  createStoredTripDraft,
  emptyTripDraftsState,
  getStoredDraftById,
  resumeDraftInState,
  updateStoredDraftTrip,
} from '@/domain/trip-drafts-state';

describe('applyTripDraftPatch', () => {
  it('derives the default name from destination on first destination entry', () => {
    const draft = createEmptyTripDraft('draft-1');
    const next = applyTripDraftPatch(draft, {
      destination: createDestinationFromText('Barcelona', 'Spain'),
    });

    expect(next.name).toBe('Barcelona');
    expect(next.isTripNameUserEdited).toBe(false);
  });

  it('updates the default name when destination changes before manual rename', () => {
    let draft = applyTripDraftPatch(createEmptyTripDraft('draft-1'), {
      destination: createDestinationFromText('Barcelona', 'Spain'),
    });

    draft = applyTripDraftPatch(draft, {
      destination: createDestinationFromText('London', 'United Kingdom'),
    });

    expect(draft.name).toBe('London');
    expect(draft.isTripNameUserEdited).toBe(false);
  });

  it('does not overwrite a manually edited name when destination changes', () => {
    let draft = applyTripDraftPatch(createEmptyTripDraft('draft-1'), {
      destination: createDestinationFromText('Barcelona', 'Spain'),
    });

    draft = applyTripDraftPatch(draft, createUserEditedTripDraftNamePatch('Festival in Barcelona'));

    draft = applyTripDraftPatch(draft, {
      destination: createDestinationFromText('London', 'United Kingdom'),
    });

    expect(draft.name).toBe('Festival in Barcelona');
    expect(draft.isTripNameUserEdited).toBe(true);
  });

  it('does not overwrite a manually edited name when unrelated draft fields change', () => {
    let draft = applyTripDraftPatch(createEmptyTripDraft('draft-1'), {
      destination: createDestinationFromText('Geiranger', 'Norway'),
    });

    draft = applyTripDraftPatch(draft, createUserEditedTripDraftNamePatch('Camping in Geiranger'));

    draft = applyTripDraftPatch(draft, {
      tripContext: ['Camping'],
      note: 'Bring the tarp',
      startDate: '2026-08-01',
      endDate: '2026-08-08',
    });

    expect(draft.name).toBe('Camping in Geiranger');
    expect(draft.isTripNameUserEdited).toBe(true);
  });
});

describe('createTripDraftNameInputPatch', () => {
  it('clears user ownership when the field is emptied so destination can drive the name again', () => {
    let draft = applyTripDraftPatch(createEmptyTripDraft('draft-1'), {
      destination: createDestinationFromText('Barcelona', 'Spain'),
    });

    draft = applyTripDraftPatch(draft, createTripDraftNameInputPatch('Hyttetur'));
    draft = applyTripDraftPatch(draft, createTripDraftNameInputPatch(''));

    expect(draft.name).toBe('Barcelona');
    expect(draft.isTripNameUserEdited).toBe(false);

    draft = applyTripDraftPatch(draft, {
      destination: createDestinationFromText('London', 'United Kingdom'),
    });

    expect(draft.name).toBe('London');
    expect(draft.isTripNameUserEdited).toBe(false);
  });

  it('marks the name as user-edited when the user types', () => {
    const patch = createTripDraftNameInputPatch('Festival in Barcelona');
    expect(patch).toEqual({
      name: 'Festival in Barcelona',
      isTripNameUserEdited: true,
    });
  });
});

describe('trip name typing and commit normalization', () => {
  it('preserves internal and trailing spaces while the user is typing', () => {
    let draft = applyTripDraftPatch(createEmptyTripDraft('draft-1'), {
      destination: createDestinationFromText('Barcelona', 'Spain'),
    });

    draft = applyTripDraftPatch(draft, createUserEditedTripDraftNamePatch('Festival'));
    draft = applyTripDraftPatch(draft, createUserEditedTripDraftNamePatch('Festival '));
    draft = applyTripDraftPatch(draft, createUserEditedTripDraftNamePatch('Festival in Barcelona'));

    expect(draft.name).toBe('Festival in Barcelona');
    expect(draft.isTripNameUserEdited).toBe(true);
  });

  it('preserves multi-word names across draft round-trip updates', () => {
    const stored = createStoredTripDraft({
      destination: createDestinationFromText('Geiranger', 'Norway'),
    });

    let state = addStoredDraft(emptyTripDraftsState(), stored);
    state = updateStoredDraftTrip(
      state,
      stored.id,
      createUserEditedTripDraftNamePatch('Camping in Geiranger'),
    );

    const reloaded = getStoredDraftById(state, stored.id)!;
    expect(reloaded.draft.name).toBe('Camping in Geiranger');
  });

  it('trims only outer whitespace when resolving the committed name', () => {
    const draft = {
      ...createEmptyTripDraft('draft-1'),
      destination: createDestinationFromText('Barcelona', 'Spain'),
      name: '  Festival in Barcelona  ',
      isTripNameUserEdited: true,
    };

    expect(resolveCommittedTripNameFromDraft(draft)).toBe('Festival in Barcelona');
    expect(resolveTripDraftName(draft)).toBe('Festival in Barcelona');
  });

  it('falls back when the stored draft name is whitespace-only', () => {
    const draft = {
      ...createEmptyTripDraft('draft-1'),
      destination: createDestinationFromText('Barcelona', 'Spain'),
      name: '   ',
      isTripNameUserEdited: true,
    };

    expect(resolveCommittedTripNameFromDraft(draft)).toBe('Barcelona');
  });
});

describe('resolveCommittedTripNameFromDraft', () => {
  it('falls back to destination label when draft name is blank', () => {
    const draft = {
      ...createEmptyTripDraft('draft-1'),
      destination: createDestinationFromText('Barcelona', 'Spain'),
      name: '',
    };

    expect(resolveCommittedTripNameFromDraft(draft)).toBe('Barcelona');
    expect(resolveTripDraftName(draft)).toBe('Barcelona');
  });

  it('uses the draft name when present', () => {
    const draft = {
      ...createEmptyTripDraft('draft-1'),
      destination: createDestinationFromText('London', 'United Kingdom'),
      name: 'Festival in London',
      isTripNameUserEdited: true,
    };

    expect(resolveCommittedTripNameFromDraft(draft)).toBe('Festival in London');
  });
});

describe('draft resume preserves trip name ownership', () => {
  it('keeps name and isTripNameUserEdited across resume', () => {
    const stored = createStoredTripDraft({
      destination: createDestinationFromText('Barcelona', 'Spain'),
    });

    let state = addStoredDraft(emptyTripDraftsState(), stored);
    state = updateStoredDraftTrip(state, stored.id, createUserEditedTripDraftNamePatch('Beach break'));

    const resumed = resumeDraftInState(state, stored.id);
    expect(resumed).not.toBeNull();

    const reloaded = getStoredDraftById(resumed!, stored.id)!;
    expect(reloaded.draft.name).toBe('Beach break');
    expect(reloaded.draft.isTripNameUserEdited).toBe(true);
  });
});
