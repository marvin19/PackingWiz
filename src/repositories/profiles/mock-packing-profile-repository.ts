import type { ImportantItemsConfig } from '@/domain/important-items-config';
import {
  bootstrapImportantConfigFromProfiles,
  type ImportantItemsByProfileId,
} from '@/domain/profile-important-items';
import type { PackingProfile } from '@/domain/packing-profile';
import { mockSavedPackingProfiles } from '@/mocks/saved-packing-profiles';

import type { PackingProfileRepository } from '@/repositories/profiles/packing-profile-repository';

/** Session-only profile store — default when mock persistence is active. */
export class MockPackingProfileRepository implements PackingProfileRepository {
  private profiles: PackingProfile[];
  private importantByProfileId: ImportantItemsByProfileId;

  constructor(
    initialProfiles: PackingProfile[] = mockSavedPackingProfiles.map((profile) => ({ ...profile })),
    initialImportant: ImportantItemsByProfileId = bootstrapImportantConfigFromProfiles(
      {},
      initialProfiles,
    ),
  ) {
    this.profiles = initialProfiles.map((profile) => ({ ...profile }));
    this.importantByProfileId = { ...initialImportant };
  }

  async loadAll(): Promise<{
    profiles: PackingProfile[];
    importantByProfileId: ImportantItemsByProfileId;
  }> {
    return {
      profiles: this.profiles.map((profile) => ({ ...profile })),
      importantByProfileId: { ...this.importantByProfileId },
    };
  }

  async saveProfile(profile: PackingProfile): Promise<PackingProfile> {
    const normalized = { ...profile, rememberForFutureTrips: undefined };
    const index = this.profiles.findIndex((entry) => entry.id === normalized.id);

    if (index >= 0) {
      this.profiles[index] = normalized;
    } else {
      this.profiles.push(normalized);
    }

    return { ...normalized };
  }

  async saveImportantMaster(profileId: string, config: ImportantItemsConfig): Promise<void> {
    this.importantByProfileId = {
      ...this.importantByProfileId,
      [profileId]: {
        ...config,
        items: config.items.map((item) => ({ ...item })),
      },
    };
  }

  async deleteProfile(profileId: string): Promise<void> {
    this.profiles = this.profiles.filter((profile) => profile.id !== profileId);
    const next = { ...this.importantByProfileId };
    delete next[profileId];
    this.importantByProfileId = next;
  }
}

export const mockPackingProfileRepository = new MockPackingProfileRepository();
