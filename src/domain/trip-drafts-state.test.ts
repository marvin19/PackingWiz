import { createDestinationFromText } from '@/domain/destination';
import {
  isDraftOnlyProfileId,
  mergeImportantStores,
  readImportantConfigFromStores,
} from '@/domain/draft-important-scope';
import {
  getImportantConfigForProfile,
  saveImportantItemNamesForProfile,
} from '@/domain/profile-important-items';
import { createEmptyTripDraft } from '@/domain/trip-draft';
import { createDraftProfile, patchDraftPackingProfiles } from '@/domain/trip-draft-profiles';
import {
  addStoredDraft,
  allStoredDraftIdentitiesMatch,
  cloneTripDraft,
  createStoredTripDraft,
  deleteDraftInState,
  emptyTripDraftsState,
  findPrimaryInProgressDraft,
  getStoredDraftById,
  removeCommittedDraft,
  resolveActiveDraftIdForMutation,
  resolveCommitDraftTargetId,
  resumeDraftInState,
  saveDraftImportantNames,
  storedDraftIdentitiesMatch,
  updateStoredDraftMeta,
  updateStoredDraftTrip,
} from '@/domain/trip-drafts-state';
import { assembleTripFromDraft } from '@/services/trip-assembly';
import { mockPackingGenerator } from '@/services/packing/mock-packing-generator';
import { mockWeatherService } from '@/services/weather/mock-weather-service';

describe('trip draft identity', () => {
  it('assigns a stable id on create', () => {
    const stored = createStoredTripDraft();
    expect(stored.id).toBeTruthy();
    expect(stored.draft.id).toBe(stored.id);
  });

  it('preserves id through edit, save/resume metadata', () => {
    let state = emptyTripDraftsState();
    const stored = createStoredTripDraft();
    state = addStoredDraft(state, stored);

    state = updateStoredDraftTrip(state, stored.id, {
      destination: createDestinationFromText('Tokyo'),
    });
    state = updateStoredDraftMeta(state, stored.id, { wizardStep: 3, reachedSummary: true });
    state = resumeDraftInState(state, stored.id)!;

    const updated = getStoredDraftById(state, stored.id)!;
    expect(updated.draft.id).toBe(stored.id);
    expect(updated.id).toBe(stored.id);
    expect(updated.draft.destination.displayName).toBe('Tokyo');
    expect(updated.wizardStep).toBe(3);
    expect(updated.reachedSummary).toBe(true);
  });

  it('creates distinct ids for two new drafts', () => {
    const first = createStoredTripDraft();
    const second = createStoredTripDraft();
    expect(first.id).not.toBe(second.id);
  });
});

describe('multi-draft isolation', () => {
  it('keeps Draft B unchanged when Draft A is edited', () => {
    const draftA = createStoredTripDraft();
    const draftB = createStoredTripDraft({
      destination: createDestinationFromText('Paris'),
    });

    let state = addStoredDraft(emptyTripDraftsState(), draftA);
    state = addStoredDraft(state, draftB);

    state = updateStoredDraftTrip(state, draftA.id, {
      destination: createDestinationFromText('Tokyo'),
    });

    const unchangedB = getStoredDraftById(state, draftB.id)!;
    expect(getStoredDraftById(state, draftA.id)!.draft.destination.displayName).toBe('Tokyo');
    expect(unchangedB.draft.destination.displayName).toBe('Paris');
  });

  it('does not share nested array references between drafts', () => {
    const draftA = createStoredTripDraft();
    const draftB = createStoredTripDraft();

    let state = addStoredDraft(addStoredDraft(emptyTripDraftsState(), draftA), draftB);
    state = updateStoredDraftTrip(state, draftA.id, {
      tripContext: ['Beach'],
    });

    const a = getStoredDraftById(state, draftA.id)!;
    const b = getStoredDraftById(state, draftB.id)!;

    a.draft.tripContext.push('City');
    expect(b.draft.tripContext).toEqual([]);
  });
});

describe('save and close / preserve', () => {
  it('does not duplicate draft on repeated preservation updates', () => {
    const stored = createStoredTripDraft();
    let state = addStoredDraft(emptyTripDraftsState(), stored);

    state = updateStoredDraftTrip(state, stored.id, {
      destination: createDestinationFromText('Tokyo'),
    });
    state = updateStoredDraftTrip(state, stored.id, {
      note: 'First pass',
    });

    expect(state.drafts).toHaveLength(1);
    expect(state.drafts[0].id).toBe(stored.id);
  });
});

describe('resume by id', () => {
  it('restores values and wizard progress without mutating other drafts', () => {
    const draftA = createStoredTripDraft({
      destination: createDestinationFromText('Tokyo'),
    });
    const draftB = createStoredTripDraft({
      destination: createDestinationFromText('Paris'),
    });

    let state = addStoredDraft(addStoredDraft(emptyTripDraftsState(), draftA), draftB);
    state = updateStoredDraftMeta(state, draftA.id, { wizardStep: 4, reachedSummary: false });
    state = updateStoredDraftMeta(state, draftB.id, { wizardStep: 2 });

    state = resumeDraftInState(state, draftA.id)!;

    expect(state.activeDraftId).toBe(draftA.id);
    expect(getStoredDraftById(state, draftA.id)!.wizardStep).toBe(4);
    expect(getStoredDraftById(state, draftB.id)!.wizardStep).toBe(2);
  });
});

describe('delete draft', () => {
  it('removes only the target draft and clears active when deleted draft was active', () => {
    const draftA = createStoredTripDraft({ destination: createDestinationFromText('Tokyo') });
    const draftB = createStoredTripDraft({ destination: createDestinationFromText('Paris') });

    let state = addStoredDraft(addStoredDraft(emptyTripDraftsState(), draftA), draftB);
    state = resumeDraftInState(state, draftA.id)!;
    state = deleteDraftInState(state, draftA.id);

    expect(getStoredDraftById(state, draftA.id)).toBeNull();
    expect(getStoredDraftById(state, draftB.id)).not.toBeNull();
    expect(state.activeDraftId).toBeNull();
  });

  it('ignores unknown draft id safely', () => {
    const draftB = createStoredTripDraft({ destination: createDestinationFromText('Paris') });
    let state = addStoredDraft(emptyTripDraftsState(), draftB);

    state = deleteDraftInState(state, 'missing-draft-id');

    expect(state.drafts).toHaveLength(1);
    expect(state.drafts[0].id).toBe(draftB.id);
  });
});

describe('draft-only profile isolation', () => {
  it('keeps Jonas scoped to Draft A and absent from Draft B reads', () => {
    const jonas = createDraftProfile('Jonas', 8, false);
    const draftA = createStoredTripDraft({
      ...patchDraftPackingProfiles(createEmptyTripDraft(), [
        createEmptyTripDraft().packingProfiles[0],
        jonas,
      ]),
    });
    const draftB = createStoredTripDraft();

    const savedIds = new Set<string>(['profile-emilie']);
    expect(isDraftOnlyProfileId(jonas.id, savedIds)).toBe(true);

    let state = addStoredDraft(addStoredDraft(emptyTripDraftsState(), draftA), draftB);
    state = saveDraftImportantNames(state, draftA.id, jonas.id, ['Passport'], () => 'imp-passport');

    const aImportant = getStoredDraftById(state, draftA.id)!.draftImportantByProfileId;
    const bImportant = getStoredDraftById(state, draftB.id)!.draftImportantByProfileId;

    expect(aImportant[jonas.id]?.items.map((item) => item.name)).toEqual(['Passport']);
    expect(bImportant[jonas.id]).toBeUndefined();
  });
});

describe('draft-only Important isolation', () => {
  it('restores Jonas Important on resume and removes it with draft deletion', () => {
    const jonas = createDraftProfile('Jonas', 8, false);
    const stored = createStoredTripDraft({
      ...patchDraftPackingProfiles(createEmptyTripDraft(), [
        createEmptyTripDraft().packingProfiles[0],
        jonas,
      ]),
    });

    let state = addStoredDraft(emptyTripDraftsState(), stored);
    state = saveDraftImportantNames(state, stored.id, jonas.id, ['Medication'], () => 'imp-med');

    state = resumeDraftInState(state, stored.id)!;
    const resumed = getStoredDraftById(state, stored.id)!;
    expect(resumed.draftImportantByProfileId[jonas.id]?.items[0].name).toBe('Medication');

    state = deleteDraftInState(state, stored.id);
    expect(getStoredDraftById(state, stored.id)).toBeNull();
  });

  it('reads draft-only Important separately from global reusable profile store', () => {
    const jonas = createDraftProfile('Jonas', 8, false);
    const global = saveImportantItemNamesForProfile({}, 'profile-emilie', ['Teddy'], () => 'imp-teddy').store;
    const draftStore = saveImportantItemNamesForProfile({}, jonas.id, ['Passport'], () => 'imp-passport').store;

    const merged = mergeImportantStores(global, draftStore);
    const savedIds = new Set(['profile-emilie']);

    expect(
      readImportantConfigFromStores(global, draftStore, jonas.id, savedIds).items[0].name,
    ).toBe('Passport');
    expect(
      readImportantConfigFromStores(global, {}, 'profile-emilie', savedIds).items[0].name,
    ).toBe('Teddy');
    expect(getImportantConfigForProfile(merged, 'profile-emilie').items[0].name).toBe('Teddy');
  });
});

describe('commit one draft', () => {
  it('consumes only the committed draft and leaves the other intact', async () => {
    const draftA = createStoredTripDraft({
      destination: createDestinationFromText('Tokyo'),
      startDate: '2026-10-12',
      endDate: '2026-10-26',
      accommodation: 'hotel',
      laundry: 'yes',
    });
    const draftB = createStoredTripDraft({
      destination: createDestinationFromText('Paris'),
      startDate: '2026-11-03',
      endDate: '2026-11-07',
    });

    let state = addStoredDraft(addStoredDraft(emptyTripDraftsState(), draftA), draftB);

    await assembleTripFromDraft(
      getStoredDraftById(state, draftA.id)!.draft,
      {
        packingGenerator: mockPackingGenerator,
        weatherService: mockWeatherService,
      },
      { packingMode: 'generated' },
    );

    state = removeCommittedDraft(state, draftA.id);

    expect(getStoredDraftById(state, draftA.id)).toBeNull();
    expect(getStoredDraftById(state, draftB.id)!.draft.destination.displayName).toBe('Paris');
  });
});

describe('wizard progress ownership', () => {
  it('stores independent wizard positions per draft', () => {
    const draftA = createStoredTripDraft();
    const draftB = createStoredTripDraft();

    let state = addStoredDraft(addStoredDraft(emptyTripDraftsState(), draftA), draftB);
    state = updateStoredDraftMeta(state, draftA.id, { wizardStep: 5 });
    state = updateStoredDraftMeta(state, draftB.id, { wizardStep: 2 });

    expect(getStoredDraftById(state, draftA.id)!.wizardStep).toBe(5);
    expect(getStoredDraftById(state, draftB.id)!.wizardStep).toBe(2);
  });
});

describe('Home compatibility helper', () => {
  it('selects the most recently updated in-progress draft', () => {
    const older = createStoredTripDraft({ destination: createDestinationFromText('Tokyo') });
    const newer = createStoredTripDraft({ destination: createDestinationFromText('Paris') });
    older.updatedAt = '2026-01-01T00:00:00.000Z';
    newer.updatedAt = '2026-01-02T00:00:00.000Z';

    let state = addStoredDraft(addStoredDraft(emptyTripDraftsState(), older), newer);
    state = updateStoredDraftTrip(state, older.id, { note: 'touch older' });

    const primary = findPrimaryInProgressDraft(state);
    expect(primary?.id).toBe(older.id);
  });
});

describe('cloneTripDraft', () => {
  it('deep-clones mutable draft fields', () => {
    const source = createStoredTripDraft({
      destination: createDestinationFromText('Oslo'),
      tripContext: ['Ski'],
    }).draft;

    const cloned = cloneTripDraft(source);
    cloned.tripContext.push('City');
    cloned.destination.displayName = 'Bergen';

    expect(source.tripContext).toEqual(['Ski']);
    expect(source.destination.displayName).toBe('Oslo');
  });
});

describe('MP5B-A boundary: active draft mutation safety', () => {
  it('resolveActiveDraftIdForMutation returns null when activeDraftId is missing', () => {
    const state = emptyTripDraftsState();
    expect(resolveActiveDraftIdForMutation(state)).toBeNull();
  });

  it('resolveActiveDraftIdForMutation returns null when activeDraftId is stale', () => {
    const stored = createStoredTripDraft();
    const state = {
      drafts: [],
      activeDraftId: stored.id,
    };

    expect(resolveActiveDraftIdForMutation(state)).toBeNull();
  });

  it('does not mutate any draft when active id is stale', () => {
    const draftB = createStoredTripDraft({ destination: createDestinationFromText('Paris') });
    const state = {
      drafts: [draftB],
      activeDraftId: 'missing-active-id',
    };

    const next = updateStoredDraftTrip(state, 'missing-active-id', {
      destination: createDestinationFromText('Tokyo'),
    });

    expect(next).toBe(state);
    expect(getStoredDraftById(next, draftB.id)!.draft.destination.displayName).toBe('Paris');
  });
});

describe('MP5B-A boundary: primary draft determinism', () => {
  it('breaks updatedAt ties deterministically by draft id', () => {
    const sharedUpdatedAt = '2026-09-01T12:00:00.000Z';
    const draftA = createStoredTripDraft({ destination: createDestinationFromText('Tokyo') });
    const draftB = createStoredTripDraft({ destination: createDestinationFromText('Paris') });

    draftA.updatedAt = sharedUpdatedAt;
    draftB.updatedAt = sharedUpdatedAt;

    let state = addStoredDraft(addStoredDraft(emptyTripDraftsState(), draftA), draftB);
    const primary = findPrimaryInProgressDraft(state);

    expect(primary?.id).toBe([draftA.id, draftB.id].sort((left, right) => right.localeCompare(left))[0]);
  });

  it('does not change updatedAt on resume alone', () => {
    const stored = createStoredTripDraft({ destination: createDestinationFromText('Tokyo') });
    let state = addStoredDraft(emptyTripDraftsState(), stored);
    const before = getStoredDraftById(state, stored.id)!.updatedAt;

    state = resumeDraftInState(state, stored.id)!;

    expect(getStoredDraftById(state, stored.id)!.updatedAt).toBe(before);
  });
});

describe('MP5B-A boundary: envelope identity invariant', () => {
  it('keeps stored.id === stored.draft.id through updates', () => {
    const stored = createStoredTripDraft();
    let state = addStoredDraft(emptyTripDraftsState(), stored);

    state = updateStoredDraftTrip(state, stored.id, {
      destination: createDestinationFromText('Tokyo'),
      id: 'attempted-override',
    });

    const updated = getStoredDraftById(state, stored.id)!;
    expect(storedDraftIdentitiesMatch(updated)).toBe(true);
    expect(updated.draft.id).toBe(stored.id);
    expect(allStoredDraftIdentitiesMatch(state)).toBe(true);
  });
});

describe('MP5B-A boundary: draft-only Important profile id collision', () => {
  it('isolates Important by draft envelope when profile ids match', () => {
    const sharedProfileId = 'draft-profile-X';
    const jonasA = { ...createDraftProfile('Jonas', 8, false), id: sharedProfileId };
    const jonasB = { ...createDraftProfile('Jonas', 8, false), id: sharedProfileId };

    const draftA = createStoredTripDraft({
      ...patchDraftPackingProfiles(createEmptyTripDraft(), [
        createEmptyTripDraft().packingProfiles[0],
        jonasA,
      ]),
    });
    const draftB = createStoredTripDraft({
      ...patchDraftPackingProfiles(createEmptyTripDraft(), [
        createEmptyTripDraft().packingProfiles[0],
        jonasB,
      ]),
    });

    let state = addStoredDraft(addStoredDraft(emptyTripDraftsState(), draftA), draftB);
    state = saveDraftImportantNames(state, draftA.id, sharedProfileId, ['Medication'], () => 'imp-a');
    state = saveDraftImportantNames(state, draftB.id, sharedProfileId, ['Passport'], () => 'imp-b');

    expect(
      getStoredDraftById(state, draftA.id)!.draftImportantByProfileId[sharedProfileId]?.items[0].name,
    ).toBe('Medication');
    expect(
      getStoredDraftById(state, draftB.id)!.draftImportantByProfileId[sharedProfileId]?.items[0].name,
    ).toBe('Passport');

    state = deleteDraftInState(state, draftA.id);
    expect(
      getStoredDraftById(state, draftB.id)!.draftImportantByProfileId[sharedProfileId]?.items[0].name,
    ).toBe('Passport');
  });
});

describe('MP5B-A boundary: commit target safety', () => {
  it('commits active draft only and never falls back to primary/recent', () => {
    const draftA = createStoredTripDraft({ destination: createDestinationFromText('Tokyo') });
    const draftB = createStoredTripDraft({ destination: createDestinationFromText('Paris') });
    draftA.updatedAt = '2026-01-01T00:00:00.000Z';
    draftB.updatedAt = '2026-01-02T00:00:00.000Z';

    let state = addStoredDraft(addStoredDraft(emptyTripDraftsState(), draftA), draftB);
    state = resumeDraftInState(state, draftA.id)!;

    expect(findPrimaryInProgressDraft(state)?.id).toBe(draftB.id);
    expect(resolveCommitDraftTargetId(state)).toBe(draftA.id);
    expect(resolveCommitDraftTargetId(state, 'unknown-id')).toBeNull();
  });

  it('unknown explicit commit id does not consume any draft', () => {
    const draftA = createStoredTripDraft();
    const draftB = createStoredTripDraft();
    let state = addStoredDraft(addStoredDraft(emptyTripDraftsState(), draftA), draftB);

    expect(resolveCommitDraftTargetId(state, 'missing-id')).toBeNull();
    expect(state.drafts).toHaveLength(2);
  });
});
