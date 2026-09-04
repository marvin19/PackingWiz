import { createDestinationFromText } from '@/domain/destination';
import {
  collectDraftOnlyProfileIds,
  isDraftOnlyProfileId,
} from '@/domain/draft-important-scope';
import {
  saveImportantItemNamesForProfile,
} from '@/domain/profile-important-items';
import { createEmptyTripDraft } from '@/domain/trip-draft';
import { createDraftProfile, patchDraftPackingProfiles } from '@/domain/trip-draft-profiles';
import {
  addStoredDraft,
  allStoredDraftIdentitiesMatch,
  createStoredTripDraft,
  deleteDraftInState,
  emptyTripDraftsState,
  getStoredDraftById,
  hasUniqueDraftIds,
  removeCommittedDraft,
  resolveCommitDraftTargetId,
  saveDraftImportantNames,
  storedDraftIdentitiesMatch,
} from '@/domain/trip-drafts-state';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function verifyUniqueDraftIds(): void {
  let state = emptyTripDraftsState();
  state = addStoredDraft(state, createStoredTripDraft());
  state = addStoredDraft(state, createStoredTripDraft());

  assert(hasUniqueDraftIds(state), 'stored drafts maintain unique ids');
}

function verifyCommitConsumesOnlyTargetDraft(): void {
  const draftA = createStoredTripDraft({ destination: createDestinationFromText('Tokyo') });
  const draftB = createStoredTripDraft({ destination: createDestinationFromText('Paris') });

  let state = addStoredDraft(addStoredDraft(emptyTripDraftsState(), draftA), draftB);
  state = removeCommittedDraft(state, draftA.id);

  assert(getStoredDraftById(state, draftA.id) === null, 'committed draft is removed');
  assert(getStoredDraftById(state, draftB.id) !== null, ' sibling draft remains');
}

function verifyDraftOnlyProfileImportantIsolation(): void {
  const jonas = createDraftProfile('Jonas', 8, false);
  const draftA = createStoredTripDraft({
    ...patchDraftPackingProfiles(createEmptyTripDraft(), [
      createEmptyTripDraft().packingProfiles[0],
      jonas,
    ]),
  });
  const draftB = createStoredTripDraft();

  let state = addStoredDraft(addStoredDraft(emptyTripDraftsState(), draftA), draftB);
  state = saveDraftImportantNames(state, draftA.id, jonas.id, ['Passport'], () => 'imp-passport');

  const savedIds = new Set<string>();
  assert(isDraftOnlyProfileId(jonas.id, savedIds), 'Jonas is draft-only before remember');
  assert(
    getStoredDraftById(state, draftB.id)!.draftImportantByProfileId[jonas.id] === undefined,
    'Draft B does not inherit Jonas Important envelope',
  );

  state = deleteDraftInState(state, draftA.id);
  assert(getStoredDraftById(state, draftA.id) === null, 'deleting Draft A removes Jonas draft envelope');

  const global = saveImportantItemNamesForProfile({}, 'profile-emilie', ['Teddy'], () => 'imp-teddy').store;
  const draftOnlyIds = collectDraftOnlyProfileIds(
    getStoredDraftById(state, draftB.id)!.draft.packingProfiles,
    savedIds,
  );
  assert(draftOnlyIds.length === 0, 'Draft B has no Jonas profile ids');
  assert(
    getImportantConfigNames(global, 'profile-emilie').length === 1,
    'reusable profile Important masters remain intact after draft deletion',
  );
}

function getImportantConfigNames(
  store: ReturnType<typeof saveImportantItemNamesForProfile>['store'],
  profileId: string,
): string[] {
  return store[profileId]?.items.map((item) => item.name) ?? [];
}

function verifyStoredDraftIdentityInvariant(): void {
  const stored = createStoredTripDraft();
  assert(storedDraftIdentitiesMatch(stored), 'new stored draft keeps envelope and draft ids aligned');

  let state = addStoredDraft(emptyTripDraftsState(), stored);
  assert(allStoredDraftIdentitiesMatch(state), 'collection maintains identity invariant after add');
}

function verifyCommitTargetUsesActiveNotPrimary(): void {
  const draftA = createStoredTripDraft({ destination: createDestinationFromText('Tokyo') });
  const draftB = createStoredTripDraft({ destination: createDestinationFromText('Paris') });

  let state = addStoredDraft(addStoredDraft(emptyTripDraftsState(), draftA), draftB);
  state = {
    ...state,
    activeDraftId: draftA.id,
    drafts: state.drafts.map((entry) =>
      entry.id === draftB.id ? { ...entry, updatedAt: '2099-01-01T00:00:00.000Z' } : entry,
    ),
  };

  assert(resolveCommitDraftTargetId(state) === draftA.id, 'commit without id targets active draft only');
  assert(resolveCommitDraftTargetId(state, 'missing') === null, 'unknown explicit commit id is rejected');
}

export async function runMp5bInvariantChecks(): Promise<void> {
  verifyUniqueDraftIds();
  verifyStoredDraftIdentityInvariant();
  verifyCommitTargetUsesActiveNotPrimary();
  verifyCommitConsumesOnlyTargetDraft();
  verifyDraftOnlyProfileImportantIsolation();
}
