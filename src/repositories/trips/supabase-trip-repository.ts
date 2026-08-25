import { getDestinationCountryLabel, getDestinationLabel } from '@/domain/destination';
import type { PackingItem } from '@/domain/packing-item';
import type { Trip } from '@/domain/trip';
import { getTripPackingMode, replacePrimaryPackingItems } from '@/domain/trip-compatibility';
import { getTripName } from '@/domain/trip-name';
import { createPackingItemId, ensureTripUuid } from '@/lib/id';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  mapPackingItemRow,
  mapTripRow,
  newPackingItemToDbInsert,
  packingItemPatchToDb,
  tripToCreatePayload,
  type DbPackingItemRow,
  type DbTripRow,
} from '@/repositories/trips/mappers/trip-mapper';
import type {
  NewPackingItemInput,
  PackingItemPatch,
  TripRepository,
} from '@/repositories/trips/trip-repository';

const TRIP_SELECT = `
  *,
  trip_travelers (*),
  trip_bags (*),
  packing_items (*),
  trip_weather (*),
  trip_insights (*)
`;

export class SupabaseTripRepository implements TripRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getAll(): Promise<Trip[]> {
    const { data, error } = await this.client
      .from('trips')
      .select(TRIP_SELECT)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data as DbTripRow[]).map(mapTripRow);
  }

  async getById(id: string): Promise<Trip | null> {
    const { data, error } = await this.client
      .from('trips')
      .select(TRIP_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapTripRow(data as DbTripRow) : null;
  }

  async save(trip: Trip): Promise<Trip> {
    const existing = await this.getById(trip.id);
    if (existing) {
      const { error } = await this.client
        .from('trips')
        .update({
          title: getTripName(trip),
          destination: getDestinationLabel(trip.destination),
          country: getDestinationCountryLabel(trip.destination),
          start_date: trip.startDate,
          end_date: trip.endDate,
          accommodation: trip.accommodation,
          laundry: trip.laundry,
          note: trip.note,
          types: [],
          activities: trip.tripContext,
          generated: getTripPackingMode(trip) === 'generated',
          status: trip.status,
          image: trip.image ?? null,
        })
        .eq('id', trip.id);

      if (error) {
        throw new Error(error.message);
      }

      return trip;
    }

    return this.createTrip(trip);
  }

  async updateTripPackingItems(tripId: string, items: PackingItem[]): Promise<Trip> {
    const existing = await this.getById(tripId);
    if (!existing) {
      throw new Error('Trip not found');
    }

    return this.save(replacePrimaryPackingItems(existing, items));
  }

  async createTrip(trip: Trip): Promise<Trip> {
    const tripWithUuid = { ...trip, id: ensureTripUuid(trip.id) };
    const payload = tripToCreatePayload(tripWithUuid);

    const { data, error } = await this.client.rpc('create_trip_with_details', {
      payload,
    });

    if (error) {
      throw new Error(error.message);
    }

    const tripId = typeof data === 'string' ? data : String(data);
    const saved = await this.getById(tripId);
    if (!saved) {
      throw new Error('Trip was created but could not be loaded');
    }

    return saved;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from('trips').delete().eq('id', id);
    if (error) {
      throw new Error(error.message);
    }
  }

  async updatePackingItem(
    tripId: string,
    itemId: string,
    patch: PackingItemPatch,
  ): Promise<PackingItem> {
    const dbPatch = packingItemPatchToDb(patch);
    const { data, error } = await this.client
      .from('packing_items')
      .update(dbPatch)
      .eq('trip_id', tripId)
      .eq('id', itemId)
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapPackingItemRow(data as DbPackingItemRow);
  }

  async addPackingItem(tripId: string, input: NewPackingItemInput): Promise<PackingItem> {
    const { count, error: countError } = await this.client
      .from('packing_items')
      .select('*', { count: 'exact', head: true })
      .eq('trip_id', tripId);

    if (countError) {
      throw new Error(countError.message);
    }

    const itemId = input.id ?? createPackingItemId();
    const row = newPackingItemToDbInsert(tripId, {
      id: itemId,
      name: input.name.trim(),
      category: input.category,
      quantity: input.quantity ?? 1,
      packed: input.packed ?? false,
      needToBuy: input.needToBuy ?? false,
      assignedTo: input.assignedTo ?? null,
      note: input.note,
      sortOrder: count ?? 0,
    });

    const { data, error } = await this.client
      .from('packing_items')
      .insert(row)
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapPackingItemRow(data as DbPackingItemRow);
  }

  async deletePackingItem(tripId: string, itemId: string): Promise<void> {
    const { error } = await this.client
      .from('packing_items')
      .delete()
      .eq('trip_id', tripId)
      .eq('id', itemId);

    if (error) {
      throw new Error(error.message);
    }
  }
}
