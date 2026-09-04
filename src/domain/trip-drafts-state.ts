import type { ImportantItemsByProfileId } from '@/domain/profile-important-items';
import {
  saveImportantItemNamesForProfile,
  setImportantEnabledForProfileStore,
  setImportantPromptDismissedForProfileStore,
} from '@/domain/profile-important-items';
import type { TripDraft } from '@/domain/trip-draft';
import { createEmptyTripDraft } from '@/domain/trip-draft';
import { isDraftInProgress } from '@/features/trip-creation/utils/draft-progress';
import { createUuid } from '@/lib/id';

export function createTripDraftId(): string {
  return createUuid();
}

/** Session-stored unfinished trip with wizard resume metadata. */
export interface StoredTripDraft {
  id: string;
  draft: TripDraft;
  wizardStep: number;
  reachedSummary: boolean;
  /** Important master entries for draft-only packing profile ids. */
  draftImportantByProfileId: ImportantItemsByProfileId;
  updatedAt: string;
}

export interface TripDraftsState {
  drafts: StoredTripDraft[];
  activeDraftId: string | null;
}

export const emptyTripDraftsState = (): TripDraftsState => ({
  drafts: [],
  activeDraftId: null,
});

export function cloneTripDraft(draft: TripDraft): TripDraft {
  return {
    ...draft,
    destination: { ...draft.destination },
    tripContext: [...draft.tripContext],
    packingProfiles: draft.packingProfiles.map((profile) => ({ ...profile })),
    travelers: draft.travelers.map((traveler) => ({ ...traveler })),
    bags: draft.bags.map((bag) => ({ ...bag })),
  };
}

export function createStoredTripDraft(overrides?: Partial<TripDraft>): StoredTripDraft {
  const id = createTripDraftId();
  const draft = cloneTripDraft({
    ...createEmptyTripDraft(id),
    ...overrides,
    id,
  });

  const stored: StoredTripDraft = {
    id,
    draft,
    wizardStep: 0,
    reachedSummary: false,
    draftImportantByProfileId: {},
    updatedAt: new Date().toISOString(),
  };
  assertStoredDraftIdentitiesMatch(stored);
  return stored;
}

export function getStoredDraftById(
  state: TripDraftsState,
  draftId: string,
): StoredTripDraft | null {
  return state.drafts.find((entry) => entry.id === draftId) ?? null;
}

export function assertStoredDraftExists(state: TripDraftsState, draftId: string): StoredTripDraft {
  const stored = getStoredDraftById(state, draftId);
  if (!stored) {
    throw new Error(`Trip draft not found: ${draftId}`);
  }

  return stored;
}

export function listInProgressDrafts(state: TripDraftsState): StoredTripDraft[] {
  return state.drafts.filter((entry) => isDraftInProgress(entry.draft));
}

/** Deterministic ordering for Home draft lists — most recently touched first. */
export function compareStoredDraftsByRecentTouch(
  left: StoredTripDraft,
  right: StoredTripDraft,
): number {
  const byUpdatedAt = right.updatedAt.localeCompare(left.updatedAt);
  if (byUpdatedAt !== 0) {
    return byUpdatedAt;
  }

  return right.id.localeCompare(left.id);
}

export function listInProgressDraftsOrdered(state: TripDraftsState): StoredTripDraft[] {
  return [...listInProgressDrafts(state)].sort(compareStoredDraftsByRecentTouch);
}

/** Most recently touched in-progress draft for temporary single-CTA Home compatibility. */
export function findPrimaryInProgressDraft(state: TripDraftsState): StoredTripDraft | null {
  return listInProgressDraftsOrdered(state)[0] ?? null;
}

/** Envelope id and nested TripDraft.id must remain identical. */
export function storedDraftIdentitiesMatch(stored: StoredTripDraft): boolean {
  return stored.id === stored.draft.id;
}

export function assertStoredDraftIdentitiesMatch(stored: StoredTripDraft): void {
  if (!storedDraftIdentitiesMatch(stored)) {
    throw new Error('StoredTripDraft.id must equal StoredTripDraft.draft.id');
  }
}

/** Active draft id for mutations — null when missing or stale. Never falls back to another draft. */
export function resolveActiveDraftIdForMutation(state: TripDraftsState): string | null {
  if (!state.activeDraftId) {
    return null;
  }

  const stored = getStoredDraftById(state, state.activeDraftId);
  if (!stored) {
    return null;
  }

  return stored.id;
}

/** Commit target — explicit id or active id only; never primary/recent/first draft. */
export function resolveCommitDraftTargetId(
  state: TripDraftsState,
  explicitDraftId?: string,
): string | null {
  const targetDraftId = explicitDraftId ?? state.activeDraftId;
  if (!targetDraftId) {
    return null;
  }

  return getStoredDraftById(state, targetDraftId) ? targetDraftId : null;
}

export function getActiveStoredDraft(state: TripDraftsState): StoredTripDraft | null {
  if (!state.activeDraftId) {
    return null;
  }

  return getStoredDraftById(state, state.activeDraftId);
}

export function addStoredDraft(
  state: TripDraftsState,
  stored: StoredTripDraft,
): TripDraftsState {
  if (state.drafts.some((entry) => entry.id === stored.id)) {
    throw new Error(`Duplicate trip draft id: ${stored.id}`);
  }

  return {
    drafts: [...state.drafts, stored],
    activeDraftId: stored.id,
  };
}

export function createNewDraftInState(state: TripDraftsState): TripDraftsState {
  return addStoredDraft(state, createStoredTripDraft());
}

export function resumeDraftInState(state: TripDraftsState, draftId: string): TripDraftsState | null {
  const stored = getStoredDraftById(state, draftId);
  if (!stored) {
    return null;
  }

  return {
    ...state,
    activeDraftId: draftId,
  };
}

export function deleteDraftInState(state: TripDraftsState, draftId: string): TripDraftsState {
  const stored = getStoredDraftById(state, draftId);
  if (!stored) {
    return state;
  }

  const drafts = state.drafts.filter((entry) => entry.id !== draftId);
  const activeDraftId = state.activeDraftId === draftId ? null : state.activeDraftId;

  return {
    drafts,
    activeDraftId,
  };
}

function touchStoredDraft(stored: StoredTripDraft, patch: Partial<StoredTripDraft>): StoredTripDraft {
  return {
    ...stored,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}

export function updateStoredDraftTrip(
  state: TripDraftsState,
  draftId: string,
  patch: Partial<TripDraft>,
): TripDraftsState {
  const stored = getStoredDraftById(state, draftId);
  if (!stored) {
    return state;
  }

  const nextDraft = cloneTripDraft({
    ...stored.draft,
    ...patch,
    id: stored.id,
  });

  const nextStored = touchStoredDraft(stored, { draft: nextDraft });
  assertStoredDraftIdentitiesMatch(nextStored);

  return {
    ...state,
    drafts: state.drafts.map((entry) => (entry.id === draftId ? nextStored : entry)),
  };
}

export function updateStoredDraftMeta(
  state: TripDraftsState,
  draftId: string,
  patch: Partial<
    Pick<StoredTripDraft, 'wizardStep' | 'reachedSummary' | 'draftImportantByProfileId'>
  >,
): TripDraftsState {
  const stored = getStoredDraftById(state, draftId);
  if (!stored) {
    return state;
  }

  const nextImportant = patch.draftImportantByProfileId
    ? { ...patch.draftImportantByProfileId }
    : stored.draftImportantByProfileId;

  const nextStored = touchStoredDraft(stored, {
    ...patch,
    draftImportantByProfileId: nextImportant,
  });
  assertStoredDraftIdentitiesMatch(nextStored);

  return {
    ...state,
    drafts: state.drafts.map((entry) => (entry.id === draftId ? nextStored : entry)),
  };
}

export function saveDraftImportantNames(
  state: TripDraftsState,
  draftId: string,
  profileId: string,
  names: string[],
  createId: () => string,
): TripDraftsState {
  const stored = getStoredDraftById(state, draftId);
  if (!stored) {
    return state;
  }

  const result = saveImportantItemNamesForProfile(
    stored.draftImportantByProfileId,
    profileId,
    names,
    createId,
  );

  return updateStoredDraftMeta(state, draftId, {
    draftImportantByProfileId: result.store,
  });
}

export function setDraftImportantEnabled(
  state: TripDraftsState,
  draftId: string,
  profileId: string,
  enabled: boolean,
): TripDraftsState {
  const stored = getStoredDraftById(state, draftId);
  if (!stored) {
    return state;
  }

  const nextStore = setImportantEnabledForProfileStore(
    stored.draftImportantByProfileId,
    profileId,
    enabled,
  );

  return updateStoredDraftMeta(state, draftId, {
    draftImportantByProfileId: nextStore,
  });
}

export function dismissDraftImportantPrompt(
  state: TripDraftsState,
  draftId: string,
  profileId: string,
): TripDraftsState {
  const stored = getStoredDraftById(state, draftId);
  if (!stored) {
    return state;
  }

  const nextStore = setImportantPromptDismissedForProfileStore(
    stored.draftImportantByProfileId,
    profileId,
    true,
  );

  return updateStoredDraftMeta(state, draftId, {
    draftImportantByProfileId: nextStore,
  });
}

export function removeCommittedDraft(state: TripDraftsState, draftId: string): TripDraftsState {
  return deleteDraftInState(state, draftId);
}

export function hasUniqueDraftIds(state: TripDraftsState): boolean {
  const ids = state.drafts.map((entry) => entry.id);
  return new Set(ids).size === ids.length;
}

export function allStoredDraftIdentitiesMatch(state: TripDraftsState): boolean {
  return state.drafts.every(storedDraftIdentitiesMatch);
}
