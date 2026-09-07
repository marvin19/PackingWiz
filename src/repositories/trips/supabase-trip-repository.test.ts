import type { SupabaseClient } from '@supabase/supabase-js';

import type { Trip } from '@/domain/trip';
import { cloneTrip } from '@/lib/clone-trip';
import { mockLisbonTrip, mockMallorcaTrip } from '@/mocks/seed-trips';
import { mapSupabaseSelectRowToTrip } from '@/repositories/trips/mappers/supabase-canonical-mapper';
import { tripToCanonicalRpcPayload } from '@/repositories/trips/supabase-canonical-payload';
import { CANONICAL_TRIP_SELECT } from '@/repositories/trips/supabase-trip-persistence-contract';
import { SupabaseTripRepository } from '@/repositories/trips/supabase-trip-repository';

const TRIP_UUID = '11111111-1111-4111-8111-111111111111';
const ME_LIST_ID = `${TRIP_UUID}-list-me`;
const EMILIE_LIST_ID = `${TRIP_UUID}-list-emilie`;

/** Asymmetric multi-list fixture — distinct modes, items, and profile snapshots per list. */
function createAsymmetricMultiListTrip(): Trip {
  const source = cloneTrip(mockLisbonTrip);
  return {
    ...source,
    id: TRIP_UUID,
    // Misleading legacy mirrors — save must ignore these in favour of packingLists.
    items: [
      {
        id: 'legacy-decoy-item',
        name: 'Legacy decoy — must not appear in save payload lists',
        quantity: 99,
        category: 'Clothing',
        packed: true,
        needToBuy: true,
        assignedTo: null,
      },
    ],
    packingMode: 'manual',
    generated: false,
    travelers: [{ id: 'wrong-traveler', name: 'Wrong', role: 'Adult' }],
    packingLists: [
      {
        ...source.packingLists[0],
        id: ME_LIST_ID,
        packingProfileId: `${TRIP_UUID}-profile-self`,
        profileSnapshot: { id: `${TRIP_UUID}-profile-self`, name: 'Me', isSelf: true },
        packingMode: 'generated',
        items: [
          {
            id: 'item-me-shirt',
            name: 'Me linen shirt',
            quantity: 2,
            category: 'Clothing',
            packed: true,
            needToBuy: false,
            assignedTo: null,
            note: 'Blue linen',
            source: 'generated',
          },
          {
            id: 'item-me-passport',
            name: 'Passport',
            quantity: 1,
            category: 'Important',
            packed: true,
            needToBuy: false,
            assignedTo: null,
            source: 'important',
            importantItemId: 'imp-passport',
          },
        ],
      },
      {
        ...source.packingLists[1],
        id: EMILIE_LIST_ID,
        packingProfileId: 'profile-emilie',
        profileSnapshot: { id: 'profile-emilie', name: 'Emilie', age: 8, isSelf: false },
        packingMode: 'manual',
        items: [
          {
            id: 'item-emilie-toy',
            name: 'Comfort toy',
            quantity: 1,
            category: 'Essentials',
            packed: false,
            needToBuy: true,
            assignedTo: null,
            note: 'Favorite bear',
            source: 'generated',
          },
        ],
      },
    ],
  };
}

function buildNestedSelectRow(trip: Trip): Record<string, unknown> {
  const payload = tripToCanonicalRpcPayload(trip);
  const lists = payload.packingLists as Record<string, unknown>[];

  return {
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
    trip_bags: (payload.bags as Record<string, unknown>[]).map((bag, index) => ({
      id: bag.id as string,
      trip_id: trip.id,
      name: bag.name as string,
      type: bag.type as string,
      owner_id: (bag.ownerId as string | null) ?? null,
      sort_order: index,
    })),
    trip_weather: payload.weather
      ? {
          trip_id: trip.id,
          mode: (payload.weather as Record<string, unknown>).mode as string,
          summary: (payload.weather as Record<string, unknown>).summary as string,
          detail: (payload.weather as Record<string, unknown>).detail as string,
          high: (payload.weather as Record<string, unknown>).high as number,
          low: (payload.weather as Record<string, unknown>).low as number,
        }
      : null,
    trip_insights: ((payload.insights as string[]) ?? []).map((content, index) => ({
      trip_id: trip.id,
      content,
      sort_order: index,
    })),
  };
}

type MockClientHandles = {
  client: SupabaseClient;
  rpc: jest.Mock;
  from: jest.Mock;
  getByIdMaybeSingle: jest.Mock;
  getAllOrder: jest.Mock;
  deleteEq: jest.Mock;
  packingItemUpdateEqCalls: [string, unknown][];
  mutationState: { packingItemInsertRow: Record<string, unknown> | null };
  packingItemDeleteEqCalls: [string, unknown][];
};

function createMockSupabaseClient(options: {
  rpcImpl?: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string; code?: string } | null }>;
  getByIdSequence?: { data: Record<string, unknown> | null; error: { message: string } | null }[];
  getAllResult?: { data: Record<string, unknown>[] | null; error: { message: string } | null };
  deleteResult?: { error: { message: string } | null };
  packingItemUpdateResult?: { data: Record<string, unknown> | null; error: { message: string } | null };
  packingItemInsertResult?: { data: Record<string, unknown> | null; error: { message: string } | null };
  packingItemDeleteResult?: { error: { message: string } | null };
  packingItemCount?: number;
  packingItemCountError?: { message: string } | null;
}): MockClientHandles {
  const rpc = jest.fn(async (name: string, args: Record<string, unknown>) => {
    if (options.rpcImpl) {
      return options.rpcImpl(name, args);
    }
    return { data: null, error: null };
  });

  let getByIdCallIndex = 0;
  const getByIdMaybeSingle = jest.fn(async () => {
    const sequence = options.getByIdSequence ?? [{ data: null, error: null }];
    const entry = sequence[Math.min(getByIdCallIndex, sequence.length - 1)]!;
    getByIdCallIndex += 1;
    return entry;
  });

  const getAllOrder = jest.fn(async () => options.getAllResult ?? { data: [], error: null });

  const deleteEq = jest.fn(async () => options.deleteResult ?? { error: null });

  const packingItemUpdateEqCalls: [string, unknown][] = [];
  const packingItemDeleteEqCalls: [string, unknown][] = [];
  const mutationState = {
    packingItemInsertRow: null as Record<string, unknown> | null,
  };

  const from = jest.fn((table: string) => {
    if (table === 'trips') {
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({ maybeSingle: getByIdMaybeSingle })),
          order: getAllOrder,
        })),
        delete: jest.fn(() => ({
          eq: deleteEq,
        })),
      };
    }

    if (table === 'packing_items') {
      const buildUpdateChain = (): {
        eq: jest.Mock;
        select: jest.Mock;
      } => {
        const chain: {
          eq: jest.Mock;
          select: jest.Mock;
        } = {
          eq: jest.fn((column: string, value: unknown) => {
            packingItemUpdateEqCalls.push([column, value]);
            return chain;
          }),
          select: jest.fn(() => ({
            single: jest.fn(async () => options.packingItemUpdateResult ?? { data: null, error: null }),
          })),
        };
        return chain;
      };

      const buildDeleteChain = (): { eq: jest.Mock } => {
        const chain: { eq: jest.Mock } = {
          eq: jest.fn((column: string, value: unknown) => {
            packingItemDeleteEqCalls.push([column, value]);
            return chain;
          }),
        };
        return chain;
      };

      return {
        select: jest.fn((_columns: string, config?: { head?: boolean }) => {
          if (config?.head) {
            return {
              eq: jest.fn(() => ({
                eq: jest.fn(async () =>
                  options.packingItemCountError
                    ? { count: null, error: options.packingItemCountError }
                    : { count: options.packingItemCount ?? 0, error: null },
                ),
              })),
            };
          }
          return { eq: jest.fn(() => ({ maybeSingle: getByIdMaybeSingle })) };
        }),
        update: jest.fn(() => buildUpdateChain()),
        insert: jest.fn((row: Record<string, unknown>) => {
          mutationState.packingItemInsertRow = row;
          return {
            select: jest.fn(() => ({
              single: jest.fn(async () => options.packingItemInsertResult ?? { data: row, error: null }),
            })),
          };
        }),
        delete: jest.fn(() => buildDeleteChain()),
      };
    }

    if (table === 'packing_profiles' || table === 'important_profile_configs' || table === 'important_profile_items') {
      return {
        select: jest.fn(() => ({ eq: jest.fn(() => ({ maybeSingle: jest.fn(async () => ({ data: null, error: null })) })) })),
        delete: jest.fn(() => ({ eq: jest.fn(async () => ({ error: null })) })),
        upsert: jest.fn(async () => ({ error: null })),
        insert: jest.fn(async () => ({ error: null })),
      };
    }

    throw new Error(`Unexpected table in mock: ${table}`);
  });

  return {
    client: { rpc, from } as unknown as SupabaseClient,
    rpc,
    from,
    getByIdMaybeSingle,
    getAllOrder,
    deleteEq,
    packingItemUpdateEqCalls,
    mutationState,
    packingItemDeleteEqCalls,
  };
}

function assertPayloadListOwnership(payload: Record<string, unknown>): void {
  const lists = payload.packingLists as Record<string, unknown>[];
  expect(lists).toHaveLength(2);

  const meList = lists.find((list) => list.id === ME_LIST_ID);
  const emilieList = lists.find((list) => list.id === EMILIE_LIST_ID);

  expect(meList?.packingMode).toBe('generated');
  expect(emilieList?.packingMode).toBe('manual');

  const meItems = (meList?.items as Record<string, unknown>[]) ?? [];
  const emilieItems = (emilieList?.items as Record<string, unknown>[]) ?? [];

  expect(meItems.map((item) => item.id)).toEqual(['item-me-shirt', 'item-me-passport']);
  expect(emilieItems.map((item) => item.id)).toEqual(['item-emilie-toy']);

  expect(meItems.some((item) => item.name === 'Me linen shirt')).toBe(true);
  expect(emilieItems.some((item) => item.note === 'Favorite bear')).toBe(true);

  expect(meItems.every((item) => item.id !== 'item-emilie-toy')).toBe(true);
  expect(emilieItems.every((item) => item.id !== 'item-me-shirt')).toBe(true);
  expect(meItems.every((item) => item.id !== 'legacy-decoy-item')).toBe(true);

  expect((meList?.profileSnapshot as Record<string, unknown>).name).toBe('Me');
  expect((emilieList?.profileSnapshot as Record<string, unknown>).name).toBe('Emilie');
}

describe('SupabaseTripRepository.createTrip', () => {
  it('calls create_canonical_trip RPC with a payload argument', async () => {
    const trip = cloneTrip(mockMallorcaTrip);
    const { client, rpc } = createMockSupabaseClient({
      rpcImpl: async () => ({ data: TRIP_UUID, error: null }),
      getByIdSequence: [{ data: buildNestedSelectRow({ ...trip, id: TRIP_UUID }), error: null }],
    });

    const repository = new SupabaseTripRepository(client);
    await repository.createTrip(trip);

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('create_canonical_trip', {
      payload: expect.objectContaining({
        title: expect.any(String),
        packingLists: expect.any(Array),
      }),
    });
  });

  it('throws when RPC fails so callers cannot treat create as successful', async () => {
    const trip = cloneTrip(mockMallorcaTrip);
    const { client } = createMockSupabaseClient({
      rpcImpl: async () => ({ data: null, error: { message: 'Not authenticated', code: 'P0001' } }),
    });

    const repository = new SupabaseTripRepository(client);
    await expect(repository.createTrip(trip)).rejects.toThrow(/create_canonical_trip failed: Not authenticated/);
  });

  it('throws when RPC succeeds but the trip cannot be loaded', async () => {
    const trip = cloneTrip(mockMallorcaTrip);
    const { client } = createMockSupabaseClient({
      rpcImpl: async () => ({ data: TRIP_UUID, error: null }),
      getByIdSequence: [{ data: null, error: null }],
    });

    const repository = new SupabaseTripRepository(client);
    await expect(repository.createTrip(trip)).rejects.toThrow(/could not be loaded/);
  });
});

describe('SupabaseTripRepository.save', () => {
  it('calls save_canonical_trip with nested canonical payload and reloads before returning', async () => {
    const trip = createAsymmetricMultiListTrip();
    const selectRow = buildNestedSelectRow(trip);
    const { client, rpc, getByIdMaybeSingle } = createMockSupabaseClient({
      rpcImpl: async (name) => {
        expect(name).toBe('save_canonical_trip');
        return { data: TRIP_UUID, error: null };
      },
      getByIdSequence: [
        { data: selectRow, error: null },
        { data: selectRow, error: null },
      ],
    });

    const repository = new SupabaseTripRepository(client);
    const saved = await repository.save(trip);

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('save_canonical_trip', {
      payload: expect.objectContaining({ id: TRIP_UUID }),
    });

    const payload = rpc.mock.calls[0]![1].payload as Record<string, unknown>;
    assertPayloadListOwnership(payload);

    expect(payload.generated).toBe(false);
    expect(getByIdMaybeSingle).toHaveBeenCalledTimes(2);

    expect(saved.packingLists).toHaveLength(2);
    expect(saved.packingLists[0]?.packingMode).toBe('generated');
    expect(saved.packingLists[1]?.packingMode).toBe('manual');
    expect(saved.packingLists[0]?.items.some((item) => item.id === 'item-me-shirt')).toBe(true);
    expect(saved.packingLists[1]?.items.some((item) => item.id === 'item-emilie-toy')).toBe(true);
    expect(saved.packingLists[0]?.items.some((item) => item.id === 'item-emilie-toy')).toBe(false);
  });

  it('does not source save payload from legacy Trip.items or collapse mixed list modes', async () => {
    const trip = createAsymmetricMultiListTrip();
    const { client, rpc } = createMockSupabaseClient({
      rpcImpl: async () => ({ data: TRIP_UUID, error: null }),
      getByIdSequence: [
        { data: buildNestedSelectRow(trip), error: null },
        { data: buildNestedSelectRow(trip), error: null },
      ],
    });

    await new SupabaseTripRepository(client).save(trip);

    const payload = rpc.mock.calls[0]![1].payload as Record<string, unknown>;
    assertPayloadListOwnership(payload);

    const allPayloadItemIds = (payload.packingLists as Record<string, unknown>[]).flatMap(
      (list) => ((list.items as Record<string, unknown>[]) ?? []).map((item) => item.id),
    );
    expect(allPayloadItemIds).not.toContain('legacy-decoy-item');

    const modes = (payload.packingLists as Record<string, unknown>[]).map(
      (list) => list.packingMode,
    );
    expect(modes).toEqual(['generated', 'manual']);
    expect(trip.generated).toBe(false);
    expect(payload.generated).toBe(false);
  });

  it('throws when save_canonical_trip returns a Supabase error', async () => {
    const trip = createAsymmetricMultiListTrip();
    const { client } = createMockSupabaseClient({
      rpcImpl: async () => ({ data: null, error: { message: 'permission denied for table trips' } }),
      getByIdSequence: [{ data: buildNestedSelectRow(trip), error: null }],
    });

    await expect(new SupabaseTripRepository(client).save(trip)).rejects.toThrow(
      'permission denied for table trips',
    );
  });

  it('throws when RPC succeeds but canonical reload fails', async () => {
    const trip = createAsymmetricMultiListTrip();
    const { client, rpc } = createMockSupabaseClient({
      rpcImpl: async () => ({ data: TRIP_UUID, error: null }),
      getByIdSequence: [
        { data: buildNestedSelectRow(trip), error: null },
        { data: null, error: null },
      ],
    });

    await expect(new SupabaseTripRepository(client).save(trip)).rejects.toThrow(
      'Trip was saved but could not be loaded',
    );
    expect(rpc).toHaveBeenCalledWith('save_canonical_trip', expect.any(Object));
  });
});

describe('SupabaseTripRepository hydration', () => {
  it('getAll hydrates nested packing_lists and list-scoped items in sort order', async () => {
    const trip = createAsymmetricMultiListTrip();
    const row = buildNestedSelectRow(trip);
    const { client } = createMockSupabaseClient({
      getAllResult: { data: [row], error: null },
    });

    const [loaded] = await new SupabaseTripRepository(client).getAll();

    expect(loaded!.packingLists.map((list) => list.id)).toEqual([ME_LIST_ID, EMILIE_LIST_ID]);
    expect(loaded!.packingLists[0]?.packingMode).toBe('generated');
    expect(loaded!.packingLists[1]?.packingMode).toBe('manual');
    expect(loaded!.packingLists[0]?.items[0]?.name).toBe('Me linen shirt');
    expect(loaded!.packingLists[1]?.items[0]?.note).toBe('Favorite bear');

    const passport = loaded!.packingLists[0]?.items.find((item) => item.importantItemId);
    expect(passport?.importantItemId).toBe('imp-passport');
    expect(passport?.source).toBe('important');

    expect(loaded!.bags.length).toBeGreaterThan(0);
    expect(loaded!.weather).toBeTruthy();
  });

  it('getById returns null when the trip is not found', async () => {
    const { client } = createMockSupabaseClient({
      getByIdSequence: [{ data: null, error: null }],
    });

    const loaded = await new SupabaseTripRepository(client).getById(TRIP_UUID);
    expect(loaded).toBeNull();
  });

  it('getById propagates Supabase query errors', async () => {
    const { client } = createMockSupabaseClient({
      getByIdSequence: [{ data: null, error: { message: 'JWT expired' } }],
    });

    await expect(new SupabaseTripRepository(client).getById(TRIP_UUID)).rejects.toThrow('JWT expired');
  });

  it('getAll propagates Supabase query errors', async () => {
    const { client } = createMockSupabaseClient({
      getAllResult: { data: null, error: { message: 'permission denied for table trips' } },
    });

    await expect(new SupabaseTripRepository(client).getAll()).rejects.toThrow(
      'permission denied for table trips',
    );
  });

  it('hydrates through repository select graph without using legacy flat items mirror', async () => {
    const trip = createAsymmetricMultiListTrip();
    const row = buildNestedSelectRow(trip);
    row.packing_items = [];

    const canonicalFromMapper = mapSupabaseSelectRowToTrip(row);
    const { client } = createMockSupabaseClient({
      getByIdSequence: [{ data: row, error: null }],
    });

    const loaded = await new SupabaseTripRepository(client).getById(TRIP_UUID);

    expect(loaded!.packingLists).toHaveLength(2);
    expect(loaded!.items).not.toEqual(trip.items);
    expect(canonicalFromMapper.packingLists[0]?.items).toHaveLength(0);
  });
});

describe('SupabaseTripRepository list-scoped item mutations', () => {
  const multiListRow = () => buildNestedSelectRow(createAsymmetricMultiListTrip());
  it('allows implicit sole-list resolution on a one-list trip', async () => {
    const trip = { ...cloneTrip(mockMallorcaTrip), id: TRIP_UUID };
    const listId = `${TRIP_UUID}-list-primary`;
    trip.packingLists = [
      {
        ...trip.packingLists[0]!,
        id: listId,
        packingProfileId: `${TRIP_UUID}-profile-self`,
        profileSnapshot: { id: `${TRIP_UUID}-profile-self`, name: 'Me', isSelf: true },
        items: [
          {
            id: 'item-1',
            name: 'Shirt',
            quantity: 1,
            category: 'Clothing',
            packed: false,
            needToBuy: false,
            assignedTo: null,
          },
        ],
      },
    ];

    const { client, packingItemUpdateEqCalls } = createMockSupabaseClient({
      getByIdSequence: [{ data: buildNestedSelectRow(trip), error: null }],
      packingItemUpdateResult: {
        data: {
          trip_id: TRIP_UUID,
          packing_list_id: listId,
          id: 'item-1',
          name: 'Shirt',
          quantity: 1,
          category: 'Clothing',
          packed: true,
          need_to_buy: false,
          assigned_to: null,
          note: null,
          source: 'generated',
          important_item_id: null,
          sort_order: 0,
        },
        error: null,
      },
    });

    await new SupabaseTripRepository(client).updatePackingItem(TRIP_UUID, 'item-1', { packed: true });

    expect(packingItemUpdateEqCalls).toContainEqual(['packing_list_id', listId]);
  });

  describe.each([
    [
      'updatePackingItem',
      (repository: SupabaseTripRepository) =>
        repository.updatePackingItem(TRIP_UUID, 'item-me-shirt', { packed: false }),
    ],
    [
      'deletePackingItem',
      (repository: SupabaseTripRepository) => repository.deletePackingItem(TRIP_UUID, 'item-me-shirt'),
    ],
    [
      'addPackingItem',
      (repository: SupabaseTripRepository) =>
        repository.addPackingItem(TRIP_UUID, { name: 'New hat', category: 'Clothing' }),
    ],
    [
      'updateTripPackingItems',
      (repository: SupabaseTripRepository) =>
        repository.updateTripPackingItems(TRIP_UUID, []),
    ],
  ])('%s on multi-list trip', (label, invoke) => {
    it('requires explicit packingListId — fails rather than falling back to first list', async () => {
      const { client, rpc } = createMockSupabaseClient({
        getByIdSequence: [{ data: multiListRow(), error: null }],
      });

      await expect(invoke(new SupabaseTripRepository(client))).rejects.toThrow(
        /Explicit packing list selection required/,
      );
      expect(rpc).not.toHaveBeenCalled();
    });
  });

  it('updatePackingItem scopes mutation to the requested list', async () => {
    const { client, packingItemUpdateEqCalls } = createMockSupabaseClient({
      getByIdSequence: [{ data: multiListRow(), error: null }],
      packingItemUpdateResult: {
        data: {
          trip_id: TRIP_UUID,
          packing_list_id: EMILIE_LIST_ID,
          id: 'item-emilie-toy',
          name: 'Comfort toy',
          quantity: 1,
          category: 'Essentials',
          packed: true,
          need_to_buy: false,
          assigned_to: null,
          note: 'Favorite bear',
          source: 'generated',
          important_item_id: null,
          sort_order: 0,
        },
        error: null,
      },
    });

    await new SupabaseTripRepository(client).updatePackingItem(
      TRIP_UUID,
      'item-emilie-toy',
      { packed: true },
      EMILIE_LIST_ID,
    );

    expect(packingItemUpdateEqCalls).toEqual([
      ['trip_id', TRIP_UUID],
      ['packing_list_id', EMILIE_LIST_ID],
      ['id', 'item-emilie-toy'],
    ]);
  });

  it('addPackingItem inserts under the explicit list id, not the first list', async () => {
    const { client, mutationState } = createMockSupabaseClient({
      getByIdSequence: [{ data: multiListRow(), error: null }],
      packingItemCount: 1,
      packingItemInsertResult: {
        data: {
          trip_id: TRIP_UUID,
          packing_list_id: EMILIE_LIST_ID,
          id: 'new-item-id',
          name: 'Sun hat',
          quantity: 1,
          category: 'Clothing',
          packed: false,
          need_to_buy: false,
          assigned_to: null,
          note: null,
          source: 'generated',
          important_item_id: null,
          sort_order: 1,
        },
        error: null,
      },
    });

    await new SupabaseTripRepository(client).addPackingItem(
      TRIP_UUID,
      { name: 'Sun hat', category: 'Clothing' },
      EMILIE_LIST_ID,
    );

    expect(mutationState.packingItemInsertRow?.packing_list_id).toBe(EMILIE_LIST_ID);
    expect(mutationState.packingItemInsertRow?.packing_list_id).not.toBe(ME_LIST_ID);
  });

  it('deletePackingItem scopes delete filters to trip_id + packing_list_id + item id', async () => {
    const { client, packingItemDeleteEqCalls } = createMockSupabaseClient({
      getByIdSequence: [{ data: multiListRow(), error: null }],
      packingItemDeleteResult: { error: null },
    });

    await new SupabaseTripRepository(client).deletePackingItem(
      TRIP_UUID,
      'item-emilie-toy',
      EMILIE_LIST_ID,
    );

    expect(packingItemDeleteEqCalls).toEqual([
      ['trip_id', TRIP_UUID],
      ['packing_list_id', EMILIE_LIST_ID],
      ['id', 'item-emilie-toy'],
    ]);
  });

  it('propagates packing_items mutation errors', async () => {
    const { client } = createMockSupabaseClient({
      getByIdSequence: [{ data: multiListRow(), error: null }],
      packingItemUpdateResult: { data: null, error: { message: 'permission denied for table packing_items' } },
    });

    await expect(
      new SupabaseTripRepository(client).updatePackingItem(
        TRIP_UUID,
        'item-me-shirt',
        { packed: true },
        ME_LIST_ID,
      ),
    ).rejects.toThrow('permission denied for table packing_items');
  });
});

describe('SupabaseTripRepository.delete', () => {
  it('deletes only the trip row by id — no profile or Important tables touched', async () => {
    const { client, from, deleteEq } = createMockSupabaseClient({
      deleteResult: { error: null },
    });

    await new SupabaseTripRepository(client).delete(TRIP_UUID);

    expect(from).toHaveBeenCalledWith('trips');
    expect(deleteEq).toHaveBeenCalledWith('id', TRIP_UUID);

    const touchedTables = from.mock.calls.map((call) => call[0]);
    expect(touchedTables).not.toContain('packing_profiles');
    expect(touchedTables).not.toContain('important_profile_configs');
    expect(touchedTables).not.toContain('important_profile_items');
  });

  it('propagates Supabase delete errors', async () => {
    const { client } = createMockSupabaseClient({
      deleteResult: { error: { message: 'permission denied for table trips' } },
    });

    await expect(new SupabaseTripRepository(client).delete(TRIP_UUID)).rejects.toThrow(
      'permission denied for table trips',
    );
  });

  it('does not simulate Postgres FK cascades — cascade remains live/manual contract', () => {
    // Packing lists/items/profile survival on trip delete is enforced by DB schema + VH4 manual smoke.
    expect(CANONICAL_TRIP_SELECT).toContain('packing_lists');
  });
});
