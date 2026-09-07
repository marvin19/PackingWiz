import {
  cloneImportantItemsConfig,
  defaultImportantItemsConfig,
} from '@/domain/important-items-config';
import type { ImportantItemsConfig } from '@/domain/important-items-config';
import type { PackingProfile } from '@/domain/packing-profile';
import { MockPackingProfileRepository } from '@/repositories/profiles/mock-packing-profile-repository';
import { persistCommittedTripProfiles } from '@/services/persist-committed-trip-profiles';

function buildImportant(names: string[]): ImportantItemsConfig {
  return cloneImportantItemsConfig({
    ...defaultImportantItemsConfig,
    isConfigured: true,
    isEnabled: true,
    items: names.map((name, index) => ({
      id: `imp-${name}-${index}`,
      name,
      quantity: 1,
      enabled: true,
    })),
  });
}

describe('persistCommittedTripProfiles (VH2-F)', () => {
  it('promotes remembered draft profile with stable id and Important master', async () => {
    const repository = new MockPackingProfileRepository([], {});
    const remembered: PackingProfile[] = [];
    const draftImportant = buildImportant(['EpiPen']);
    const draftProfile: PackingProfile = {
      id: 'draft-profile-emilie',
      name: 'Emilie',
      age: 8,
      isSelf: false,
      rememberForFutureTrips: true,
    };

    const saveProfileSpy = jest.spyOn(repository, 'saveProfile');
    const saveImportantSpy = jest.spyOn(repository, 'saveImportantMaster');

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
    expect(result.resolvedProfiles).toHaveLength(1);
    expect(result.resolvedProfiles[0]?.id).toMatch(/^profile-/);
    expect(result.resolvedProfiles[0]?.id).not.toContain('draft-profile');
    expect(remembered).toHaveLength(1);
    expect(saveProfileSpy).toHaveBeenCalledTimes(1);
    expect(saveProfileSpy.mock.calls[0]?.[0]?.id).toMatch(/^profile-/);
    expect(saveImportantSpy).toHaveBeenCalledWith(
      result.resolvedProfiles[0]!.id,
      expect.objectContaining({
        items: expect.arrayContaining([expect.objectContaining({ name: 'EpiPen' })]),
      }),
    );

    const loaded = await repository.loadAll();
    expect(loaded.profiles).toHaveLength(1);
    expect(loaded.profiles[0]?.id).toBe(result.resolvedProfiles[0]?.id);
    expect(loaded.importantByProfileId[loaded.profiles[0]!.id]?.items[0]?.name).toBe('EpiPen');
  });

  it('returns profile persistence errors without implying trip rollback', async () => {
    const repository = new MockPackingProfileRepository([], {});
    jest.spyOn(repository, 'saveProfile').mockRejectedValueOnce(new Error('DB write failed'));

    const result = await persistCommittedTripProfiles({
      tripProfiles: [
        {
          id: 'draft-profile-emilie',
          name: 'Emilie',
          isSelf: false,
          rememberForFutureTrips: true,
        },
      ],
      savedProfiles: [],
      draftImportantByProfileId: {},
      globalImportantByProfileId: {},
      profileRepository: repository,
      rememberPackingProfile: jest.fn(),
    });

    expect(result.errors).toEqual(['DB write failed']);
    expect(result.resolvedProfiles[0]?.id).toMatch(/^profile-/);
    expect(await repository.loadAll()).toEqual({ profiles: [], importantByProfileId: {} });
  });

  it('keeps saved profile when Important master persistence fails afterward', async () => {
    const repository = new MockPackingProfileRepository([], {});
    jest.spyOn(repository, 'saveImportantMaster').mockRejectedValueOnce(new Error('Important write failed'));

    const draftProfile: PackingProfile = {
      id: 'draft-profile-emilie',
      name: 'Emilie',
      isSelf: false,
      rememberForFutureTrips: true,
    };

    const result = await persistCommittedTripProfiles({
      tripProfiles: [draftProfile],
      savedProfiles: [],
      draftImportantByProfileId: { [draftProfile.id]: buildImportant(['Inhaler']) },
      globalImportantByProfileId: {},
      profileRepository: repository,
      rememberPackingProfile: jest.fn(),
    });

    expect(result.errors).toEqual(['Important write failed']);
    const loaded = await repository.loadAll();
    expect(loaded.profiles).toHaveLength(1);
    expect(loaded.profiles[0]?.id).toBe(result.resolvedProfiles[0]?.id);
    expect(loaded.profiles[0]?.name).toBe('Emilie');
  });

  it('skips reusable persistence when Remember is OFF', async () => {
    const repository = new MockPackingProfileRepository([], {});
    const saveProfileSpy = jest.spyOn(repository, 'saveProfile');
    const saveImportantSpy = jest.spyOn(repository, 'saveImportantMaster');

    const result = await persistCommittedTripProfiles({
      tripProfiles: [
        {
          id: 'draft-profile-emilie',
          name: 'Emilie',
          age: 8,
          isSelf: false,
          rememberForFutureTrips: false,
        },
      ],
      savedProfiles: [],
      draftImportantByProfileId: {},
      globalImportantByProfileId: {},
      profileRepository: repository,
      rememberPackingProfile: jest.fn(),
    });

    expect(result.errors).toHaveLength(0);
    expect(result.resolvedProfiles).toHaveLength(0);
    expect(saveProfileSpy).not.toHaveBeenCalled();
    expect(saveImportantSpy).not.toHaveBeenCalled();
  });

  it('upserts an already saved profile without creating duplicate identity', async () => {
    const existing: PackingProfile = {
      id: 'profile-emilie',
      name: 'Emilie',
      age: 8,
      isSelf: false,
    };
    const repository = new MockPackingProfileRepository([existing], {});
    const saveProfileSpy = jest.spyOn(repository, 'saveProfile');

    const result = await persistCommittedTripProfiles({
      tripProfiles: [existing],
      savedProfiles: [existing],
      draftImportantByProfileId: {},
      globalImportantByProfileId: {},
      profileRepository: repository,
      rememberPackingProfile: jest.fn(),
    });

    expect(result.errors).toHaveLength(0);
    expect(result.resolvedProfiles[0]?.id).toBe('profile-emilie');
    expect(saveProfileSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'profile-emilie', name: 'Emilie' }),
    );

    const loaded = await repository.loadAll();
    expect(loaded.profiles).toHaveLength(1);
    expect(loaded.profiles[0]?.id).toBe('profile-emilie');
  });

  it('preserves distinct stable ids for same-name profiles with different ids', async () => {
    const saved: PackingProfile[] = [
      { id: 'profile-emilie-a', name: 'Emilie', age: 8, isSelf: false },
    ];
    const repository = new MockPackingProfileRepository(saved, {});

    const result = await persistCommittedTripProfiles({
      tripProfiles: [{ id: 'profile-emilie-b', name: 'Emilie', age: 9, isSelf: false }],
      savedProfiles: saved,
      draftImportantByProfileId: {},
      globalImportantByProfileId: {},
      profileRepository: repository,
      rememberPackingProfile: jest.fn(),
    });

    expect(result.resolvedProfiles[0]?.id).toBe('profile-emilie-b');
    const loaded = await repository.loadAll();
    expect(loaded.profiles.map((profile) => profile.id).sort()).toEqual([
      'profile-emilie-a',
      'profile-emilie-b',
    ]);
  });

  it('continues batch persistence when one remembered profile fails', async () => {
    const repository = new MockPackingProfileRepository([], {});
    const remember = jest.fn();
    const originalSave = repository.saveProfile.bind(repository);
    jest
      .spyOn(repository, 'saveProfile')
      .mockImplementationOnce((profile) => originalSave(profile))
      .mockRejectedValueOnce(new Error('Jonas save failed'));

    const emilieDraft: PackingProfile = {
      id: 'draft-profile-emilie',
      name: 'Emilie',
      isSelf: false,
      rememberForFutureTrips: true,
    };
    const jonasDraft: PackingProfile = {
      id: 'draft-profile-jonas',
      name: 'Jonas',
      age: 10,
      isSelf: false,
      rememberForFutureTrips: true,
    };

    const result = await persistCommittedTripProfiles({
      tripProfiles: [emilieDraft, jonasDraft],
      savedProfiles: [],
      draftImportantByProfileId: {},
      globalImportantByProfileId: {},
      profileRepository: repository,
      rememberPackingProfile: remember,
    });

    expect(result.errors).toEqual(['Jonas save failed']);
    expect(result.resolvedProfiles).toHaveLength(2);
    expect(remember).toHaveBeenCalledTimes(2);

    const loaded = await repository.loadAll();
    expect(loaded.profiles).toHaveLength(1);
    expect(loaded.profiles[0]?.name).toBe('Emilie');
    expect(loaded.profiles.some((profile) => profile.name === 'Jonas')).toBe(false);
  });
});
