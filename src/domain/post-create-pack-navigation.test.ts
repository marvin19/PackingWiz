import { normalizeTrip, primaryPackingListId, type TripLike } from '@/domain/trip-compatibility';
import { mockLisbonTrip, mockMallorcaTrip } from '@/mocks/seed-trips';
import { cloneTrip } from '@/lib/clone-trip';

import {
  resolvePostCreateNavigationAfterCommit,
  resolvePostCreatePackHref,
} from '@/domain/post-create-pack-navigation';

describe('post-create Pack navigation', () => {
  it('routes one-list manual trip to Pack', () => {
    const trip = cloneTrip(mockMallorcaTrip);
    expect(trip.packingLists).toHaveLength(1);
    expect(resolvePostCreatePackHref(trip)).toBe('/(tabs)/pack');
  });

  it('routes one-list generated trip to Pack', () => {
    const trip = cloneTrip(mockMallorcaTrip);
    expect(resolvePostCreatePackHref(trip)).toBe('/(tabs)/pack');
  });

  it('routes multi-list trip to canonical list selector', () => {
    const trip = cloneTrip(mockLisbonTrip);
    expect(trip.packingLists.length).toBeGreaterThan(1);
    expect(resolvePostCreatePackHref(trip)).toBe('/(tabs)/pack/select-list');
  });

  it('returns null when repository commit fails — no Pack navigation', () => {
    expect(resolvePostCreateNavigationAfterCommit({ ok: false })).toBeNull();
  });

  it('returns Pack href on successful commit regardless of persistence mode label', () => {
    const trip = cloneTrip(mockMallorcaTrip);
    expect(
      resolvePostCreateNavigationAfterCommit({ ok: true, trip }),
    ).toBe('/(tabs)/pack');
  });

  it('does not silently pick list[0] for multi-list trips', () => {
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
    expect(resolvePostCreatePackHref(trip)).toBe('/(tabs)/pack/select-list');
  });
});
