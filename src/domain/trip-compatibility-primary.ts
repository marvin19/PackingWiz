import type { PackingList } from '@/domain/packing-list';

/** Deterministic primary list id for the single-list compatibility migration. */
export function primaryPackingListId(tripId: string): string {
  return `${tripId}-list-primary`;
}

/** Deterministic synthetic self profile id for the single-list compatibility migration. */
export function primaryPackingProfileId(tripId: string): string {
  return `${tripId}-profile-self`;
}

/** True when a list is the temporary MP1 deterministic compatibility primary list. */
export function isCompatibilityPrimaryList(tripId: string, list: Pick<PackingList, 'id'>): boolean {
  return list.id === primaryPackingListId(tripId);
}
