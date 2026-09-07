import type { ImportantItemsConfig } from '@/domain/important-items-config';
import {
  migrateImportantProfileStoreKey,
  type ImportantItemsByProfileId,
} from '@/domain/profile-important-items';
import type { PackingProfile } from '@/domain/packing-profile';
import { createUuid } from '@/lib/id';
import { isPersistablePackingProfileId } from '@/repositories/trips/mappers/supabase-canonical-mapper';

/** Stable reusable PackingProfile id for Supabase persistence (never draft-profile-*). */
export function createPersistablePackingProfileId(): string {
  return `profile-${createUuid()}`;
}

function normalizeRememberedProfileFields(profile: PackingProfile): PackingProfile {
  const { importantItemsBootstrap: _ignored, rememberForFutureTrips: _remember, ...rest } =
    profile;

  return {
    ...rest,
    isSelf: false,
    name: profile.name.trim(),
  };
}

/**
 * Resolve a trip/draft profile to a stable persistable PackingProfile id.
 * Matches existing saved profiles by id, then by case-insensitive name.
 * Draft-only ids receive a new profile-* id.
 */
export function resolveRememberedPackingProfileForPersistence(
  profile: PackingProfile,
  savedProfiles: PackingProfile[],
): PackingProfile {
  if (profile.isSelf) {
    throw new Error('Self profile cannot be remembered');
  }

  const normalized = normalizeRememberedProfileFields(profile);

  if (isPersistablePackingProfileId(normalized.id)) {
    return normalized;
  }

  const nameKey = normalized.name.toLowerCase();
  const byName = savedProfiles.find(
    (entry) =>
      !entry.isSelf &&
      isPersistablePackingProfileId(entry.id) &&
      entry.name.trim().toLowerCase() === nameKey,
  );

  if (byName) {
    return {
      ...normalized,
      id: byName.id,
      age: normalized.age ?? byName.age,
      birthDate: normalized.birthDate ?? byName.birthDate,
    };
  }

  return {
    ...normalized,
    id: createPersistablePackingProfileId(),
  };
}

/** Trip commit should upsert profiles explicitly remembered or already persistable. */
export function shouldPersistRememberedTripProfile(profile: PackingProfile): boolean {
  return !profile.isSelf && (Boolean(profile.rememberForFutureTrips) || isPersistablePackingProfileId(profile.id));
}

export function mergeSavedPackingProfiles(
  localProfiles: PackingProfile[],
  remoteProfiles: PackingProfile[],
): PackingProfile[] {
  const merged = new Map<string, PackingProfile>();

  for (const profile of remoteProfiles) {
    if (!profile.isSelf) {
      merged.set(profile.id, profile);
    }
  }

  for (const profile of localProfiles) {
    if (!profile.isSelf && !merged.has(profile.id)) {
      merged.set(profile.id, profile);
    }
  }

  return [...merged.values()];
}

export function resolveImportantConfigForPersistedProfile(
  store: ImportantItemsByProfileId,
  sourceProfileId: string,
  resolvedProfileId: string,
): ImportantItemsByProfileId {
  if (sourceProfileId === resolvedProfileId) {
    return store;
  }

  return migrateImportantProfileStoreKey(store, sourceProfileId, resolvedProfileId);
}

export function pickImportantConfigForProfilePersist(
  store: ImportantItemsByProfileId,
  sourceProfileId: string,
  resolvedProfileId: string,
): ImportantItemsConfig | undefined {
  return (
    store[sourceProfileId] ??
    store[resolvedProfileId]
  );
}
