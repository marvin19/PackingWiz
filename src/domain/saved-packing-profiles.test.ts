import { snapshotPackingProfile } from '@/domain/packing-profile';
import { listReusableSavedPackingProfiles } from '@/domain/saved-packing-profiles';
import { SELF_IMPORTANT_PROFILE_ID } from '@/domain/profile-important-items';
import { cloneTrip } from '@/lib/clone-trip';
import { mockLisbonTrip } from '@/mocks/seed-trips';
import { normalizeTrip, type TripLike } from '@/domain/trip-compatibility';

describe('listReusableSavedPackingProfiles', () => {
  it('returns stable non-self profiles from savedPackingProfiles', () => {
    const profiles = listReusableSavedPackingProfiles([
      { id: 'profile-emilie', name: 'Emilie', age: 8, isSelf: false },
      { id: 'profile-jonas', name: 'Jonas', age: 10, isSelf: false },
    ]);

    expect(profiles.map((profile) => profile.id)).toEqual(['profile-emilie', 'profile-jonas']);
  });

  it('excludes self and canonical profile-self id', () => {
    const profiles = listReusableSavedPackingProfiles([
      { id: SELF_IMPORTANT_PROFILE_ID, name: 'Me', isSelf: true },
      { id: 'profile-self-trip', name: 'Me', isSelf: true },
      { id: 'profile-emilie', name: 'Emilie', isSelf: false },
    ]);

    expect(profiles).toEqual([{ id: 'profile-emilie', name: 'Emilie', isSelf: false }]);
  });

  it('excludes draft-profile ids', () => {
    const profiles = listReusableSavedPackingProfiles([
      { id: 'draft-profile-emilie', name: 'Emilie', age: 8, isSelf: false },
      { id: 'profile-emilie', name: 'Emilie', age: 8, isSelf: false },
    ]);

    expect(profiles.map((profile) => profile.id)).toEqual(['profile-emilie']);
  });

  it('keeps distinct stable profiles when names match', () => {
    const profiles = listReusableSavedPackingProfiles([
      { id: 'profile-emilie-a', name: 'Emilie', age: 8, isSelf: false },
      { id: 'profile-emilie-b', name: 'Emilie', age: 9, isSelf: false },
    ]);

    expect(profiles).toHaveLength(2);
    expect(profiles.map((profile) => profile.id)).toEqual(['profile-emilie-a', 'profile-emilie-b']);
  });

  it('returns empty list when no reusable profiles exist', () => {
    expect(listReusableSavedPackingProfiles([])).toEqual([]);
    expect(
      listReusableSavedPackingProfiles([
        { id: 'draft-profile-temp', name: 'Temp', isSelf: false },
      ]),
    ).toEqual([]);
  });

  it('does not derive from or mutate trip profile snapshots', () => {
    const trip = normalizeTrip({
      ...cloneTrip(mockLisbonTrip),
      id: 'trip-snapshot-readonly',
      packingLists: [
        {
          id: 'trip-snapshot-readonly-list-emilie',
          packingProfileId: 'profile-emilie',
          profileSnapshot: {
            id: 'profile-emilie',
            name: 'Emilie',
            age: 8,
            isSelf: false,
          },
          packingMode: 'generated',
          items: [],
        },
      ],
    } as TripLike);

    const before = snapshotPackingProfile(trip.packingLists[0]!.profileSnapshot);
    const savedProfiles = [{ id: 'profile-jonas', name: 'Jonas', age: 10, isSelf: false }];

    const listed = listReusableSavedPackingProfiles(savedProfiles);

    expect(listed.map((profile) => profile.id)).toEqual(['profile-jonas']);
    expect(trip.packingLists[0]!.profileSnapshot).toEqual(before);
    expect(listed.some((profile) => profile.id === trip.packingLists[0]!.profileSnapshot.id)).toBe(
      false,
    );
  });
});
