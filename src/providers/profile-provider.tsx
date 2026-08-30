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
import type { PackingProfile } from '@/domain/packing-profile';
import {
  addImportantItemForProfileStore,
  attachImportantBootstrapToRememberedProfile,
  bootstrapImportantConfigFromProfiles,
  getImportantConfigForProfile,
  refreshRememberedProfileBootstraps,
  removeImportantItemForProfileStore,
  resolveImportantProfileId,
  saveImportantItemNamesForProfile,
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
  rememberPackingProfile: (profile: PackingProfile) => void;
  saveImportantItems: (names: string[]) => ImportantItem[];
  setImportantEnabled: (enabled: boolean) => void;
  dismissImportantPrompt: () => void;
  resetImportantPromptDismissed: () => void;
  requestOpenImportantEditor: () => void;
  consumeImportantEditorRequest: () => boolean;
  dismissImportantStaleNotice: (tripId: string, masterVersion: string) => void;
  isImportantStaleNoticeDismissed: (tripId: string, masterVersion: string) => boolean;
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
  const [openImportantEditorRequest, setOpenImportantEditorRequest] = useState(false);
  const [dismissedImportantMasterVersionByTrip, setDismissedImportantMasterVersionByTrip] =
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

  const rememberPackingProfile = useCallback((profile: PackingProfile) => {
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
      const nextStore = bootstrapImportantConfigFromProfiles(current, [profile]);

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
          return savedProfiles.map((entry, index) =>
            index === byName
              ? attachImportantBootstrapToRememberedProfile(
                  { ...normalized, id: entry.id },
                  nextStore,
                )
              : entry,
          );
        }

        return [
          ...savedProfiles,
          attachImportantBootstrapToRememberedProfile(normalized, nextStore),
        ];
      });

      return nextStore;
    });
  }, []);

  const saveImportantItems = useCallback(
    (names: string[]) => saveImportantItemsForProfile(SELF_IMPORTANT_PROFILE_ID, names),
    [saveImportantItemsForProfile],
  );

  const setImportantEnabled = useCallback(
    (enabled: boolean) => setImportantEnabledForProfile(SELF_IMPORTANT_PROFILE_ID, enabled),
    [setImportantEnabledForProfile],
  );

  const requestOpenImportantEditor = useCallback(() => {
    setOpenImportantEditorRequest(true);
  }, []);

  const consumeImportantEditorRequest = useCallback(() => {
    if (!openImportantEditorRequest) {
      return false;
    }

    setOpenImportantEditorRequest(false);
    return true;
  }, [openImportantEditorRequest]);

  const dismissImportantPrompt = useCallback(() => {
    commitImportantStore((current) =>
      setImportantPromptDismissedForProfileStore(current, SELF_IMPORTANT_PROFILE_ID, true),
    );
  }, [commitImportantStore]);

  const resetImportantPromptDismissed = useCallback(() => {
    commitImportantStore((current) =>
      setImportantPromptDismissedForProfileStore(current, SELF_IMPORTANT_PROFILE_ID, false),
    );
  }, [commitImportantStore]);

  const dismissImportantStaleNotice = useCallback((tripId: string, masterVersion: string) => {
    setDismissedImportantMasterVersionByTrip((current) => ({
      ...current,
      [tripId]: masterVersion,
    }));
  }, []);

  const isImportantStaleNoticeDismissed = useCallback(
    (tripId: string, masterVersion: string) =>
      dismissedImportantMasterVersionByTrip[tripId] === masterVersion,
    [dismissedImportantMasterVersionByTrip],
  );

  const value = useMemo<ProfileContextValue>(
    () => ({
      preferences,
      savedTravelers,
      savedPackingProfiles,
      selfImportantProfileId: SELF_IMPORTANT_PROFILE_ID,
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
      saveImportantItems,
      setImportantEnabled,
      dismissImportantPrompt,
      resetImportantPromptDismissed,
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
      dismissImportantStaleNotice,
      enabledImportantItems,
      getEnabledImportantItemsForProfile,
      getImportantItemsForProfile,
      getImportantMasterVersionForProfile,
      importantFeatureActive,
      importantMasterVersion,
      isImportantConfiguredForProfile,
      isImportantEnabledForProfile,
      isImportantFeatureActiveForProfile,
      isImportantStaleNoticeDismissed,
      preferences,
      readImportantConfigForProfile,
      rememberPackingProfile,
      removeImportantItemForProfile,
      requestOpenImportantEditor,
      resetImportantPromptDismissed,
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
