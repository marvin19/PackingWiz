import type { PackingList } from '@/domain/packing-list';
import type { PackingProfile } from '@/domain/packing-profile';
import type { Trip } from '@/domain/trip';

export type ReuseNewTravellerEntry = {
  id: string;
  profile: PackingProfile;
  packingMode: 'generated' | 'manual';
};

export type ReuseTripFormSelection = {
  selectedPackingListIds: string[];
  newTravellers: ReuseNewTravellerEntry[];
};

export function listsForSelectedIds(
  sourceTrip: Trip,
  selectedPackingListIds: string[],
): PackingList[] {
  const idSet = new Set(selectedPackingListIds);
  return sourceTrip.packingLists.filter((list) => idSet.has(list.id));
}

export function countReuseResultingLists(
  form: Pick<ReuseTripFormSelection, 'selectedPackingListIds' | 'newTravellers'>,
): number {
  return form.selectedPackingListIds.length + form.newTravellers.length;
}
