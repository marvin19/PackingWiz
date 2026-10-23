import { formatPackingListProfileName } from '@/domain/packing-list-labels';
import { snapshotPackingProfile } from '@/domain/packing-profile';
import {
  createCanonicalSelfPackingProfile,
  formatSelfPackingProfileIdentityHint,
  selfPackingProfileInitials,
} from '@/domain/self-packing-profile';
import {
  resolveImportantProfileId,
  SELF_IMPORTANT_PROFILE_ID,
} from '@/domain/profile-important-items';
import { cloneTrip } from '@/lib/clone-trip';
import { mockLisbonTrip } from '@/mocks/seed-trips';
import { normalizeTrip, type TripLike } from '@/domain/trip-compatibility';

describe('canonical self PackingProfile', () => {
  it('uses stable profile-self id aligned with Important master', () => {
    const self = createCanonicalSelfPackingProfile();

    expect(self.id).toBe(SELF_IMPORTANT_PROFILE_ID);
    expect(self.isSelf).toBe(true);
    expect(resolveImportantProfileId(self)).toBe(SELF_IMPORTANT_PROFILE_ID);
  });

  it('presents neutral Me identity without fake account metadata', () => {
    const self = createCanonicalSelfPackingProfile();

    expect(formatPackingListProfileName(self)).toBe('Me');
    expect(selfPackingProfileInitials(self)).toBe('M');
    expect(formatSelfPackingProfileIdentityHint(self)).toBe('Your packing profile');
  });

  it('does not mutate historical trip profile snapshots', () => {
    const trip = normalizeTrip({
      ...cloneTrip(mockLisbonTrip),
      id: 'trip-self-snapshot',
      packingLists: [
        {
          id: 'trip-self-snapshot-list-me',
          packingProfileId: 'trip-self-snapshot-profile-self',
          profileSnapshot: {
            id: 'trip-self-snapshot-profile-self',
            name: 'Me',
            isSelf: true,
          },
          packingMode: 'generated',
          items: [],
        },
      ],
    } as TripLike);

    const before = snapshotPackingProfile(trip.packingLists[0]!.profileSnapshot);
    const mutatedSelf = { ...createCanonicalSelfPackingProfile(), name: 'Changed' };

    expect(trip.packingLists[0]!.profileSnapshot).toEqual(before);
    expect(trip.packingLists[0]!.profileSnapshot.id).not.toBe(mutatedSelf.id);
  });
});
