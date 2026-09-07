import type { SupabaseClient } from '@supabase/supabase-js';

import { mockMallorcaTrip } from '@/mocks/seed-trips';
import { cloneTrip } from '@/lib/clone-trip';
import { SupabaseTripRepository } from '@/repositories/trips/supabase-trip-repository';

const TRIP_UUID = '11111111-1111-4111-8111-111111111111';

function createMockSupabaseClient(options: {
  rpcResult: { data: unknown; error: { message: string; code?: string } | null };
  selectRow?: Record<string, unknown> | null;
}) {
  const maybeSingle = jest.fn().mockResolvedValue({
    data: options.selectRow ?? null,
    error: null,
  });
  const eq = jest.fn().mockReturnValue({ maybeSingle });
  const select = jest.fn().mockReturnValue({ eq });
  const from = jest.fn().mockReturnValue({ select });
  const rpc = jest.fn().mockResolvedValue(options.rpcResult);

  return {
    client: { rpc, from } as unknown as SupabaseClient,
    rpc,
    from,
    select,
  };
}

describe('SupabaseTripRepository.createTrip', () => {
  it('calls create_canonical_trip RPC with a payload argument', async () => {
    const trip = cloneTrip(mockMallorcaTrip);
    const { client, rpc } = createMockSupabaseClient({
      rpcResult: { data: TRIP_UUID, error: null },
      selectRow: {
        id: TRIP_UUID,
        user_id: 'user-1',
        title: trip.title,
        destination: 'Palma',
        country: 'Spain',
        start_date: trip.startDate,
        end_date: trip.endDate,
        accommodation: trip.accommodation,
        laundry: trip.laundry,
        note: trip.note,
        types: [],
        activities: [],
        generated: false,
        status: 'upcoming',
        image: null,
        packing_lists: [
          {
            trip_id: TRIP_UUID,
            id: `${TRIP_UUID}-list-primary`,
            packing_profile_id: `${TRIP_UUID}-profile-self`,
            profile_snapshot: { id: `${TRIP_UUID}-profile-self`, name: 'Me', isSelf: true },
            packing_mode: 'manual',
            sort_order: 0,
          },
        ],
        packing_items: [],
        trip_bags: [],
        trip_weather: null,
        trip_insights: [],
      },
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
      rpcResult: { data: null, error: { message: 'Not authenticated', code: 'P0001' } },
    });

    const repository = new SupabaseTripRepository(client);
    await expect(repository.createTrip(trip)).rejects.toThrow(/create_canonical_trip failed: Not authenticated/);
  });

  it('throws when RPC succeeds but the trip cannot be loaded', async () => {
    const trip = cloneTrip(mockMallorcaTrip);
    const { client } = createMockSupabaseClient({
      rpcResult: { data: TRIP_UUID, error: null },
      selectRow: null,
    });

    const repository = new SupabaseTripRepository(client);
    await expect(repository.createTrip(trip)).rejects.toThrow(/could not be loaded/);
  });
});
