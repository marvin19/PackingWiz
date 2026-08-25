import type { PackingItem } from '@/domain/packing-item';
import type { PackingList } from '@/domain/packing-list';
import type { PackingProfileSnapshot } from '@/domain/packing-profile';
import type { PackingMode } from '@/domain/trip';
import {
  primaryPackingListId,
  primaryPackingProfileId,
} from '@/domain/trip-compatibility';

/** Intentional self snapshot for seed trips — not inferred from traveler ordering. */
export function createSeedSelfProfileSnapshot(tripId: string): PackingProfileSnapshot {
  return {
    id: primaryPackingProfileId(tripId),
    name: 'Me',
    isSelf: true,
  };
}

/** Explicit primary PackingList for seed/mock trips. */
export function createSeedPrimaryPackingList(
  tripId: string,
  items: PackingItem[],
  packingMode: PackingMode,
): PackingList {
  const profileSnapshot = createSeedSelfProfileSnapshot(tripId);

  return {
    id: primaryPackingListId(tripId),
    packingProfileId: profileSnapshot.id,
    profileSnapshot,
    packingMode,
    items,
  };
}
