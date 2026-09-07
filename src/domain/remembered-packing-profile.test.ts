import type { ImportantItemsConfig } from '@/domain/important-items-config';
import {
  cloneImportantItemsConfig,
  defaultImportantItemsConfig,
} from '@/domain/important-items-config';
import type { PackingProfile } from '@/domain/packing-profile';
import {
  createPersistablePackingProfileId,
  mergeSavedPackingProfiles,
  resolveImportantConfigForPersistedProfile,
  resolveRememberedPackingProfileForPersistence,
  shouldPersistRememberedTripProfile,
} from '@/domain/remembered-packing-profile';
import { availableSavedProfilesForTrip } from '@/features/trip-edit/utils/edit-trip-view-model';
import { MockPackingProfileRepository } from '@/repositories/profiles/mock-packing-profile-repository';
import { persistCommittedTripProfiles } from '@/services/persist-committed-trip-profiles';
import { removeTravellerFromTrip } from '@/services/trip-edit-orchestration';
import type { Trip } from '@/domain/trip';
import { normalizeTrip, primaryPackingListId, type TripLike } from '@/domain/trip-compatibility';
import { createDestinationFromText } from '@/domain/destination';

function createTripWithEmilie(): Trip {
  const tripId = 'trip-profile-persist';
  const input: TripLike = {
    id: tripId,
    name: 'Family trip',
    title: 'Family trip',
    destination: createDestinationFromText('Oslo', 'Norway'),
    startDate: '2026-07-01',
    endDate: '2026-07-10',
    tripContext: ['City'],
    accommodation: 'hotel',
    laundry: 'yes',
    note: '',
    travelers: [{ id: 't-you', name: 'You', role: 'Adult' }],
    bags: [],
    weather: { mode: 'climate', summary: 'Mild', detail: '', high: 20, low: 10 },
    packingLists: [
      {
        id: primaryPackingListId(tripId),
        packingProfileId: `${tripId}-profile-self`,
        profileSnapshot: { id: `${tripId}-profile-self`, name: 'Me', isSelf: true },
        packingMode: 'generated',
        items: [],
      },
      {
        id: `${tripId}-list-emilie`,
        packingProfileId: 'profile-emilie',
        profileSnapshot: { id: 'profile-emilie', name: 'Emilie', age: 8, isSelf: false },
        packingMode: 'generated',
        items: [],
      },
    ],
    items: [],
    insights: [],
    packingMode: 'generated',
    generated: true,
    status: 'upcoming',
  };

  return normalizeTrip(input);
}

describe('remembered-packing-profile', () => {
  it('assigns a persistable id for draft profiles', () => {
    const draft: PackingProfile = {
      id: 'draft-profile-abc',
      name: 'Emilie',
      age: 8,
      isSelf: false,
      rememberForFutureTrips: true,
    };

    const resolved = resolveRememberedPackingProfileForPersistence(draft, []);

    expect(resolved.id).toMatch(/^profile-/);
    expect(resolved.id).not.toContain('draft-profile');
    expect(resolved.name).toBe('Emilie');
  });

  it('merges draft profile to existing saved profile by name', () => {
    const draft: PackingProfile = {
      id: 'draft-profile-abc',
      name: 'Emilie',
      age: 8,
      isSelf: false,
      rememberForFutureTrips: true,
    };
    const saved: PackingProfile[] = [
      { id: 'profile-emilie', name: 'Emilie', age: 8, isSelf: false },
    ];

    const resolved = resolveRememberedPackingProfileForPersistence(draft, saved);

    expect(resolved.id).toBe('profile-emilie');
  });

  it('keeps distinct ids for same-name different-id profiles', () => {
    const saved: PackingProfile[] = [
      { id: 'profile-emilie-a', name: 'Emilie', age: 8, isSelf: false },
    ];
    const other: PackingProfile = {
      id: 'profile-emilie-b',
      name: 'Emilie',
      age: 9,
      isSelf: false,
    };

    const resolved = resolveRememberedPackingProfileForPersistence(other, saved);

    expect(resolved.id).toBe('profile-emilie-b');
  });

  it('should persist remembered or already persistable trip profiles', () => {
    expect(
      shouldPersistRememberedTripProfile({
        id: 'draft-profile-x',
        name: 'New',
        isSelf: false,
        rememberForFutureTrips: true,
      }),
    ).toBe(true);

    expect(
      shouldPersistRememberedTripProfile({
        id: 'profile-emilie',
        name: 'Emilie',
        isSelf: false,
      }),
    ).toBe(true);

    expect(
      shouldPersistRememberedTripProfile({
        id: 'draft-profile-x',
        name: 'Guest',
        isSelf: false,
      }),
    ).toBe(false);
  });

  it('merges local and remote saved profiles without dropping local-only entries', () => {
    const local: PackingProfile[] = [
      { id: 'profile-local', name: 'Local', isSelf: false },
    ];
    const remote: PackingProfile[] = [
      { id: 'profile-emilie', name: 'Emilie', isSelf: false },
    ];

    const merged = mergeSavedPackingProfiles(local, remote);

    expect(merged).toHaveLength(2);
    expect(merged.map((profile) => profile.id).sort()).toEqual([
      'profile-emilie',
      'profile-local',
    ]);
  });

  it('migrates important config when draft id resolves to stable id', () => {
    const store = {
      'draft-profile-abc': cloneImportantItemsConfig({
        ...defaultImportantItemsConfig,
        isConfigured: true,
        items: [{ id: 'item-1', name: 'Medicine', quantity: 1, enabled: true }],
      }),
    };

    const migrated = resolveImportantConfigForPersistedProfile(
      store,
      'draft-profile-abc',
      'profile-emilie',
    );

    expect(migrated['profile-emilie']?.items[0]?.name).toBe('Medicine');
    expect(migrated['draft-profile-abc']).toBeUndefined();
  });
});

describe('persistCommittedTripProfiles', () => {
  it('persists remembered draft profile and loadAll returns it', async () => {
    const repository = new MockPackingProfileRepository([], {});
    const remembered: PackingProfile[] = [];
    const draftImportant: ImportantItemsConfig = cloneImportantItemsConfig({
      ...defaultImportantItemsConfig,
      isConfigured: true,
      items: [{ id: 'imp-1', name: 'EpiPen', quantity: 1, enabled: true }],
    });

    const draftProfile: PackingProfile = {
      id: 'draft-profile-emilie',
      name: 'Emilie',
      age: 8,
      isSelf: false,
      rememberForFutureTrips: true,
    };

    const result = await persistCommittedTripProfiles({
      tripProfiles: [draftProfile],
      savedProfiles: [],
      draftImportantByProfileId: { [draftProfile.id]: draftImportant },
      globalImportantByProfileId: {},
      profileRepository: repository,
      rememberPackingProfile: (profile, config) => {
        remembered.push(profile);
        expect(config?.items[0]?.name).toBe('EpiPen');
      },
    });

    expect(result.errors).toHaveLength(0);
    expect(result.resolvedProfiles[0]?.id).toMatch(/^profile-/);

    const loaded = await repository.loadAll();
    expect(loaded.profiles).toHaveLength(1);
    expect(loaded.profiles[0]?.name).toBe('Emilie');
    expect(loaded.importantByProfileId[loaded.profiles[0]!.id]?.items[0]?.name).toBe('EpiPen');
  });

  it('upserts already persistable saved profiles without remember flag', async () => {
    const existing: PackingProfile = {
      id: 'profile-emilie',
      name: 'Emilie',
      age: 8,
      isSelf: false,
    };
    const repository = new MockPackingProfileRepository([existing], {});

    const result = await persistCommittedTripProfiles({
      tripProfiles: [existing],
      savedProfiles: [existing],
      draftImportantByProfileId: {},
      globalImportantByProfileId: {},
      profileRepository: repository,
      rememberPackingProfile: () => undefined,
    });

    expect(result.errors).toHaveLength(0);
    const loaded = await repository.loadAll();
    expect(loaded.profiles).toHaveLength(1);
    expect(loaded.profiles[0]?.id).toBe('profile-emilie');
  });

  it('returns errors when repository save fails instead of claiming success', async () => {
    const repository = new MockPackingProfileRepository([], {});
    jest.spyOn(repository, 'saveProfile').mockRejectedValueOnce(new Error('DB write failed'));

    const draftProfile: PackingProfile = {
      id: 'draft-profile-emilie',
      name: 'Emilie',
      isSelf: false,
      rememberForFutureTrips: true,
    };

    const result = await persistCommittedTripProfiles({
      tripProfiles: [draftProfile],
      savedProfiles: [],
      draftImportantByProfileId: {},
      globalImportantByProfileId: {},
      profileRepository: repository,
      rememberPackingProfile: () => undefined,
    });

    expect(result.errors).toEqual(['DB write failed']);
  });
});

describe('saved profile availability after traveller removal', () => {
  it('does not delete reusable profile when removing traveller list from trip', async () => {
    const repository = new MockPackingProfileRepository(
      [{ id: 'profile-emilie', name: 'Emilie', age: 8, isSelf: false }],
      {},
    );
    const deleteSpy = jest.spyOn(repository, 'deleteProfile');
    const trip = createTripWithEmilie();

    const updated = removeTravellerFromTrip(trip, { packingProfileId: 'profile-emilie' });
    expect(updated.packingLists).toHaveLength(1);
    expect(deleteSpy).not.toHaveBeenCalled();

    const loaded = await repository.loadAll();
    expect(loaded.profiles).toHaveLength(1);
    expect(loaded.profiles[0]?.id).toBe('profile-emilie');
  });

  it('includes saved profile in Add person after removal from trip', () => {
    const trip = removeTravellerFromTrip(createTripWithEmilie(), {
      packingProfileId: 'profile-emilie',
    });
    const savedProfiles: PackingProfile[] = [
      { id: 'profile-emilie', name: 'Emilie', age: 8, isSelf: false },
      { id: 'profile-jonas', name: 'Jonas', age: 10, isSelf: false },
    ];

    const available = availableSavedProfilesForTrip(savedProfiles, trip);

    expect(available.map((profile) => profile.id)).toEqual(['profile-emilie', 'profile-jonas']);
  });

  it('excludes profile already on trip from Add person candidates', () => {
    const trip = createTripWithEmilie();
    const savedProfiles: PackingProfile[] = [
      { id: 'profile-emilie', name: 'Emilie', age: 8, isSelf: false },
      { id: 'profile-jonas', name: 'Jonas', age: 10, isSelf: false },
    ];

    const available = availableSavedProfilesForTrip(savedProfiles, trip);

    expect(available).toHaveLength(1);
    expect(available[0]?.id).toBe('profile-jonas');
  });

  it('keeps important master attached to saved profile after list removal', () => {
    const importantConfig = cloneImportantItemsConfig({
      ...defaultImportantItemsConfig,
      isConfigured: true,
      items: [{ id: 'imp-1', name: 'Medicine', quantity: 1, enabled: true }],
    });
    const store = {
      'profile-emilie': importantConfig,
    };

    removeTravellerFromTrip(createTripWithEmilie(), { packingProfileId: 'profile-emilie' });

    expect(store['profile-emilie']?.items[0]?.name).toBe('Medicine');
  });
});

describe('createPersistablePackingProfileId', () => {
  it('creates non-draft profile ids', () => {
    const id = createPersistablePackingProfileId();
    expect(id.startsWith('profile-')).toBe(true);
    expect(id.includes('draft-profile')).toBe(false);
  });
});
