import type { ImportantItemsConfig } from '@/domain/important-items-config';
import type { ImportantItemsByProfileId } from '@/domain/profile-important-items';
import type { PackingProfile } from '@/domain/packing-profile';

export interface PackingProfileRepository {
  loadAll(): Promise<{
    profiles: PackingProfile[];
    importantByProfileId: ImportantItemsByProfileId;
  }>;
  saveProfile(profile: PackingProfile): Promise<PackingProfile>;
  saveImportantMaster(profileId: string, config: ImportantItemsConfig): Promise<void>;
  deleteProfile(profileId: string): Promise<void>;
}
