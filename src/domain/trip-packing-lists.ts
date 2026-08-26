import type { PackingItem } from '@/domain/packing-item';
import type { ImportantItem } from '@/domain/important-item';
import type { PackingList } from '@/domain/packing-list';
import type { PackingProfile } from '@/domain/packing-profile';
import { snapshotPackingProfile } from '@/domain/packing-profile';
import type { PackingMode } from '@/domain/trip';
import {
  primaryPackingListId,
  primaryPackingProfileId,
} from '@/domain/trip-compatibility';

function cloneItem(item: PackingItem): PackingItem {
  return { ...item };
}

/** Deterministic PackingList id for a trip + profile pair. Self uses the primary list id. */
export function packingListIdForTripProfile(tripId: string, profile: Pick<PackingProfile, 'id' | 'isSelf'>): string {
  if (profile.isSelf) {
    return primaryPackingListId(tripId);
  }

  const suffix = profile.id.replace(/[^a-zA-Z0-9-]/g, '-');
  return `${tripId}-list-${suffix}`;
}

/** Profile snapshot stored on a new PackingList at trip creation. */
export function resolveAssemblyProfileSnapshot(
  tripId: string,
  profile: PackingProfile,
): ReturnType<typeof snapshotPackingProfile> {
  if (profile.isSelf) {
    return {
      ...snapshotPackingProfile(profile),
      id: primaryPackingProfileId(tripId),
      name: 'Me',
      isSelf: true,
    };
  }

  return snapshotPackingProfile(profile);
}

/** Build one PackingList for a selected profile during trip assembly (MP2B). */
export function buildPackingListForProfile(
  tripId: string,
  profile: PackingProfile,
  packingMode: PackingMode,
  items: PackingItem[],
): PackingList {
  const profileSnapshot = resolveAssemblyProfileSnapshot(tripId, profile);

  return {
    id: packingListIdForTripProfile(tripId, profile),
    packingProfileId: profileSnapshot.id,
    profileSnapshot,
    packingMode,
    items: items.map(cloneItem),
  };
}

/** Preserve first occurrence; draft order with self first is expected from normalizeTripDraft. */
export function uniquePackingProfilesById(profiles: PackingProfile[]): PackingProfile[] {
  const seen = new Set<string>();
  const unique: PackingProfile[] = [];

  for (const profile of profiles) {
    if (seen.has(profile.id)) {
      continue;
    }

    seen.add(profile.id);
    unique.push(profile);
  }

  return unique;
}

export function dedupeInsights(insights: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const insight of insights) {
    if (seen.has(insight)) {
      continue;
    }

    seen.add(insight);
    result.push(insight);
  }

  return result;
}

/**
 * Temporary until MP4: global Important master applies only to the self/Me list.
 * Non-self lists must not inherit the user's Important Items during creation.
 */
export function importantItemsForProfileList(
  profile: PackingProfile,
  importantItems: ImportantItem[] | undefined,
): ImportantItem[] {
  if (!profile.isSelf) {
    return [];
  }

  return importantItems ?? [];
}
