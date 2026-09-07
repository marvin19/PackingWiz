import type { ImportantItemsConfig } from '@/domain/important-items-config';
import { normalizeCanonicalTrip } from '@/domain/trip-compatibility';
import { resolveExplicitPackingListId } from '@/domain/trip-canonical';
import { mockLisbonTrip, mockMallorcaTrip } from '@/mocks/seed-trips';
import { cloneTrip } from '@/lib/clone-trip';

import {
  isPersistablePackingProfileId,
  mapDbAggregateToCanonicalTrip,
  mapSupabaseSelectRowToTrip,
} from '@/repositories/trips/mappers/supabase-canonical-mapper';
import type { DbCanonicalTripAggregate } from '@/repositories/trips/mappers/supabase-canonical-types';
import {
  deriveTripsGeneratedMirror,
  packingListsToCompatibilityTravelers,
  tripToCanonicalRpcPayload,
} from '@/repositories/trips/supabase-canonical-payload';
import { MockPackingProfileRepository } from '@/repositories/profiles/mock-packing-profile-repository';
import { persistRememberedProfileWithImportant } from '@/repositories/profiles/supabase-packing-profile-repository';

function buildAggregateFromTrip(trip: ReturnType<typeof cloneTrip>): DbCanonicalTripAggregate {
  const payload = tripToCanonicalRpcPayload(trip);
  const lists = payload.packingLists as Record<string, unknown>[];

  return {
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
      profile_snapshot: list.profileSnapshot as DbCanonicalTripAggregate['packing_lists'][number]['profile_snapshot'],
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
    trip_bags: (payload.bags as Record<string, unknown>[]).map((bag, index) => ({
      id: bag.id as string,
      trip_id: trip.id,
      name: bag.name as string,
      type: bag.type as string,
      owner_id: (bag.ownerId as string | null) ?? null,
      sort_order: index,
    })),
    trip_weather: null,
    trip_insights: [],
  };
}

describe('supabase canonical round-trip (local)', () => {
  it('A. single-list generated create/read round-trip', () => {
    const source = cloneTrip(mockMallorcaTrip);
    const reloaded = mapDbAggregateToCanonicalTrip(buildAggregateFromTrip(source));

    expect(reloaded.packingLists).toHaveLength(1);
    expect(reloaded.packingLists[0].packingMode).toBe('generated');
  });

  it('B/C. multi-list mixed modes and order survive', () => {
    const source = cloneTrip(mockLisbonTrip);
    const reloaded = normalizeCanonicalTrip(mapDbAggregateToCanonicalTrip(buildAggregateFromTrip(source)));

    expect(reloaded.packingLists.map((list) => list.packingMode)).toEqual(['generated', 'manual']);
    expect(reloaded.packingLists[1].id).toBe('lisbon-list-emilie');
  });

  it('E/F. profile snapshots and distinct ids survive', () => {
    const reloaded = mapDbAggregateToCanonicalTrip(buildAggregateFromTrip(cloneTrip(mockLisbonTrip)));
    const emilie = reloaded.packingLists.find((list) => list.id === 'lisbon-list-emilie');

    expect(emilie?.profileSnapshot.name).toBe('Emilie');
    expect(emilie?.packingProfileId).toBe('profile-emilie');
    expect(reloaded.packingLists[0].packingProfileId).not.toBe(emilie?.packingProfileId);
  });

  it('G/H/I. item state and Important link survive', () => {
    const reloaded = mapDbAggregateToCanonicalTrip(buildAggregateFromTrip(cloneTrip(mockLisbonTrip)));
    const passport = reloaded.packingLists[0].items.find((item) => item.importantItemId);

    expect(passport?.importantItemId).toBe('imp-passport');
    expect(passport?.source).toBe('important');
    expect(passport?.packed).toBe(true);
    expect(passport?.quantity).toBe(1);
  });

  it('N. explicit list id required for multi-list mutations', () => {
    const trip = cloneTrip(mockLisbonTrip);
    expect(() => resolveExplicitPackingListId(trip, undefined)).toThrow(
      /Explicit packing list selection required/,
    );
    expect(resolveExplicitPackingListId(trip, 'lisbon-list-emilie')).toBe('lisbon-list-emilie');
  });

  it('Y. trips.generated mirror derives from lists — not authoritative on read', () => {
    const mixed = cloneTrip(mockLisbonTrip);
    expect(deriveTripsGeneratedMirror(mixed)).toBe(true);
    const payload = tripToCanonicalRpcPayload(mixed);
    expect(payload.generated).toBe(true);

    const aggregate = buildAggregateFromTrip(mixed);
    aggregate.trip.generated = false;
    const reloaded = mapDbAggregateToCanonicalTrip(aggregate);
    expect(reloaded.packingLists[0].packingMode).toBe('generated');
    expect(reloaded.packingLists[1].packingMode).toBe('manual');
  });

  it('compatibility travelers derived from snapshots — not authoritative people', () => {
    const travelers = packingListsToCompatibilityTravelers(mockLisbonTrip.packingLists);
    expect(travelers.some((traveler) => traveler.id === 't-you')).toBe(true);
    expect(travelers.some((traveler) => traveler.id === 'profile-emilie')).toBe(true);
  });

  it('V. draft profile ids rejected from reusable persistence', () => {
    expect(isPersistablePackingProfileId('draft-profile-abc')).toBe(false);
  });

  it('T. profile Important isolation in mock profile repository', async () => {
    const repository = new MockPackingProfileRepository();
    const emilieConfig: ImportantItemsConfig = {
      items: [{ id: 'imp-1', name: 'Toy', quantity: 1, enabled: true }],
      isConfigured: true,
      isEnabled: true,
      promptDismissed: false,
    };

    await persistRememberedProfileWithImportant(
      repository,
      { id: 'profile-emilie', name: 'Emilie', age: 8, isSelf: false },
      emilieConfig,
    );

    const loaded = await repository.loadAll();
    expect(loaded.importantByProfileId['profile-emilie']?.items[0].name).toBe('Toy');
    expect(loaded.importantByProfileId['profile-jonas']).toBeUndefined();
  });

  it('X. legacy flat select row still loads through legacy ingress', () => {
    const legacyRow = {
      id: 'trip-legacy',
      user_id: 'user-1',
      title: 'Legacy',
      destination: 'Oslo',
      country: 'Norway',
      start_date: '2026-01-01',
      end_date: '2026-01-05',
      accommodation: 'hotel',
      laundry: 'unsure',
      note: '',
      types: [],
      activities: [],
      generated: true,
      status: 'upcoming',
      image: null,
      packing_lists: [],
      trip_travelers: [{ id: 't-you', name: 'You', role: 'Adult', sort_order: 0 }],
      packing_items: [
        {
          id: 'item-1',
          trip_id: 'trip-legacy',
          name: 'Shirt',
          quantity: 1,
          category: 'Clothing',
          packed: false,
          need_to_buy: false,
          assigned_to: null,
          note: null,
          sort_order: 0,
        },
      ],
      trip_bags: [],
      trip_weather: null,
      trip_insights: [],
    };

    const trip = mapSupabaseSelectRowToTrip(legacyRow);
    expect(trip.packingLists).toHaveLength(1);
    expect(trip.packingLists[0].items[0].name).toBe('Shirt');
  });
});
