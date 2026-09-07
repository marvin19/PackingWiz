import type { PackingList } from '@/domain/packing-list';
import type { Trip } from '@/domain/trip';
import {
  formatPackingListProfileName,
  formatPackingListProfileSubtitle,
  formatTripPeopleCount,
  getTripPackingPeopleCount,
} from '@/domain/packing-list-labels';
import { packingStatsForList } from '@/domain/packing-stats';

export {
  formatPackingListProfileName,
  formatPackingListProfileSubtitle,
  formatTripPeopleCount,
  getTripPackingPeopleCount,
} from '@/domain/packing-list-labels';

/** Compact progress label for picker rows. */
export function formatPackingListProgress(trip: Trip, listId: string): string {
  const { packed, total } = packingStatsForList(trip, listId);
  return `${packed} / ${total} packed`;
}

export function formatPackingListPickerLabel(trip: Trip, list: PackingList): string {
  const name = formatPackingListProfileName(list.profileSnapshot);
  const progress = formatPackingListProgress(trip, list.id);
  return `${name}, ${progress}`;
}
