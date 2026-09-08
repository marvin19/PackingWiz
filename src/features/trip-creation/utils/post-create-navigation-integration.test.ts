import type { Trip } from '@/domain/trip';
import { normalizeTrip, primaryPackingListId, type TripLike } from '@/domain/trip-compatibility';
import {
  resolvePostCreateNavigationAfterCommit,
  resolvePostCreatePackHref,
} from '@/domain/post-create-pack-navigation';
import { resolveTripPackEntry } from '@/domain/trip-pack-entry';
import { cloneTrip } from '@/lib/clone-trip';
import { mockLisbonTrip, mockMallorcaTrip } from '@/mocks/seed-trips';

/** Mirrors post-commit provider state before Pack/picker gains focus. */
export type PostCreateInFlightState = {
  draftConsumed: true;
  isCommitDraftInFlight: true;
  activeTripId: string;
  activePackingListId: string | null;
  href: '/(tabs)/pack' | '/(tabs)/pack/select-list';
};

/** Mirrors useAcknowledgePostCreateNavigation focus callback. */
export function runAcknowledgePostCreateOnFocus(input: {
  isCommitDraftInFlight: boolean;
  acknowledge: () => void;
}): boolean {
  if (!input.isCommitDraftInFlight) {
    return false;
  }

  input.acknowledge();
  return true;
}

export function resolvePostCreateSuccessState(trip: Trip): PostCreateInFlightState {
  const entry = resolveTripPackEntry(trip.id, null, null, [trip]);

  return {
    draftConsumed: true,
    isCommitDraftInFlight: true,
    activeTripId: trip.id,
    activePackingListId: entry.activePackingListId,
    href: resolvePostCreatePackHref(trip),
  };
}

describe('post-create navigation orchestration', () => {
  it('documents the success sequence before destination focus', () => {
    const trip = cloneTrip(mockMallorcaTrip);
    const state = resolvePostCreateSuccessState(trip);
    const acknowledge = jest.fn();

    expect(state.isCommitDraftInFlight).toBe(true);
    expect(state.href).toBe('/(tabs)/pack');
    expect(runAcknowledgePostCreateOnFocus({
      isCommitDraftInFlight: state.isCommitDraftInFlight,
      acknowledge,
    })).toBe(true);
    expect(acknowledge).toHaveBeenCalledTimes(1);
  });

  it('defers acknowledge until destination focus and then clears in-flight', () => {
    let inFlight = true;
    const acknowledge = jest.fn(() => {
      inFlight = false;
    });

    expect(inFlight).toBe(true);
    expect(
      runAcknowledgePostCreateOnFocus({ isCommitDraftInFlight: inFlight, acknowledge }),
    ).toBe(true);
    expect(acknowledge).toHaveBeenCalledTimes(1);
    expect(inFlight).toBe(false);

    acknowledge.mockClear();
    expect(
      runAcknowledgePostCreateOnFocus({ isCommitDraftInFlight: inFlight, acknowledge }),
    ).toBe(false);
    expect(acknowledge).not.toHaveBeenCalled();
  });

  it('routes one-list create to Pack with sole list auto-resolved', () => {
    const trip = cloneTrip(mockMallorcaTrip);
    const state = resolvePostCreateSuccessState(trip);

    expect(state.href).toBe('/(tabs)/pack');
    expect(state.activePackingListId).toBe(trip.packingLists[0]?.id);
    expect(state.isCommitDraftInFlight).toBe(true);
  });

  it('routes multi-list create to picker with no active list fallback', () => {
    const trip = cloneTrip(mockLisbonTrip);
    expect(trip.packingLists.length).toBeGreaterThan(1);

    const state = resolvePostCreateSuccessState(trip);

    expect(state.href).toBe('/(tabs)/pack/select-list');
    expect(state.activePackingListId).toBeNull();
    expect(state.activePackingListId).not.toBe(trip.packingLists[0]?.id);
  });

  it('does not use compatibility-primary list[0] for multi-list post-create entry', () => {
    const legacy: TripLike = {
      ...cloneTrip(mockLisbonTrip),
      packingLists: [
        {
          id: primaryPackingListId('trip-multi'),
          packingProfileId: 'profile-a',
          profileSnapshot: { id: 'profile-a', name: 'A', isSelf: true },
          packingMode: 'generated',
          items: [],
        },
        {
          id: 'trip-multi-list-b',
          packingProfileId: 'profile-b',
          profileSnapshot: { id: 'profile-b', name: 'B', isSelf: false, age: 8 },
          packingMode: 'manual',
          items: [],
        },
      ],
    };
    const trip = normalizeTrip(legacy);
    const state = resolvePostCreateSuccessState(trip);

    expect(state.href).toBe('/(tabs)/pack/select-list');
    expect(state.activePackingListId).toBeNull();
  });

  it('returns no navigation target and no acknowledge on commit failure', () => {
    expect(resolvePostCreateNavigationAfterCommit({ ok: false })).toBeNull();

    const acknowledge = jest.fn();
    expect(
      runAcknowledgePostCreateOnFocus({ isCommitDraftInFlight: false, acknowledge }),
    ).toBe(false);
    expect(acknowledge).not.toHaveBeenCalled();
  });

  it('treats repeated destination focus as harmless after in-flight clears', () => {
    let inFlight = true;
    const acknowledge = jest.fn(() => {
      inFlight = false;
    });

    runAcknowledgePostCreateOnFocus({ isCommitDraftInFlight: inFlight, acknowledge });
    runAcknowledgePostCreateOnFocus({ isCommitDraftInFlight: inFlight, acknowledge });
    runAcknowledgePostCreateOnFocus({ isCommitDraftInFlight: inFlight, acknowledge });

    expect(acknowledge).toHaveBeenCalledTimes(1);
  });
});
