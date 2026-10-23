import type { Destination } from '@/domain/destination';
import { getDestinationLabel } from '@/domain/destination';
import type { TripDraft } from '@/domain/trip-draft';
import { suggestDefaultTripNameFromDestination } from '@/domain/trip-name';

export function defaultTripDraftNameFromDestination(destination: Destination): string {
  return suggestDefaultTripNameFromDestination(destination);
}

/** Resolved display/commit name for an in-progress creation draft. */
export function resolveTripDraftName(draft: Pick<TripDraft, 'name' | 'destination'>): string {
  const trimmed = draft.name?.trim();
  if (trimmed) {
    return trimmed;
  }

  return defaultTripDraftNameFromDestination(draft.destination);
}

/** Name persisted on commit — blank draft names fall back to destination label. */
export function resolveCommittedTripNameFromDraft(
  draft: Pick<TripDraft, 'name' | 'destination'>,
): string {
  return resolveTripDraftName(draft);
}

export function createUserEditedTripDraftNamePatch(name: string): Pick<TripDraft, 'name' | 'isTripNameUserEdited'> {
  return {
    name,
    isTripNameUserEdited: true,
  };
}

/** Maps trip-name field input to draft patches (cleared field reverts to destination-owned naming). */
export function createTripDraftNameInputPatch(name: string): Pick<TripDraft, 'name' | 'isTripNameUserEdited'> {
  if (name === '') {
    return {
      name: '',
      isTripNameUserEdited: false,
    };
  }

  return createUserEditedTripDraftNamePatch(name);
}

function destinationDisplayChanged(before: Destination, after: Destination): boolean {
  return getDestinationLabel(before) !== getDestinationLabel(after);
}

/**
 * Apply a TripDraft patch while keeping creation-time trip name rules:
 * - default name follows destination until the user explicitly edits the name
 * - unrelated draft edits never overwrite a user-owned name
 */
export function applyTripDraftPatch(draft: TripDraft, patch: Partial<TripDraft>): TripDraft {
  const isTripNameUserEdited =
    patch.isTripNameUserEdited !== undefined
      ? patch.isTripNameUserEdited
      : (draft.isTripNameUserEdited ?? false);

  let name = patch.name !== undefined ? patch.name : (draft.name ?? '');
  let nextUserEdited = isTripNameUserEdited;

  if (patch.name !== undefined) {
    nextUserEdited = patch.isTripNameUserEdited ?? true;
    name = patch.name;
  }

  const destination = patch.destination ? { ...patch.destination } : { ...draft.destination };

  if (
    patch.destination !== undefined &&
    destinationDisplayChanged(draft.destination, destination) &&
    !nextUserEdited
  ) {
    name = defaultTripDraftNameFromDestination(destination);
  }

  if (!name.trim() && !nextUserEdited) {
    name = defaultTripDraftNameFromDestination(destination);
  }

  return {
    ...draft,
    ...patch,
    id: draft.id,
    destination,
    name,
    isTripNameUserEdited: nextUserEdited,
  };
}
