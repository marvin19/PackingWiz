import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { ImportantItem } from '@/domain/important-item';
import {
  enabledImportantItemsFromConfig,
  isImportantFeatureActiveForConfig,
  type ImportantItemsConfig,
} from '@/domain/important-items-config';
import { buildImportantMasterVersion } from '@/domain/important-snapshot';
import { importantStaleNoticeKey } from '@/domain/important-profile-setup';
import type { PackingProfile } from '@/domain/packing-profile';
import {
  addImportantItemForProfileStore,
  attachImportantBootstrapToRememberedProfile,
  bootstrapImportantConfigFromProfiles,
  getImportantConfigForProfile,
  migrateImportantProfileStoreKey,
  refreshRememberedProfileBootstraps,
  removeImportantItemForProfileStore,
  resolveImportantProfileId,
  saveImportantItemNamesForProfile,
  setImportantConfigForProfile,
  SELF_IMPORTANT_PROFILE_ID,
  setImportantEnabledForProfileStore,
  setImportantPromptDismissedForProfileStore,
  updateImportantItemForProfileStore,
  type ImportantItemsByProfileId,
} from '@/domain/profile-important-items';
import {
  defaultUserPreferences,
  type SavedTravelerProfile,
  type UserPreferences,
} from '@/domain/user-settings';
import { createUuid } from '@/lib/id';
import { mockSavedPackingProfiles } from '@/mocks/saved-packing-profiles';
import { mockSavedTravelers } from '@/mocks/saved-travelers';

type PreferenceKey = keyof UserPreferences;

interface ProfileContextValue {
  preferences: UserPreferences;
  savedTravelers: SavedTravelerProfile[];
  /** Session/mock reusable packing profiles (non-self) for trip creation. */
  savedPackingProfiles: PackingProfile[];
  /** Canonical self profile id for Important master lookups. */
  selfImportantProfileId: string;
  /** Canonical profile-scoped Important master store (read-only for trip assembly). */
  importantByProfileId: ImportantItemsByProfileId;
  importantItems: ImportantItem[];
  enabledImportantItems: ImportantItem[];
  isImportantConfigured: boolean;
  isImportantEnabled: boolean;
  isImportantFeatureActive: boolean;
  importantPromptDismissed: boolean;
  importantMasterVersion: string;
  importantUpdatedAt?: string;
  getImportantConfigForProfile: (profileId: string) => ImportantItemsConfig;
  getImportantItemsForProfile: (profileId: string) => ImportantItem[];
  getEnabledImportantItemsForProfile: (profileId: string) => ImportantItem[];
  isImportantConfiguredForProfile: (profileId: string) => boolean;
  isImportantEnabledForProfile: (profileId: string) => boolean;
  isImportantFeatureActiveForProfile: (profileId: string) => boolean;
  getImportantMasterVersionForProfile: (profileId: string) => string;
  saveImportantItemsForProfile: (profileId: string, names: string[]) => ImportantItem[];
  setImportantEnabledForProfile: (profileId: string, enabled: boolean) => void;
  addImportantItemForProfile: (profileId: string, name: string) => ImportantItem | null;
  updateImportantItemForProfile: (
    profileId: string,
    itemId: string,
    patch: Partial<Pick<ImportantItem, 'name' | 'enabled' | 'quantity'>>,
  ) => void;
  removeImportantItemForProfile: (profileId: string, itemId: string) => void;
  resolveImportantProfileId: typeof resolveImportantProfileId;
  setPreference: (key: PreferenceKey, value: boolean) => void;
  addSavedTraveler: () => void;
  rememberPackingProfile: (profile: PackingProfile, draftImportantConfig?: ImportantItemsConfig) => void;
  /** Remove draft-only Important keys after draft deletion (MP5B). */
  purgeImportantProfileIds: (profileIds: string[]) => void;
  /** Promote draft-scoped Important to global store at trip commit (MP5B). */
  importImportantConfigForProfile: (profileId: string, config: ImportantItemsConfig) => void;
  saveImportantItems: (names: string[]) => ImportantItem[];
  setImportantEnabled: (enabled: boolean) => void;
  dismissImportantPrompt: () => void;
  dismissImportantPromptForProfile: (profileId: string) => void;
  resetImportantPromptDismissed: () => void;
  resetImportantPromptDismissedForProfile: (profileId: string) => void;
  isImportantPromptDismissedForProfile: (profileId: string) => boolean;
  requestOpenImportantEditor: (profileId: string) => void;
  consumeImportantEditorRequest: () => string | null;
  dismissImportantStaleNotice: (tripId: string, listId: string, masterVersion: string) => void;
  isImportantStaleNoticeDismissed: (tripId: string, listId: string, masterVersion: string) => boolean;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultUserPreferences);
  const [savedTravelers, setSavedTravelers] = useState<SavedTravelerProfile[]>(mockSavedTravelers);
  const [savedPackingProfiles, setSavedPackingProfiles] = useState<PackingProfile[]>(() =>
    mockSavedPackingProfiles.map((profile) => ({ ...profile })),
  );
  const [importantByProfileId, setImportantByProfileId] = useState<ImportantItemsByProfileId>(() =>
    bootstrapImportantConfigFromProfiles({}, mockSavedPackingProfiles),
  );
  const [importantEditorRequestProfileId, setImportantEditorRequestProfileId] = useState<string | null>(
    null,
  );
  const [dismissedImportantMasterVersionByList, setDismissedImportantMasterVersionByList] =
    useState<Record<string, string>>({});

  const commitImportantStore = useCallback(
    (updater: (current: ImportantItemsByProfileId) => ImportantItemsByProfileId) => {
      setImportantByProfileId((current) => {
        const next = updater(current);
        setSavedPackingProfiles((profiles) => refreshRememberedProfileBootstraps(profiles, next));
        return next;
      });
    },
    [],
  );

  const selfImportantConfig = useMemo(
    () => getImportantConfigForProfile(importantByProfileId, SELF_IMPORTANT_PROFILE_ID),
    [importantByProfileId],
  );

  const enabledImportantItems = useMemo(
    () => enabledImportantItemsFromConfig(selfImportantConfig),
    [selfImportantConfig],
  );

  const importantFeatureActive = useMemo(
    () => isImportantFeatureActiveForConfig(selfImportantConfig),
    [selfImportantConfig],
  );

  const importantMasterVersion = useMemo(
    () => buildImportantMasterVersion(selfImportantConfig),
    [selfImportantConfig],
  );

  const readImportantConfigForProfile = useCallback(
    (profileId: string) => getImportantConfigForProfile(importantByProfileId, profileId),
    [importantByProfileId],
  );

  const getImportantItemsForProfile = useCallback(
    (profileId: string) => readImportantConfigForProfile(profileId).items,
    [readImportantConfigForProfile],
  );

  const getEnabledImportantItemsForProfile = useCallback(
    (profileId: string) => enabledImportantItemsFromConfig(readImportantConfigForProfile(profileId)),
    [readImportantConfigForProfile],
  );

  const isImportantConfiguredForProfile = useCallback(
    (profileId: string) => readImportantConfigForProfile(profileId).isConfigured,
    [readImportantConfigForProfile],
  );

  const isImportantEnabledForProfile = useCallback(
    (profileId: string) => readImportantConfigForProfile(profileId).isEnabled,
    [readImportantConfigForProfile],
  );

  const isImportantFeatureActiveForProfile = useCallback(
    (profileId: string) => isImportantFeatureActiveForConfig(readImportantConfigForProfile(profileId)),
    [readImportantConfigForProfile],
  );

  const getImportantMasterVersionForProfile = useCallback(
    (profileId: string) => buildImportantMasterVersion(readImportantConfigForProfile(profileId)),
    [readImportantConfigForProfile],
  );

  const saveImportantItemsForProfile = useCallback((profileId: string, names: string[]) => {
    let savedItems: ImportantItem[] = [];

    commitImportantStore((current) => {
      const result = saveImportantItemNamesForProfile(current, profileId, names, createUuid);
      savedItems = result.savedItems;
      return result.store;
    });

    return savedItems;
  }, [commitImportantStore]);

  const setImportantEnabledForProfile = useCallback(
    (profileId: string, enabled: boolean) => {
      commitImportantStore((current) => setImportantEnabledForProfileStore(current, profileId, enabled));
    },
    [commitImportantStore],
  );

  const addImportantItemForProfile = useCallback(
    (profileId: string, name: string) => {
      let created: ImportantItem | null = null;

      commitImportantStore((current) => {
        const result = addImportantItemForProfileStore(current, profileId, name, createUuid);
        created = result.item;
        return result.store;
      });

      return created;
    },
    [commitImportantStore],
  );

  const updateImportantItemForProfile = useCallback(
    (
      profileId: string,
      itemId: string,
      patch: Partial<Pick<ImportantItem, 'name' | 'enabled' | 'quantity'>>,
    ) => {
      commitImportantStore((current) =>
        updateImportantItemForProfileStore(current, profileId, itemId, patch),
      );
    },
    [commitImportantStore],
  );

  const removeImportantItemForProfile = useCallback(
    (profileId: string, itemId: string) => {
      commitImportantStore((current) =>
        removeImportantItemForProfileStore(current, profileId, itemId),
      );
    },
    [commitImportantStore],
  );

  const setPreference = useCallback((key: PreferenceKey, value: boolean) => {
    setPreferences((current) => ({ ...current, [key]: value }));
  }, []);

  const addSavedTraveler = useCallback(() => {
    setSavedTravelers((current) => {
      const nextIndex =
        current.filter((traveler) => traveler.name.startsWith('Traveler ')).length + 1;

      return [
        ...current,
        {
          id: createUuid(),
          name: `Traveler ${nextIndex}`,
          role: 'Adult',
        },
      ];
    });
  }, []);

  const rememberPackingProfile = useCallback(
    (profile: PackingProfile, draftImportantConfig?: ImportantItemsConfig) => {
    if (profile.isSelf) {
      return;
    }

    const { importantItemsBootstrap: _ignored, ...profileFields } = profile;
    const normalized: PackingProfile = {
      ...profileFields,
      isSelf: false,
      name: profile.name.trim(),
    };

    setImportantByProfileId((current) => {
      let nextStore = current;
      if (draftImportantConfig?.isConfigured) {
        nextStore = setImportantConfigForProfile(nextStore, normalized.id, draftImportantConfig);
      }
      nextStore = bootstrapImportantConfigFromProfiles(nextStore, [profile]);

      setSavedPackingProfiles((savedProfiles) => {
        const byId = savedProfiles.findIndex((entry) => entry.id === normalized.id);
        if (byId >= 0) {
          return savedProfiles.map((entry, index) =>
            index === byId
              ? attachImportantBootstrapToRememberedProfile({ ...normalized, id: entry.id }, nextStore)
              : entry,
          );
        }

        const nameKey = normalized.name.toLowerCase();
        const byName = savedProfiles.findIndex(
          (entry) => entry.name.trim().toLowerCase() === nameKey,
        );
        if (byName >= 0) {
          const targetId = savedProfiles[byName].id;
          if (targetId !== normalized.id) {
            nextStore = migrateImportantProfileStoreKey(nextStore, normalized.id, targetId);
          }

          return savedProfiles.map((entry, index) =>
            index === byName
              ? attachImportantBootstrapToRememberedProfile(
                  { ...normalized, id: entry.id, rememberForFutureTrips: undefined },
                  nextStore,
                )
              : entry,
          );
        }

        return [
          ...savedProfiles,
          attachImportantBootstrapToRememberedProfile(
            { ...normalized, rememberForFutureTrips: undefined },
            nextStore,
          ),
        ];
      });

      return nextStore;
    });
  },
  [],
);

  const purgeImportantProfileIds = useCallback((profileIds: string[]) => {
    if (profileIds.length === 0) {
      return;
    }

    commitImportantStore((current) => {
      const idsToRemove = new Set(profileIds);
      let changed = false;
      const next = { ...current };

      for (const profileId of idsToRemove) {
        if (Object.prototype.hasOwnProperty.call(next, profileId)) {
          delete next[profileId];
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [commitImportantStore]);

  const importImportantConfigForProfile = useCallback(
    (profileId: string, config: ImportantItemsConfig) => {
      commitImportantStore((current) =>
        setImportantConfigForProfile(current, profileId, config),
      );
    },
    [commitImportantStore],
  );

  const saveImportantItems = useCallback(
    (names: string[]) => saveImportantItemsForProfile(SELF_IMPORTANT_PROFILE_ID, names),
    [saveImportantItemsForProfile],
  );

  const setImportantEnabled = useCallback(
    (enabled: boolean) => setImportantEnabledForProfile(SELF_IMPORTANT_PROFILE_ID, enabled),
    [setImportantEnabledForProfile],
  );

  const isImportantPromptDismissedForProfile = useCallback(
    (profileId: string) => readImportantConfigForProfile(profileId).promptDismissed,
    [readImportantConfigForProfile],
  );

  const requestOpenImportantEditor = useCallback((profileId: string) => {
    setImportantEditorRequestProfileId(profileId);
  }, []);

  const consumeImportantEditorRequest = useCallback(() => {
    if (!importantEditorRequestProfileId) {
      return null;
    }

    const profileId = importantEditorRequestProfileId;
    setImportantEditorRequestProfileId(null);
    return profileId;
  }, [importantEditorRequestProfileId]);

  const dismissImportantPrompt = useCallback(() => {
    commitImportantStore((current) =>
      setImportantPromptDismissedForProfileStore(current, SELF_IMPORTANT_PROFILE_ID, true),
    );
  }, [commitImportantStore]);

  const dismissImportantPromptForProfile = useCallback(
    (profileId: string) => {
      commitImportantStore((current) =>
        setImportantPromptDismissedForProfileStore(current, profileId, true),
      );
    },
    [commitImportantStore],
  );

  const resetImportantPromptDismissed = useCallback(() => {
    commitImportantStore((current) =>
      setImportantPromptDismissedForProfileStore(current, SELF_IMPORTANT_PROFILE_ID, false),
    );
  }, [commitImportantStore]);

  const resetImportantPromptDismissedForProfile = useCallback(
    (profileId: string) => {
      commitImportantStore((current) =>
        setImportantPromptDismissedForProfileStore(current, profileId, false),
      );
    },
    [commitImportantStore],
  );

  const dismissImportantStaleNotice = useCallback(
    (tripId: string, listId: string, masterVersion: string) => {
      const key = importantStaleNoticeKey(tripId, listId);
      setDismissedImportantMasterVersionByList((current) => ({
        ...current,
        [key]: masterVersion,
      }));
    },
    [],
  );

  const isImportantStaleNoticeDismissed = useCallback(
    (tripId: string, listId: string, masterVersion: string) => {
      const key = importantStaleNoticeKey(tripId, listId);
      return dismissedImportantMasterVersionByList[key] === masterVersion;
    },
    [dismissedImportantMasterVersionByList],
  );

  const value = useMemo<ProfileContextValue>(
    () => ({
      preferences,
      savedTravelers,
      savedPackingProfiles,
      selfImportantProfileId: SELF_IMPORTANT_PROFILE_ID,
      importantByProfileId,
      importantItems: selfImportantConfig.items,
      enabledImportantItems,
      isImportantConfigured: selfImportantConfig.isConfigured,
      isImportantEnabled: selfImportantConfig.isEnabled,
      isImportantFeatureActive: importantFeatureActive,
      importantPromptDismissed: selfImportantConfig.promptDismissed,
      importantMasterVersion,
      importantUpdatedAt: selfImportantConfig.updatedAt,
      getImportantConfigForProfile: readImportantConfigForProfile,
      getImportantItemsForProfile,
      getEnabledImportantItemsForProfile,
      isImportantConfiguredForProfile,
      isImportantEnabledForProfile,
      isImportantFeatureActiveForProfile,
      getImportantMasterVersionForProfile,
      saveImportantItemsForProfile,
      setImportantEnabledForProfile,
      addImportantItemForProfile,
      updateImportantItemForProfile,
      removeImportantItemForProfile,
      resolveImportantProfileId,
      setPreference,
      addSavedTraveler,
      rememberPackingProfile,
      purgeImportantProfileIds,
      importImportantConfigForProfile,
      saveImportantItems,
      setImportantEnabled,
      dismissImportantPrompt,
      dismissImportantPromptForProfile,
      resetImportantPromptDismissed,
      resetImportantPromptDismissedForProfile,
      isImportantPromptDismissedForProfile,
      requestOpenImportantEditor,
      consumeImportantEditorRequest,
      dismissImportantStaleNotice,
      isImportantStaleNoticeDismissed,
    }),
    [
      addImportantItemForProfile,
      addSavedTraveler,
      consumeImportantEditorRequest,
      dismissImportantPrompt,
      dismissImportantPromptForProfile,
      dismissImportantStaleNotice,
      enabledImportantItems,
      getEnabledImportantItemsForProfile,
      getImportantItemsForProfile,
      getImportantMasterVersionForProfile,
      importantFeatureActive,
      importantByProfileId,
      importantMasterVersion,
      isImportantConfiguredForProfile,
      isImportantEnabledForProfile,
      isImportantFeatureActiveForProfile,
      isImportantPromptDismissedForProfile,
      isImportantStaleNoticeDismissed,
      preferences,
      readImportantConfigForProfile,
      rememberPackingProfile,
      purgeImportantProfileIds,
      importImportantConfigForProfile,
      removeImportantItemForProfile,
      requestOpenImportantEditor,
      resetImportantPromptDismissed,
      resetImportantPromptDismissedForProfile,
      saveImportantItems,
      saveImportantItemsForProfile,
      savedPackingProfiles,
      savedTravelers,
      selfImportantConfig.isConfigured,
      selfImportantConfig.isEnabled,
      selfImportantConfig.items,
      selfImportantConfig.promptDismissed,
      selfImportantConfig.updatedAt,
      setImportantEnabled,
      setImportantEnabledForProfile,
      setPreference,
      updateImportantItemForProfile,
    ],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider');
  }

  return context;
}
