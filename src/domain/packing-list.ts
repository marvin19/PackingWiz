import type { PackingItem } from '@/domain/packing-item';
import type { PackingProfileSnapshot } from '@/domain/packing-profile';
import type { PackingMode } from '@/domain/trip';

/**
 * One person's packing list within a trip.
 *
 * Target shape: a Trip owns one or more PackingLists; items and packingMode
 * live on PackingList. Legacy Trip.items / Trip.packingMode mirrors are kept
 * in sync by normalizeTrip until MP1C migrates providers.
 */
export interface PackingList {
  id: string;
  /** Master PackingProfile this list was created for. */
  packingProfileId: string;
  /**
   * Profile name/age at list creation — survives later edits to the master profile.
   * Required on new lists so Pack/generation can render without loading profile state.
   */
  profileSnapshot: PackingProfileSnapshot;
  packingMode: PackingMode;
  items: PackingItem[];
}
