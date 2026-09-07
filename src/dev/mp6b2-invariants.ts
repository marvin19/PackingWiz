import { normalizeCanonicalTrip } from '@/domain/trip-compatibility';
import { cloneTrip } from '@/lib/clone-trip';
import { mockLisbonTrip } from '@/mocks/seed-trips';

import { mapDbAggregateToCanonicalTrip } from '@/repositories/trips/mappers/supabase-canonical-mapper';
import { tripToCanonicalRpcPayload } from '@/repositories/trips/supabase-canonical-payload';

function simulatePersistReload(trip: ReturnType<typeof cloneTrip>) {
  const payload = tripToCanonicalRpcPayload(trip);
  const lists = payload.packingLists as Record<string, unknown>[];

  const aggregate = {
    trip: {
      id: trip.id,
      user_id: 'user-1',
      title: payload.title as string,
      destination: payload.destination as string,
      country: payload.country as string,
      start_date: payload.startDate as string,
      end_date: payload.endDate as string,
      accommodation: payload.accommodation as string,
      laundry: payload.laundry as string,
      note: payload.note as string,
      types: [],
      activities: payload.activities as string[],
      generated: payload.generated as boolean,
      status: payload.status as string,
      image: null,
    },
    packing_lists: lists.map((list, index) => ({
      trip_id: trip.id,
      id: list.id as string,
      packing_profile_id: list.packingProfileId as string,
      profile_snapshot: list.profileSnapshot,
      packing_mode: list.packingMode as 'generated' | 'manual',
      sort_order: index,
    })),
    packing_items: lists.flatMap((list) =>
      ((list.items as Record<string, unknown>[]) ?? []).map((item, index) => ({
        trip_id: trip.id,
        packing_list_id: list.id as string,
        id: item.id as string,
        name: item.name as string,
        quantity: item.quantity as number,
        category: item.category as string,
        packed: item.packed as boolean,
        need_to_buy: item.needToBuy as boolean,
        assigned_to: (item.assignedTo as string | null) ?? null,
        note: (item.note as string | null) ?? null,
        source: (item.source as 'generated' | 'important' | null) ?? null,
        important_item_id: (item.importantItemId as string | null) ?? null,
        sort_order: index,
      })),
    ),
    trip_bags: [],
    trip_weather: null,
    trip_insights: [],
  };

  return normalizeCanonicalTrip(mapDbAggregateToCanonicalTrip(aggregate as Parameters<typeof mapDbAggregateToCanonicalTrip>[0]));
}

export function runMp6b2InvariantChecks(): void {
  const source = cloneTrip(mockLisbonTrip);
  const reloaded = simulatePersistReload(source);

  if (reloaded.packingLists.length !== 2) {
    throw new Error('MP6-B2 invariant: multi-list trip must round-trip both lists');
  }

  if (reloaded.packingLists[0].packingMode !== 'generated' || reloaded.packingLists[1].packingMode !== 'manual') {
    throw new Error('MP6-B2 invariant: mixed packing modes must survive persist/reload');
  }

  const passport = reloaded.packingLists[0].items.find((item) => item.importantItemId === 'imp-passport');
  if (!passport || passport.source !== 'important') {
    throw new Error('MP6-B2 invariant: Important snapshot link must survive persist/reload');
  }
}
