import type { PackingProfile } from '@/domain/packing-profile';
import { SELF_IMPORTANT_PROFILE_ID } from '@/domain/profile-important-items';
import { isPersistablePackingProfileId } from '@/repositories/trips/mappers/supabase-canonical-mapper';

/** Reusable saved profiles for Profile tab — stable ids only, never self or draft-only ids. */
export function listReusableSavedPackingProfiles(
  profiles: readonly PackingProfile[],
): PackingProfile[] {
  return profiles.filter(
    (profile) =>
      !profile.isSelf &&
      profile.id !== SELF_IMPORTANT_PROFILE_ID &&
      isPersistablePackingProfileId(profile.id),
  );
}
