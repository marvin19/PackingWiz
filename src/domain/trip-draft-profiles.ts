import type { PackingProfile } from '@/domain/packing-profile';
import type { Traveler, TravelerRole } from '@/domain/traveler';
import type { TripDraft } from '@/domain/trip-draft';
import { createUuid } from '@/lib/id';

/** Stable draft-scoped id for the default "Me" profile. */
export const DRAFT_SELF_PROFILE_ID = 'draft-profile-self';

export function createDefaultSelfProfile(): PackingProfile {
  return {
    id: DRAFT_SELF_PROFILE_ID,
    name: 'Me',
    isSelf: true,
  };
}

export function formatPackingProfileLabel(profile: PackingProfile): string {
  if (profile.isSelf) {
    return 'Me';
  }

  if (profile.age !== undefined) {
    return `${profile.name} · ${profile.age} ${profile.age === 1 ? 'year' : 'years'}`;
  }

  return profile.name;
}

export function isValidDraftProfileAge(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) {
    return false;
  }

  if (!/^\d+$/.test(trimmed)) {
    return false;
  }

  const age = Number.parseInt(trimmed, 10);
  return Number.isInteger(age) && age >= 0 && age <= 120;
}

export function parseDraftProfileAge(raw: string): number | null {
  if (!isValidDraftProfileAge(raw)) {
    return null;
  }

  return Number.parseInt(raw.trim(), 10);
}

function findExplicitSelfTraveler(travelers: Traveler[]): Traveler | undefined {
  return travelers.find((traveler) => traveler.id === 't-you' || traveler.name === 'You');
}

function travelerRoleFromAge(age?: number): TravelerRole {
  if (age !== undefined && age < 18) {
    return 'Child';
  }

  return 'Adult';
}

/** Maps a draft packing profile to a legacy traveler row for bags/assembly compatibility. */
export function profileToTraveler(profile: PackingProfile): Traveler {
  if (profile.isSelf) {
    return {
      id: 't-you',
      name: 'You',
      role: 'Adult',
      age: profile.age,
      birthDate: profile.birthDate,
    };
  }

  return {
    id: profile.id,
    name: profile.name,
    role: travelerRoleFromAge(profile.age),
    age: profile.age,
    birthDate: profile.birthDate,
  };
}

export function profilesToTravelers(profiles: PackingProfile[]): Traveler[] {
  return profiles.map(profileToTraveler);
}

/**
 * Legacy ingress: map travelers[] to packing profiles without guessing self from order.
 * Only explicit self traveler (`t-you` / "You") becomes Me; otherwise default Me is added.
 */
export function travelersToProfiles(travelers: Traveler[]): PackingProfile[] {
  const selfTraveler = findExplicitSelfTraveler(travelers);
  const profiles: PackingProfile[] = [selfTraveler ? selfProfileFromTraveler(selfTraveler) : createDefaultSelfProfile()];

  for (const traveler of travelers) {
    if (traveler === selfTraveler) {
      continue;
    }

    profiles.push({
      id: traveler.id.startsWith('t-') ? traveler.id.replace(/^t-/, 'draft-profile-') : traveler.id,
      name: traveler.name,
      age: traveler.age,
      birthDate: traveler.birthDate,
      isSelf: false,
    });
  }

  return profiles;
}

function selfProfileFromTraveler(traveler: Traveler): PackingProfile {
  return {
    id: DRAFT_SELF_PROFILE_ID,
    name: 'Me',
    isSelf: true,
    age: traveler.age,
    birthDate: traveler.birthDate,
  };
}

/** Ensures exactly one self profile and keeps the legacy travelers mirror in sync. */
export function ensureSelfProfile(profiles: PackingProfile[]): PackingProfile[] {
  const nonSelf = profiles.filter((profile) => !profile.isSelf);
  const self = profiles.find((profile) => profile.isSelf) ?? createDefaultSelfProfile();

  return [{ ...self, isSelf: true, name: 'Me', id: DRAFT_SELF_PROFILE_ID }, ...nonSelf];
}

export function hasDuplicateDraftProfileName(
  profiles: PackingProfile[],
  name: string,
  excludeProfileId?: string,
): boolean {
  const key = name.trim().toLowerCase();
  if (!key) {
    return true;
  }

  return profiles.some((profile) => {
    if (excludeProfileId && profile.id === excludeProfileId) {
      return false;
    }

    if (profile.isSelf && key === 'me') {
      return true;
    }

    return profile.name.trim().toLowerCase() === key;
  });
}

export function createDraftProfile(
  name: string,
  age: number,
  rememberForFutureTrips = false,
): PackingProfile {
  return {
    id: `draft-profile-${createUuid()}`,
    name: name.trim(),
    age,
    isSelf: false,
    rememberForFutureTrips,
  };
}

/** Stable-id profile for session reuse (ProfileProvider). */
export function createReusablePackingProfile(id: string, name: string, age: number): PackingProfile {
  return {
    id,
    name: name.trim(),
    age,
    isSelf: false,
  };
}

export function isProfileSelectedInDraft(
  draftProfiles: PackingProfile[],
  profileId: string,
): boolean {
  return draftProfiles.some((profile) => profile.id === profileId);
}

/** Saved profiles not already selected on the current draft (excludes self). */
export function availableSavedPackingProfiles(
  savedProfiles: PackingProfile[],
  draftProfiles: PackingProfile[],
): PackingProfile[] {
  return savedProfiles.filter(
    (profile) => !profile.isSelf && !isProfileSelectedInDraft(draftProfiles, profile.id),
  );
}

export function patchDraftPackingProfiles(
  draft: TripDraft,
  packingProfiles: PackingProfile[],
): Pick<TripDraft, 'packingProfiles' | 'travelers'> {
  const normalizedProfiles = ensureSelfProfile(packingProfiles);

  return {
    packingProfiles: normalizedProfiles,
    travelers: profilesToTravelers(normalizedProfiles),
  };
}

/**
 * Normalize draft shape for wizard/runtime use.
 * packingProfiles is canonical; travelers[] is a compatibility mirror for bags/assembly.
 */
export function normalizeTripDraft(draft: TripDraft): TripDraft {
  const packingProfiles =
    draft.packingProfiles && draft.packingProfiles.length > 0
      ? ensureSelfProfile(draft.packingProfiles)
      : travelersToProfiles(draft.travelers);

  return {
    ...draft,
    packingProfiles,
    travelers: profilesToTravelers(packingProfiles),
  };
}

export function getPackingForSummaryLabel(profiles: PackingProfile[]): string {
  const labels = profiles.map((profile) => (profile.isSelf ? 'Me' : profile.name));

  if (labels.length <= 3) {
    return labels.join(', ');
  }

  return `${labels.length} people`;
}
