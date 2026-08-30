/**
 * A person the user packs for across trips.
 *
 * Profiles are reusable master data (e.g. Anna, Emilie, or the user's own "Me"
 * profile when `isSelf` is true). Important Items master data is profile-scoped (MP4A).
 */
import type { ImportantItemsConfig } from '@/domain/important-items-config';

export interface PackingProfile {
  id: string;
  name: string;
  /**
   * Whole years when known. Optional when age has not been captured.
   * Aligns with Traveler.age for wizard → profile migration.
   */
  age?: number;
  /**
   * ISO yyyy-mm-dd when known. When set, age can be derived from birthDate
   * instead of storing a static age. Aligns with Traveler.birthDate.
   */
  birthDate?: string;
  /** True when this profile represents the authenticated or anonymous user ("Me"). */
  isSelf: boolean;
  /** When true, persist as a reusable saved profile at trip creation commit — not before. */
  rememberForFutureTrips?: boolean;
  /**
   * Read-only bootstrap snapshot for session/mock persistence of Important master.
   * Canonical runtime master lives in ProfileProvider.importantByProfileId (MP4A).
   * Never mutate this field directly — export from canonical store only.
   */
  importantItemsBootstrap?: ImportantItemsConfig;
}

/**
 * Minimal profile fields copied onto a PackingList at creation time.
 * Preserves the person context used for that list if the master profile later changes.
 */
export type PackingProfileSnapshot = Pick<
  PackingProfile,
  'id' | 'name' | 'age' | 'birthDate' | 'isSelf'
>;

export function snapshotPackingProfile(profile: PackingProfile): PackingProfileSnapshot {
  return {
    id: profile.id,
    name: profile.name,
    age: profile.age,
    birthDate: profile.birthDate,
    isSelf: profile.isSelf,
  };
}
