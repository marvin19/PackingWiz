import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { ImportantItem } from '@/domain/important-item';
import type { PackingProfile } from '@/domain/packing-profile';
import { buildImportantMasterVersion } from '@/domain/important-snapshot';
import {
  dedupeImportantItemNames,
  defaultImportantItemsPreferences,
  importantItemsForNewTrips,
  isImportantFeatureActive,
  type ImportantItemsPreferences,
} from '@/domain/important-items-preferences';
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
  importantItems: ImportantItem[];
  enabledImportantItems: ImportantItem[];
  isImportantConfigured: boolean;
  isImportantEnabled: boolean;
  isImportantFeatureActive: boolean;
  importantPromptDismissed: boolean;
  importantMasterVersion: string;
  importantUpdatedAt?: string;
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
  const [savedPackingProfiles, setSavedPackingProfiles] =
    useState<PackingProfile[]>(mockSavedPackingProfiles);
  const [importantItemsState, setImportantItemsState] = useState<ImportantItemsPreferences>(
    defaultImportantItemsPreferences,
  );
  const [openImportantEditorRequest, setOpenImportantEditorRequest] = useState(false);
  const [dismissedImportantMasterVersionByTrip, setDismissedImportantMasterVersionByTrip] =
    useState<Record<string, string>>({});

  const enabledImportantItems = useMemo(
    () => importantItemsForNewTrips(importantItemsState),
    [importantItemsState],
  );

  const importantFeatureActive = useMemo(
    () => isImportantFeatureActive(importantItemsState),
    [importantItemsState],
  );

  const importantMasterVersion = useMemo(
    () => buildImportantMasterVersion(importantItemsState),
    [importantItemsState],
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

    const normalized: PackingProfile = {
      ...profile,
      isSelf: false,
      name: profile.name.trim(),
    };

    setSavedPackingProfiles((current) => {
      const byId = current.findIndex((entry) => entry.id === normalized.id);
      if (byId >= 0) {
        return current.map((entry, index) => (index === byId ? normalized : entry));
      }

      const nameKey = normalized.name.toLowerCase();
      const byName = current.findIndex((entry) => entry.name.trim().toLowerCase() === nameKey);
      if (byName >= 0) {
        return current.map((entry, index) => (index === byName ? { ...normalized, id: entry.id } : entry));
      }

      return [...current, normalized];
    });
  }, []);

  const saveImportantItems = useCallback((names: string[]) => {
    const uniqueNames = dedupeImportantItemNames(names);
    let savedItems: ImportantItem[] = [];

    setImportantItemsState((current) => {
      const existingByName = new Map(
        current.items.map((item) => [item.name.trim().toLowerCase(), item]),
      );

      savedItems = uniqueNames.map((name) => {
        const existing = existingByName.get(name.toLowerCase());
        if (existing) {
          return { ...existing, name, enabled: true };
        }

        return {
          id: createUuid(),
          name,
          quantity: 1,
          enabled: true,
        };
      });

      return {
        items: savedItems,
        isConfigured: true,
        isEnabled: current.isConfigured ? current.isEnabled : true,
        promptDismissed: current.promptDismissed,
        updatedAt: new Date().toISOString(),
      };
    });

    return savedItems;
  }, []);

  const setImportantEnabled = useCallback((enabled: boolean) => {
    setImportantItemsState((current) => {
      if (!current.isConfigured) {
        return current;
      }

      return {
        ...current,
        isEnabled: enabled,
      };
    });
  }, []);

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
    setImportantItemsState((current) => ({
      ...current,
      promptDismissed: true,
    }));
  }, []);

  const resetImportantPromptDismissed = useCallback(() => {
    setImportantItemsState((current) => ({
      ...current,
      promptDismissed: false,
    }));
  }, []);

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
      importantItems: importantItemsState.items,
      enabledImportantItems,
      isImportantConfigured: importantItemsState.isConfigured,
      isImportantEnabled: importantItemsState.isEnabled,
      isImportantFeatureActive: importantFeatureActive,
      importantPromptDismissed: importantItemsState.promptDismissed,
      importantMasterVersion,
      importantUpdatedAt: importantItemsState.updatedAt,
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
      addSavedTraveler,
      consumeImportantEditorRequest,
      dismissImportantPrompt,
      dismissImportantStaleNotice,
      enabledImportantItems,
      importantFeatureActive,
      importantItemsState.isConfigured,
      importantItemsState.isEnabled,
      importantItemsState.items,
      importantItemsState.promptDismissed,
      importantItemsState.updatedAt,
      importantMasterVersion,
      isImportantStaleNoticeDismissed,
      preferences,
      requestOpenImportantEditor,
      rememberPackingProfile,
      resetImportantPromptDismissed,
      saveImportantItems,
      savedPackingProfiles,
      savedTravelers,
      setImportantEnabled,
      setPreference,
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
