import { DRAFT_SELF_PROFILE_ID } from '@/domain/trip-draft-profiles';
import type { ImportantItem } from '@/domain/important-item';
import {
  cloneImportantItemsConfig,
  defaultImportantItemsConfig,
  type ImportantItemsConfig,
} from '@/domain/important-items-config';
import { dedupeImportantItemNames } from '@/domain/important-items-preferences';
import type { PackingItem } from '@/domain/packing-item';
import type { PackingProfile } from '@/domain/packing-profile';

/** Canonical session id for the user's self/Me Important master (not trip-scoped). */
export const SELF_IMPORTANT_PROFILE_ID = 'profile-self';

export type ImportantItemsByProfileId = Record<string, ImportantItemsConfig>;

/** @deprecated Legacy global preferences shape — migrated to self profile on read. */
export type LegacyImportantItemsPreferences = ImportantItemsConfig;

export function resolveImportantProfileId(
  profile: Pick<PackingProfile, 'id' | 'isSelf'>,
): string {
  if (profile.isSelf) {
    return SELF_IMPORTANT_PROFILE_ID;
  }

  return profile.id;
}

/** Map draft/trip-scoped self ids onto the canonical self Important profile id. */
export function normalizeImportantProfileId(profileId: string): string {
  if (profileId === DRAFT_SELF_PROFILE_ID || profileId.endsWith('-profile-self')) {
    return SELF_IMPORTANT_PROFILE_ID;
  }

  return profileId;
}

export function getImportantConfigForProfile(
  store: ImportantItemsByProfileId,
  profileId: string,
): ImportantItemsConfig {
  const normalizedId = normalizeImportantProfileId(profileId);
  const config = store[normalizedId];

  if (!config) {
    return cloneImportantItemsConfig(defaultImportantItemsConfig);
  }

  return cloneImportantItemsConfig(config);
}

export function setImportantConfigForProfile(
  store: ImportantItemsByProfileId,
  profileId: string,
  config: ImportantItemsConfig,
): ImportantItemsByProfileId {
  const normalizedId = normalizeImportantProfileId(profileId);

  return {
    ...store,
    [normalizedId]: cloneImportantItemsConfig(config),
  };
}

export function migrateLegacyImportantPreferences(
  legacy: LegacyImportantItemsPreferences,
): ImportantItemsByProfileId {
  if (legacy.items.length === 0 && !legacy.isConfigured) {
    return {};
  }

  return {
    [SELF_IMPORTANT_PROFILE_ID]: cloneImportantItemsConfig({
      items: legacy.items.map((item) => ({ ...item })),
      isConfigured: legacy.isConfigured,
      isEnabled: legacy.isEnabled,
      promptDismissed: legacy.promptDismissed,
      updatedAt: legacy.updatedAt,
    }),
  };
}

export function hasCanonicalImportantConfig(
  store: ImportantItemsByProfileId,
  profileId: string,
): boolean {
  const normalizedId = normalizeImportantProfileId(profileId);
  return Object.prototype.hasOwnProperty.call(store, normalizedId);
}

/**
 * Seed canonical Important master from remembered-profile bootstrap snapshots.
 * Precedence: bootstrap may populate a missing canonical entry only — never overwrite
 * an existing canonical entry (including after runtime edits).
 */
export function bootstrapImportantConfigFromProfiles(
  store: ImportantItemsByProfileId,
  profiles: PackingProfile[],
): ImportantItemsByProfileId {
  let next = store;

  for (const profile of profiles) {
    const bootstrap = profile.importantItemsBootstrap;
    if (!bootstrap) {
      continue;
    }

    const profileId = resolveImportantProfileId(profile);
    if (hasCanonicalImportantConfig(next, profileId)) {
      continue;
    }

    next = setImportantConfigForProfile(next, profileId, bootstrap);
  }

  return next;
}

/** @deprecated Use bootstrapImportantConfigFromProfiles */
export function mergeImportantConfigFromProfiles(
  store: ImportantItemsByProfileId,
  profiles: PackingProfile[],
): ImportantItemsByProfileId {
  return bootstrapImportantConfigFromProfiles(store, profiles);
}

/** Read-only bootstrap snapshot exported from canonical store for session/mock persistence. */
export function buildImportantItemsBootstrap(
  store: ImportantItemsByProfileId,
  profile: Pick<PackingProfile, 'id' | 'isSelf'>,
): ImportantItemsConfig | undefined {
  const config = getImportantConfigForProfile(store, resolveImportantProfileId(profile));

  if (!config.isConfigured) {
    return undefined;
  }

  return cloneImportantItemsConfig(config);
}

/** Attach canonical-derived bootstrap to a remembered profile; strips any incoming bootstrap first. */
export function attachImportantBootstrapToRememberedProfile(
  profile: PackingProfile,
  store: ImportantItemsByProfileId,
): PackingProfile {
  const { importantItemsBootstrap: _ignored, ...rest } = profile;
  const bootstrap = buildImportantItemsBootstrap(store, rest);

  if (!bootstrap) {
    return rest;
  }

  return {
    ...rest,
    importantItemsBootstrap: bootstrap,
  };
}

/** Re-process a remembered profile without letting stale bootstrap revert canonical state. */
export function reconcileRememberedProfileImportantBootstrap(
  store: ImportantItemsByProfileId,
  profile: PackingProfile,
): ImportantItemsByProfileId {
  return bootstrapImportantConfigFromProfiles(store, [profile]);
}

export function refreshRememberedProfileBootstraps(
  profiles: PackingProfile[],
  store: ImportantItemsByProfileId,
): PackingProfile[] {
  return profiles.map((profile) => attachImportantBootstrapToRememberedProfile(profile, store));
}

export function saveImportantItemNamesForProfile(
  store: ImportantItemsByProfileId,
  profileId: string,
  names: string[],
  createId: () => string,
): { store: ImportantItemsByProfileId; savedItems: ImportantItem[] } {
  const normalizedId = normalizeImportantProfileId(profileId);
  const current = getImportantConfigForProfile(store, normalizedId);
  const uniqueNames = dedupeImportantItemNames(names);
  const existingByName = new Map(
    current.items.map((item) => [item.name.trim().toLowerCase(), item]),
  );

  const savedItems = uniqueNames.map((name) => {
    const existing = existingByName.get(name.toLowerCase());
    if (existing) {
      return { ...existing, name, enabled: true };
    }

    return {
      id: createId(),
      name,
      quantity: 1,
      enabled: true,
    };
  });

  const nextConfig: ImportantItemsConfig = {
    items: savedItems,
    isConfigured: true,
    isEnabled: current.isConfigured ? current.isEnabled : true,
    promptDismissed: current.promptDismissed,
    updatedAt: new Date().toISOString(),
  };

  return {
    store: setImportantConfigForProfile(store, normalizedId, nextConfig),
    savedItems,
  };
}

export function setImportantEnabledForProfileStore(
  store: ImportantItemsByProfileId,
  profileId: string,
  enabled: boolean,
): ImportantItemsByProfileId {
  const normalizedId = normalizeImportantProfileId(profileId);
  const current = getImportantConfigForProfile(store, normalizedId);

  if (!current.isConfigured) {
    return store;
  }

  return setImportantConfigForProfile(store, normalizedId, {
    ...current,
    isEnabled: enabled,
  });
}

export function addImportantItemForProfileStore(
  store: ImportantItemsByProfileId,
  profileId: string,
  name: string,
  createId: () => string,
): { store: ImportantItemsByProfileId; item: ImportantItem | null } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { store, item: null };
  }

  const normalizedId = normalizeImportantProfileId(profileId);
  const current = getImportantConfigForProfile(store, normalizedId);
  const duplicate = current.items.some(
    (item) => item.name.trim().toLowerCase() === trimmed.toLowerCase(),
  );

  if (duplicate) {
    return { store, item: null };
  }

  const item: ImportantItem = {
    id: createId(),
    name: trimmed,
    quantity: 1,
    enabled: true,
  };

  const nextConfig: ImportantItemsConfig = {
    ...current,
    items: [...current.items, item],
    isConfigured: true,
    isEnabled: current.isConfigured ? current.isEnabled : true,
    updatedAt: new Date().toISOString(),
  };

  return {
    store: setImportantConfigForProfile(store, normalizedId, nextConfig),
    item,
  };
}

export function updateImportantItemForProfileStore(
  store: ImportantItemsByProfileId,
  profileId: string,
  itemId: string,
  patch: Partial<Pick<ImportantItem, 'name' | 'enabled' | 'quantity'>>,
): ImportantItemsByProfileId {
  const normalizedId = normalizeImportantProfileId(profileId);
  const current = getImportantConfigForProfile(store, normalizedId);
  const index = current.items.findIndex((item) => item.id === itemId);

  if (index < 0) {
    return store;
  }

  const existing = current.items[index];
  const nextName = patch.name !== undefined ? patch.name.trim() : existing.name;
  if (!nextName) {
    return store;
  }

  const nextItems = current.items.map((item, itemIndex) =>
    itemIndex === index
      ? {
          ...item,
          ...patch,
          name: nextName,
        }
      : item,
  );

  return setImportantConfigForProfile(store, normalizedId, {
    ...current,
    items: nextItems,
    updatedAt: new Date().toISOString(),
  });
}

export function removeImportantItemForProfileStore(
  store: ImportantItemsByProfileId,
  profileId: string,
  itemId: string,
): ImportantItemsByProfileId {
  const normalizedId = normalizeImportantProfileId(profileId);
  const current = getImportantConfigForProfile(store, normalizedId);

  return setImportantConfigForProfile(store, normalizedId, {
    ...current,
    items: current.items.filter((item) => item.id !== itemId),
    updatedAt: new Date().toISOString(),
  });
}

export function setImportantPromptDismissedForProfileStore(
  store: ImportantItemsByProfileId,
  profileId: string,
  dismissed: boolean,
): ImportantItemsByProfileId {
  const normalizedId = normalizeImportantProfileId(profileId);
  const current = getImportantConfigForProfile(store, normalizedId);

  return setImportantConfigForProfile(store, normalizedId, {
    ...current,
    promptDismissed: dismissed,
  });
}

/** Profile master edits must not mutate existing packing list snapshots (MP4A contract). */
export function packingListItemsUnchanged(
  before: PackingItem[],
  after: PackingItem[],
): boolean {
  if (before.length !== after.length) {
    return false;
  }

  return before.every((item, index) => {
    const next = after[index];
    return (
      item.id === next.id &&
      item.name === next.name &&
      item.quantity === next.quantity &&
      item.category === next.category &&
      item.packed === next.packed &&
      item.needToBuy === next.needToBuy &&
      item.assignedTo === next.assignedTo &&
      item.source === next.source &&
      item.importantItemId === next.importantItemId
    );
  });
}
