import type { PackingItem } from '@/domain/packing-item';
import type { Trip } from '@/domain/trip';
import { resolveExplicitPackingListId } from '@/domain/trip-canonical';
import {
  findPackingItemInList,
  replacePackingListItems,
} from '@/domain/trip-compatibility';
import { createPackingItemId, ensureTripUuid } from '@/lib/id';
import type { SupabaseClient } from '@supabase/supabase-js';

import { mapDbCanonicalPackingItemRow, mapSupabaseSelectRowToTrip } from '@/repositories/trips/mappers/supabase-canonical-mapper';
import {
  mapPackingItemRow,
  newPackingItemToDbInsert,
  packingItemPatchToDb,
  type DbPackingItemRow,
} from '@/repositories/trips/mappers/trip-mapper';
import { CANONICAL_TRIP_SELECT } from '@/repositories/trips/supabase-trip-persistence-contract';
import { tripToCanonicalRpcPayload } from '@/repositories/trips/supabase-canonical-payload';
import type {
  NewPackingItemInput,
  PackingItemPatch,
  TripRepository,
} from '@/repositories/trips/trip-repository';

export class SupabaseTripRepository implements TripRepository {
  constructor(private readonly client: SupabaseClient) {}

  private resolveListId(trip: Trip, packingListId?: string): string {
    return resolveExplicitPackingListId(trip, packingListId);
  }

  async getAll(): Promise<Trip[]> {
    const { data, error } = await this.client
      .from('trips')
      .select(CANONICAL_TRIP_SELECT)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => mapSupabaseSelectRowToTrip(row as Record<string, unknown>));
  }

  async getById(id: string): Promise<Trip | null> {
    const { data, error } = await this.client
      .from('trips')
      .select(CANONICAL_TRIP_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapSupabaseSelectRowToTrip(data as Record<string, unknown>) : null;
  }

  async save(trip: Trip): Promise<Trip> {
    const existing = await this.getById(trip.id);

    if (existing) {
      const payload = tripToCanonicalRpcPayload(trip);
      const { data, error } = await this.client.rpc('save_canonical_trip', { payload });

      if (error) {
        throw new Error(error.message);
      }

      const tripId = typeof data === 'string' ? data : String(data);
      const saved = await this.getById(tripId);
      if (!saved) {
        throw new Error('Trip was saved but could not be loaded');
      }

      return saved;
    }

    return this.createTrip(trip);
  }

  async createTrip(trip: Trip): Promise<Trip> {
    const tripWithUuid = { ...trip, id: ensureTripUuid(trip.id) };
    const payload = tripToCanonicalRpcPayload(tripWithUuid);

    const { data, error } = await this.client.rpc('create_canonical_trip', { payload });

    if (error) {
      const codeSuffix =
        typeof __DEV__ !== 'undefined' && __DEV__ && 'code' in error && error.code
          ? ` (${String(error.code)})`
          : '';
      throw new Error(`create_canonical_trip failed: ${error.message}${codeSuffix}`);
    }

    if (data === null || data === undefined) {
      throw new Error('create_canonical_trip returned no trip id');
    }

    const tripId = typeof data === 'string' ? data : String(data);
    const saved = await this.getById(tripId);
    if (!saved) {
      throw new Error(
        `Trip was created (id=${tripId}) but could not be loaded — check RLS/select permissions`,
      );
    }

    return saved;
  }

  async updateTripPackingItems(
    tripId: string,
    items: PackingItem[],
    packingListId?: string,
  ): Promise<Trip> {
    const existing = await this.getById(tripId);
    if (!existing) {
      throw new Error('Trip not found');
    }

    const listId = this.resolveListId(existing, packingListId);
    const updatedTrip = replacePackingListItems(existing, listId, items);
    return this.save(updatedTrip);
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
    packingListId?: string,
  ): Promise<PackingItem> {
    const trip = await this.getById(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    const listId = this.resolveListId(trip, packingListId);
    const existingItem = findPackingItemInList(trip, listId, itemId);
    if (!existingItem) {
      throw new Error('Packing item not found');
    }

    const dbPatch = packingItemPatchToDb(patch);
    const { data, error } = await this.client
      .from('packing_items')
      .update(dbPatch)
      .eq('trip_id', tripId)
      .eq('packing_list_id', listId)
      .eq('id', itemId)
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapPackingItemRow(data as DbPackingItemRow);
  }

  async addPackingItem(
    tripId: string,
    input: NewPackingItemInput,
    packingListId?: string,
  ): Promise<PackingItem> {
    const trip = await this.getById(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    const listId = this.resolveListId(trip, packingListId);

    const { count, error: countError } = await this.client
      .from('packing_items')
      .select('*', { count: 'exact', head: true })
      .eq('trip_id', tripId)
      .eq('packing_list_id', listId);

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
      packingListId: listId,
    });

    const { data, error } = await this.client
      .from('packing_items')
      .insert(row)
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapDbCanonicalPackingItemRow(data as Parameters<typeof mapDbCanonicalPackingItemRow>[0]);
  }

  async deletePackingItem(
    tripId: string,
    itemId: string,
    packingListId?: string,
  ): Promise<void> {
    const trip = await this.getById(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    const listId = this.resolveListId(trip, packingListId);

    const { error } = await this.client
      .from('packing_items')
      .delete()
      .eq('trip_id', tripId)
      .eq('packing_list_id', listId)
      .eq('id', itemId);

    if (error) {
      throw new Error(error.message);
    }
  }
}
