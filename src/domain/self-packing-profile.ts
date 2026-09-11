import type { PackingProfile } from '@/domain/packing-profile';
import { SELF_IMPORTANT_PROFILE_ID } from '@/domain/profile-important-items';

/** Stable session self PackingProfile — not draft-scoped. */
export function createCanonicalSelfPackingProfile(): PackingProfile {
  return {
    id: SELF_IMPORTANT_PROFILE_ID,
    name: 'Me',
    isSelf: true,
  };
}

export function selfPackingProfileInitials(
  profile: Pick<PackingProfile, 'isSelf' | 'name'>,
): string {
  return profile.isSelf ? 'M' : profile.name.trim().charAt(0).toUpperCase() || '?';
}

/** Secondary identity line for Profile — neutral, not account metadata. */
export function formatSelfPackingProfileIdentityHint(
  profile: Pick<PackingProfile, 'isSelf' | 'age'>,
): string {
  if (profile.age !== undefined) {
    return `${profile.age} ${profile.age === 1 ? 'year' : 'years'}`;
  }

  return 'Your packing profile';
}
