import type { PackingItem } from '@/domain/packing-item';
import type { PackingList } from '@/domain/packing-list';
import type { PackingProfile, PackingProfileSnapshot } from '@/domain/packing-profile';
import type { Trip } from '@/domain/trip';
import { isCompatibilityPrimaryList } from '@/domain/trip-compatibility';

/**
 * MP6-A canonical application contract.
 *
 * New feature/domain code should treat `Trip.packingLists[]` as authoritative for
 * people and packing content. Legacy mirrors on `Trip` (`items`, `packingMode`,
 * `generated`, `travelers[]`) exist only for persistence compatibility until MP6-B.
 */

export type TripCanonicalContract = {
  /** Shared journey container — not a packing-list owner. */
  trip: 'destination' | 'dates' | 'tripContext' | 'accommodation' | 'laundry' | 'bags' | 'note' | 'weather' | 'insights';
  /** One list per person on the trip; owns items and packingMode. */
  packingList: 'packingProfileId' | 'profileSnapshot' | 'packingMode' | 'items';
  /** Reusable person identity outside a trip. */
  packingProfile: 'id' | 'name' | 'age' | 'birthDate' | 'isSelf';
  /** Immutable person context copied onto a list at creation. */
  profileSnapshot: 'id' | 'name' | 'age' | 'birthDate' | 'isSelf';
  /** Unfinished wizard aggregate — never a committed Trip status. */
  draft: 'StoredTripDraft';
};

/** True when trip input still uses flat/single-list compatibility ingress. */
export function isLegacyTripIngress(trip: {
  id: string;
  packingLists?: PackingList[];
}): boolean {
  if (!trip.packingLists || trip.packingLists.length === 0) {
    return true;
  }

  if (trip.packingLists.length === 1) {
    return isCompatibilityPrimaryList(trip.id, trip.packingLists[0]);
  }

  return false;
}

/** True when the trip already uses nested canonical packing lists. */
export function isCanonicalTripShape(trip: Trip): boolean {
  return trip.packingLists.length > 0 && !isLegacyTripIngress(trip);
}

/** Canonical people on a committed trip come from list snapshots, not travelers[]. */
export function packingProfileSnapshotsFromTrip(trip: Trip): PackingProfileSnapshot[] {
  return trip.packingLists.map((list) => list.profileSnapshot);
}

/** All packing items across every list — use instead of deprecated Trip.items reads. */
export function allTripPackingItems(trip: Trip): PackingItem[] {
  return trip.packingLists.flatMap((list) => list.items);
}

/** Count packed items across all lists (Profile stats, dashboards). */
export function countAllPackedItems(trip: Trip): number {
  return allTripPackingItems(trip).filter((item) => item.packed).length;
}

/**
 * List-specific mutations require an explicit packing list id when the trip has
 * more than one list. Single-list trips may auto-resolve to the sole list.
 */
export function resolveExplicitPackingListId(
  trip: Trip,
  packingListId: string | null | undefined,
): string {
  if (trip.packingLists.length === 0) {
    throw new Error('Trip has no packing lists');
  }

  if (trip.packingLists.length === 1) {
    return trip.packingLists[0].id;
  }

  if (!packingListId) {
    throw new Error('Explicit packing list selection required for multi-list trips');
  }

  const match = trip.packingLists.find((list) => list.id === packingListId);
  if (!match) {
    throw new Error(`Packing list not found: ${packingListId}`);
  }

  return packingListId;
}

/** Mixed per-list packing modes must survive normalization and clone paths. */
export function tripHasMixedPackingModes(trip: Trip): boolean {
  if (trip.packingLists.length <= 1) {
    return false;
  }

  const modes = new Set(trip.packingLists.map((list) => list.packingMode));
  return modes.size > 1;
}

/** Stable identity key for profile dedupe — not for ordinary list ownership. */
export function profileIdentityKey(profile: Pick<PackingProfile, 'id' | 'isSelf'>): string {
  return profile.isSelf ? 'self' : profile.id;
}

export function isDraftProfileId(profileId: string): boolean {
  return profileId.startsWith('draft-profile-');
}

/** Canonical reusable self Important/profile id (session store). */
export { SELF_IMPORTANT_PROFILE_ID } from '@/domain/profile-important-items';

/**
 * Item-level assignedTo is transitional metadata for single-list traveller chips.
 * Multi-list ownership is determined by which PackingList contains the item.
 */
export function supportsLegacyItemAssignment(trip: Trip): boolean {
  return trip.packingLists.length <= 1;
}
