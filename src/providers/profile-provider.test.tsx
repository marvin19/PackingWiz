import React, { useEffect } from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import {
  cloneImportantItemsConfig,
  defaultImportantItemsConfig,
  type ImportantItemsConfig,
} from '@/domain/important-items-config';
import type { PackingProfile } from '@/domain/packing-profile';
import { SELF_IMPORTANT_PROFILE_ID } from '@/domain/profile-important-items';
import { ProfileProvider, useProfile, type ProfileContextValue } from '@/providers/profile-provider';
import type { PackingProfileRepository } from '@/repositories/profiles/packing-profile-repository';

const LOCAL_EMILIE_ID = 'profile-local-emilie';
const REMOTE_JONAS_ID = 'profile-remote-jonas';
const SHARED_PROFILE_ID = 'profile-shared-id';

let profileContext: ProfileContextValue | null = null;

function currentProfileContext(): ProfileContextValue | null {
  return profileContext;
}

function profilesSnapshot(profiles: PackingProfile[]) {
  return profiles
    .filter((profile) => !profile.isSelf)
    .map((profile) => ({ id: profile.id, name: profile.name, age: profile.age }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

function importantNamesSnapshot(context: ProfileContextValue, profileId: string): string[] {
  return context.getImportantItemsForProfile(profileId).map((item) => item.name);
}

function buildImportantConfig(names: string[]): ImportantItemsConfig {
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

function createProfileRepositoryMock(): PackingProfileRepository & {
  loadAll: jest.Mock;
  saveProfile: jest.Mock;
  saveImportantMaster: jest.Mock;
  deleteProfile: jest.Mock;
} {
  return {
    loadAll: jest.fn(async () => ({
      profiles: [] as PackingProfile[],
      importantByProfileId: {} as Record<string, ImportantItemsConfig>,
    })),
    saveProfile: jest.fn(async (profile: PackingProfile) => ({ ...profile })),
    saveImportantMaster: jest.fn(async () => undefined),
    deleteProfile: jest.fn(async () => undefined),
  };
}

const mockProfileRepository = createProfileRepositoryMock();

let mockIsAuthReady = false;

jest.mock('@/config/persistence', () => ({
  getPersistenceMode: jest.fn(() => 'supabase' as const),
  logSavedProfilesDiagnosticsDev: jest.fn(),
}));

jest.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({
    isAuthReady: mockIsAuthReady,
    authError: null,
    userId: 'user-test',
  }),
}));

jest.mock('@/providers/services-provider', () => ({
  useServices: () => ({
    profileRepository: mockProfileRepository,
    tripRepository: {},
    packingGenerator: {},
    weatherService: {},
  }),
}));

let renderer: TestRenderer.ReactTestRenderer | null = null;

function ProfileProbe() {
  const context = useProfile();
  useEffect(() => {
    profileContext = context;
  }, [context]);
  return null;
}

async function flushAsync(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function mountProfileProvider(): Promise<void> {
  Object.assign(mockProfileRepository, createProfileRepositoryMock());
  profileContext = null;
  renderer = null;

  await act(async () => {
    renderer = TestRenderer.create(
      <ProfileProvider>
        <ProfileProbe />
      </ProfileProvider>,
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (currentProfileContext()) {
      break;
    }
    await flushAsync();
  }

  if (!currentProfileContext()) {
    throw new Error('ProfileProvider failed to expose context in test harness');
  }
}

async function rerenderProfileProvider(): Promise<void> {
  if (!renderer) {
    throw new Error('ProfileProvider renderer is not mounted');
  }

  await act(async () => {
    renderer!.update(
      <ProfileProvider>
        <ProfileProbe />
      </ProfileProvider>,
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  await flushAsync();
}

describe('ProfileProvider auth + persistence (VH2-C)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthReady = false;
  });

  describe('auth readiness load', () => {
    it('does not load remote profiles before auth is ready', async () => {
      await mountProfileProvider();

      expect(mockProfileRepository.loadAll).not.toHaveBeenCalled();
    });

    it('loads remote profiles once after auth becomes ready', async () => {
      await mountProfileProvider();
      expect(mockProfileRepository.loadAll).not.toHaveBeenCalled();

      mockIsAuthReady = true;
      mockProfileRepository.loadAll.mockResolvedValueOnce({
        profiles: [{ id: REMOTE_JONAS_ID, name: 'Jonas', age: 10, isSelf: false }],
        importantByProfileId: {},
      });

      await rerenderProfileProvider();
      await flushAsync();

      expect(mockProfileRepository.loadAll).toHaveBeenCalledTimes(1);
      expect(profilesSnapshot(currentProfileContext()!.savedPackingProfiles)).toEqual([
        { id: REMOTE_JONAS_ID, name: 'Jonas', age: 10 },
      ]);
    });

    it('preserves usable local remembered profiles when remote load fails', async () => {
      await mountProfileProvider();

      act(() => {
        currentProfileContext()!.rememberPackingProfile({
          id: LOCAL_EMILIE_ID,
          name: 'Emilie',
          age: 8,
          isSelf: false,
        });
      });

      const before = profilesSnapshot(currentProfileContext()!.savedPackingProfiles);

      mockIsAuthReady = true;
      mockProfileRepository.loadAll.mockRejectedValueOnce(new Error('network down'));

      await rerenderProfileProvider();
      await flushAsync();

      expect(profilesSnapshot(currentProfileContext()!.savedPackingProfiles)).toEqual(before);
      expect(currentProfileContext()!.savedPackingProfiles.some((profile) => profile.id === LOCAL_EMILIE_ID)).toBe(
        true,
      );
    });

    it('does not erase valid local remembered profiles when remote returns empty', async () => {
      await mountProfileProvider();

      act(() => {
        currentProfileContext()!.rememberPackingProfile({
          id: LOCAL_EMILIE_ID,
          name: 'Emilie',
          age: 8,
          isSelf: false,
        });
      });

      mockIsAuthReady = true;
      mockProfileRepository.loadAll.mockResolvedValueOnce({
        profiles: [],
        importantByProfileId: {},
      });

      await rerenderProfileProvider();
      await flushAsync();

      expect(profilesSnapshot(currentProfileContext()!.savedPackingProfiles)).toEqual([
        { id: LOCAL_EMILIE_ID, name: 'Emilie', age: 8 },
      ]);
    });
  });

  describe('local + remote merge', () => {
    beforeEach(async () => {
      await mountProfileProvider();
      act(() => {
        currentProfileContext()!.rememberPackingProfile({
          id: LOCAL_EMILIE_ID,
          name: 'Emilie',
          age: 8,
          isSelf: false,
        });
      });
    });

    it('merges remote-only and local-only profiles by stable id', async () => {
      mockIsAuthReady = true;
      mockProfileRepository.loadAll.mockResolvedValueOnce({
        profiles: [{ id: REMOTE_JONAS_ID, name: 'Jonas', age: 10, isSelf: false }],
        importantByProfileId: {},
      });

      await rerenderProfileProvider();
      await flushAsync();

      expect(profilesSnapshot(currentProfileContext()!.savedPackingProfiles)).toEqual([
        { id: LOCAL_EMILIE_ID, name: 'Emilie', age: 8 },
        { id: REMOTE_JONAS_ID, name: 'Jonas', age: 10 },
      ]);
    });

    it('prefers remote metadata for the same stable profile id', async () => {
      mockIsAuthReady = true;
      mockProfileRepository.loadAll.mockResolvedValueOnce({
        profiles: [{ id: LOCAL_EMILIE_ID, name: 'Emilie', age: 9, isSelf: false }],
        importantByProfileId: {},
      });

      await rerenderProfileProvider();
      await flushAsync();

      expect(profilesSnapshot(currentProfileContext()!.savedPackingProfiles)).toEqual([
        { id: LOCAL_EMILIE_ID, name: 'Emilie', age: 9 },
      ]);
    });

    it('does not collapse same-name profiles with distinct stable ids', async () => {
      act(() => {
        currentProfileContext()!.rememberPackingProfile({
          id: 'profile-emilie-b',
          name: 'Emilie',
          age: 11,
          isSelf: false,
        });
      });

      mockIsAuthReady = true;
      mockProfileRepository.loadAll.mockResolvedValueOnce({
        profiles: [{ id: 'profile-emilie-a', name: 'Emilie', age: 8, isSelf: false }],
        importantByProfileId: {},
      });

      await rerenderProfileProvider();
      await flushAsync();

      expect(profilesSnapshot(currentProfileContext()!.savedPackingProfiles)).toEqual([
        { id: 'profile-emilie-a', name: 'Emilie', age: 8 },
        { id: 'profile-emilie-b', name: 'Emilie', age: 11 },
        { id: LOCAL_EMILIE_ID, name: 'Emilie', age: 8 },
      ]);
    });

    it('keeps local-only Important config keys when remote has no entry', async () => {
      const localImportant = buildImportantConfig(['Local medicine']);

      act(() => {
        currentProfileContext()!.rememberPackingProfile(
          { id: LOCAL_EMILIE_ID, name: 'Emilie', age: 8, isSelf: false },
          localImportant,
        );
      });

      mockIsAuthReady = true;
      mockProfileRepository.loadAll.mockResolvedValueOnce({
        profiles: [{ id: LOCAL_EMILIE_ID, name: 'Emilie', age: 8, isSelf: false }],
        importantByProfileId: {},
      });

      await rerenderProfileProvider();
      await flushAsync();

      expect(importantNamesSnapshot(currentProfileContext()!, LOCAL_EMILIE_ID)).toEqual([
        'Local medicine',
      ]);
    });
  });

  describe('rememberPackingProfile', () => {
    beforeEach(async () => {
      await mountProfileProvider();
    });

    it('promotes draft-profile-* to stable id in provider state', () => {
      act(() => {
        currentProfileContext()!.rememberPackingProfile({
          id: 'draft-profile-emilie',
          name: 'Emilie',
          age: 8,
          isSelf: false,
          rememberForFutureTrips: true,
        });
      });

      const saved = currentProfileContext()!.savedPackingProfiles;
      expect(saved).toHaveLength(1);
      expect(saved[0]?.id).toMatch(/^profile-/);
      expect(saved[0]?.id).not.toContain('draft-profile');
      expect(saved.some((profile) => profile.id.includes('draft-profile'))).toBe(false);
      expect(mockProfileRepository.saveProfile).not.toHaveBeenCalled();
    });

    it('migrates draft Important config onto the stable profile id', () => {
      const draftImportant = buildImportantConfig(['EpiPen']);

      act(() => {
        currentProfileContext()!.rememberPackingProfile(
          {
            id: 'draft-profile-emilie',
            name: 'Emilie',
            age: 8,
            isSelf: false,
            rememberForFutureTrips: true,
          },
          draftImportant,
        );
      });

      const stableId = currentProfileContext()!.savedPackingProfiles[0]!.id;
      expect(currentProfileContext()!.importantByProfileId['draft-profile-emilie']).toBeUndefined();
      expect(importantNamesSnapshot(currentProfileContext()!, stableId)).toEqual(['EpiPen']);
    });

    it('upserts an existing saved profile without creating duplicates', () => {
      act(() => {
        currentProfileContext()!.rememberPackingProfile({
          id: SHARED_PROFILE_ID,
          name: 'Emilie',
          age: 8,
          isSelf: false,
        });
        currentProfileContext()!.rememberPackingProfile({
          id: SHARED_PROFILE_ID,
          name: 'Emilie',
          age: 9,
          isSelf: false,
        });
      });

      expect(currentProfileContext()!.savedPackingProfiles).toHaveLength(1);
      expect(currentProfileContext()!.savedPackingProfiles[0]?.age).toBe(9);
    });

    it('does not remember self profiles or call repository saveProfile', () => {
      act(() => {
        currentProfileContext()!.rememberPackingProfile({
          id: 'profile-self-trip',
          name: 'Me',
          isSelf: true,
        });
      });

      expect(currentProfileContext()!.savedPackingProfiles).toHaveLength(0);
      expect(mockProfileRepository.saveProfile).not.toHaveBeenCalled();
    });
  });

  describe('Important master load and persist', () => {
    it('loads profile-scoped Important masters without cross-profile bleed', async () => {
      mockIsAuthReady = false;
      await mountProfileProvider();

      mockProfileRepository.loadAll.mockResolvedValueOnce({
        profiles: [
          { id: 'profile-a', name: 'Profile A', isSelf: false },
          { id: 'profile-b', name: 'Profile B', isSelf: false },
        ],
        importantByProfileId: {
          'profile-a': buildImportantConfig(['A medicine']),
          'profile-b': buildImportantConfig(['B toy']),
        },
      });

      mockIsAuthReady = true;
      await rerenderProfileProvider();
      await flushAsync();

      expect(importantNamesSnapshot(currentProfileContext()!, 'profile-a')).toEqual(['A medicine']);
      expect(importantNamesSnapshot(currentProfileContext()!, 'profile-b')).toEqual(['B toy']);
      expect(importantNamesSnapshot(currentProfileContext()!, SELF_IMPORTANT_PROFILE_ID)).toEqual([]);
    });

    it('persists Important master under the exact stable profile id', async () => {
      await mountProfileProvider();

      act(() => {
        currentProfileContext()!.saveImportantItemsForProfile('profile-jonas', ['Sunscreen']);
      });
      await flushAsync();

      expect(mockProfileRepository.saveImportantMaster).toHaveBeenCalledWith(
        'profile-jonas',
        expect.objectContaining({
          items: expect.arrayContaining([expect.objectContaining({ name: 'Sunscreen' })]),
        }),
      );
    });

    it('resolves draft-profile Important writes to stable id after remember', async () => {
      await mountProfileProvider();

      act(() => {
        currentProfileContext()!.rememberPackingProfile(
          {
            id: 'draft-profile-emilie',
            name: 'Emilie',
            age: 8,
            isSelf: false,
            rememberForFutureTrips: true,
          },
          buildImportantConfig(['Draft inhaler']),
        );
      });

      const stableId = currentProfileContext()!.savedPackingProfiles[0]!.id;

      act(() => {
        currentProfileContext()!.addImportantItemForProfile(stableId, 'Stable add-on');
      });
      await flushAsync();

      expect(mockProfileRepository.saveImportantMaster).toHaveBeenCalledWith(
        stableId,
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({ name: 'Draft inhaler' }),
            expect.objectContaining({ name: 'Stable add-on' }),
          ]),
        }),
      );
      expect(
        mockProfileRepository.saveImportantMaster.mock.calls.some(([profileId]) =>
          String(profileId).includes('draft-profile'),
        ),
      ).toBe(false);
    });
  });

  describe('Important persist failure', () => {
    it('surfaces repository errors instead of silently swallowing them', async () => {
      await mountProfileProvider();
      mockProfileRepository.saveImportantMaster.mockRejectedValueOnce(new Error('important write failed'));

      act(() => {
        currentProfileContext()!.saveImportantItemsForProfile('profile-jonas', ['Glasses']);
      });
      await flushAsync();

      expect(currentProfileContext()!.repositoryError).toBe('important write failed');
      expect(importantNamesSnapshot(currentProfileContext()!, 'profile-jonas')).toEqual(['Glasses']);
    });

    it('clears repository error after a later successful Important save', async () => {
      await mountProfileProvider();
      mockProfileRepository.saveImportantMaster.mockRejectedValueOnce(new Error('important write failed'));

      act(() => {
        currentProfileContext()!.saveImportantItemsForProfile('profile-jonas', ['Glasses']);
      });
      await flushAsync();
      expect(currentProfileContext()!.repositoryError).toBe('important write failed');

      mockProfileRepository.saveImportantMaster.mockResolvedValueOnce(undefined);
      act(() => {
        currentProfileContext()!.addImportantItemForProfile('profile-jonas', 'Hat');
      });
      await flushAsync();

      expect(currentProfileContext()!.repositoryError).toBeNull();
    });
  });

  it('does not expose legacy savedTravelers separate from savedPackingProfiles', async () => {
    await mountProfileProvider();

    const context = currentProfileContext()!;
    expect(context).not.toHaveProperty('savedTravelers');
    expect(context).not.toHaveProperty('addSavedTraveler');
    expect(Array.isArray(context.savedPackingProfiles)).toBe(true);
  });
});
