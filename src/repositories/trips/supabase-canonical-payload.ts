import { insightPersistContent } from '@/domain/insight';
import { getDestinationCountryLabel, getDestinationLabel } from '@/domain/destination';
import type { PackingList } from '@/domain/packing-list';
import type { Traveler, TravelerRole } from '@/domain/traveler';
import type { Trip } from '@/domain/trip';
import {
  normalizeCanonicalTrip,
  resolveCompatibilityPrimaryPackingList,
} from '@/domain/trip-compatibility';
import { getTripName } from '@/domain/trip-name';
import { ensureTripUuid } from '@/lib/id';
import { profileSnapshotToJson } from '@/repositories/trips/mappers/supabase-canonical-mapper';

/** Deprecated DB mirror — derived from canonical lists at write boundary only. */
export function deriveTripsGeneratedMirror(trip: Trip): boolean {
  if (trip.packingLists.length === 1) {
    return trip.packingLists[0].packingMode === 'generated';
  }

  const mirrorList = resolveCompatibilityPrimaryPackingList(trip);
  if (mirrorList) {
    return mirrorList.packingMode === 'generated';
  }

  return false;
}

/** Compatibility traveler rows for bag FK validation — not authoritative people. */
export function packingListsToCompatibilityTravelers(lists: PackingList[]): Traveler[] {
  return lists.map((list) => {
    const snapshot = list.profileSnapshot;

    if (snapshot.isSelf) {
      return {
        id: 't-you',
        name: 'You',
        role: 'Adult',
        age: snapshot.age,
        birthDate: snapshot.birthDate,
      };
    }

    const role: TravelerRole =
      snapshot.age !== undefined && snapshot.age < 18 ? 'Child' : 'Adult';

    return {
      id: snapshot.id,
      name: snapshot.name,
      role,
      age: snapshot.age,
      birthDate: snapshot.birthDate,
    };
  });
}

function mapPackingListPayload(list: PackingList): Record<string, unknown> {
  return {
    id: list.id,
    packingProfileId: list.packingProfileId,
    profileSnapshot: profileSnapshotToJson(list.profileSnapshot),
    packingMode: list.packingMode,
    items: list.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      category: item.category,
      packed: item.packed,
      needToBuy: item.needToBuy,
      assignedTo: item.assignedTo,
      note: item.note ?? null,
      source: item.source ?? null,
      importantItemId: item.importantItemId ?? null,
    })),
  };
}

/** JSON payload for create_canonical_trip / save_canonical_trip RPCs. */
export function tripToCanonicalRpcPayload(trip: Trip): Record<string, unknown> {
  const normalized = normalizeCanonicalTrip(trip);
  const travelers = packingListsToCompatibilityTravelers(normalized.packingLists);

  return {
    id: ensureTripUuid(normalized.id),
    title: getTripName(normalized),
    destination: getDestinationLabel(normalized.destination),
    country: getDestinationCountryLabel(normalized.destination),
    startDate: normalized.startDate,
    endDate: normalized.endDate,
    types: [],
    activities: normalized.tripContext,
    accommodation: normalized.accommodation,
    laundry: normalized.laundry,
    note: normalized.note,
    generated: deriveTripsGeneratedMirror(normalized),
    status: normalized.status,
    image: normalized.image ?? null,
    travelers: travelers.map((traveler) => ({
      id: traveler.id,
      name: traveler.name,
      role: traveler.role,
      age: traveler.age ?? null,
      birthDate: traveler.birthDate ?? null,
    })),
    packingLists: normalized.packingLists.map(mapPackingListPayload),
    bags: normalized.bags.map((bag) => ({
      id: bag.id,
      name: bag.name,
      type: bag.type,
      ownerId: bag.ownerId,
    })),
    weather: normalized.weather,
    insights: normalized.insights.map((insight) => insightPersistContent(insight)),
  };
}
