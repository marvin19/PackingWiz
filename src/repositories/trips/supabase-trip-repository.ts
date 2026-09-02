import { getDestinationCountryLabel, getDestinationLabel } from '@/domain/destination';
import type { PackingItem } from '@/domain/packing-item';
import type { Trip } from '@/domain/trip';
import {
  getTripPackingItems,
  getTripPackingMode,
  primaryPackingListId,
  replacePrimaryPackingItems,
} from '@/domain/trip-compatibility';
import { getTripName } from '@/domain/trip-name';
import { createPackingItemId, ensureTripUuid } from '@/lib/id';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  mapPackingItemRow,
  mapTripRow,
  newPackingItemToDbInsert,
  packingItemPatchToDb,
  packingItemToDbRow,
  tripToCreatePayload,
  type DbPackingItemRow,
  type DbTripRow,
} from '@/repositories/trips/mappers/trip-mapper';
import type {
  NewPackingItemInput,
  PackingItemPatch,
  TripRepository,
} from '@/repositories/trips/trip-repository';
import { assertSupabaseTripSaveSupported } from '@/repositories/trips/supabase-trip-save-guard';

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

  /**
   * Supabase stores one flat packing_items table (primary list only) until MP5.
   * Reject list-scoped mutations targeting a non-primary list so secondary items
   * are never silently flattened into the primary row set.
   */
  private assertPrimaryListTarget(tripId: string, packingListId?: string): void {
    const targetListId = packingListId ?? primaryPackingListId(tripId);
    if (targetListId !== primaryPackingListId(tripId)) {
      throw new Error(
        'Supabase persistence supports the primary packing list only until MP5. Use mock persistence for multi-list trips.',
      );
    }
  }

  /**
   * MP5A save guard — see assertSupabaseTripSaveSupported() for scenario semantics.
   */
  private assertMultiListTripEditSupported(existing: Trip, trip: Trip): void {
    assertSupabaseTripSaveSupported(existing, trip);
  }

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
      this.assertMultiListTripEditSupported(existing, trip);

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

  async updateTripPackingItems(
    tripId: string,
    items: PackingItem[],
    _packingListId?: string,
  ): Promise<Trip> {
    const existing = await this.getById(tripId);
    if (!existing) {
      throw new Error('Trip not found');
    }

    const updatedTrip = replacePrimaryPackingItems(existing, items);
    await this.syncPrimaryPackingItems(tripId, getTripPackingItems(updatedTrip));

    const reloaded = await this.getById(tripId);
    if (!reloaded) {
      throw new Error('Trip not found after packing items update');
    }

    return reloaded;
  }

  /**
   * Replace the flat packing_items snapshot for a trip's primary list.
   * Uses the current schema — one flat table, no PackingList rows.
   */
  private async syncPrimaryPackingItems(tripId: string, items: PackingItem[]): Promise<void> {
    const { data: existingRows, error: readError } = await this.client
      .from('packing_items')
      .select('id')
      .eq('trip_id', tripId);

    if (readError) {
      throw new Error(readError.message);
    }

    const existingIds = new Set((existingRows ?? []).map((row) => row.id as string));
    const nextIds = new Set(items.map((item) => item.id));
    const idsToDelete = [...existingIds].filter((id) => !nextIds.has(id));

    if (idsToDelete.length > 0) {
      const { error: deleteError } = await this.client
        .from('packing_items')
        .delete()
        .eq('trip_id', tripId)
        .in('id', idsToDelete);

      if (deleteError) {
        throw new Error(deleteError.message);
      }
    }

    if (items.length === 0) {
      return;
    }

    const rows = items.map((item, index) => packingItemToDbRow(tripId, item, index));
    const { error: upsertError } = await this.client
      .from('packing_items')
      .upsert(rows, { onConflict: 'trip_id,id' });

    if (upsertError) {
      throw new Error(upsertError.message);
    }
  }

  async createTrip(trip: Trip): Promise<Trip> {
    if (trip.packingLists.length > 1) {
      throw new Error(
        'Multi-person trips are not supported in Supabase mode until MP5. Use mock persistence or pack for one person.',
      );
    }

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
    // Child rows (packing_items, trip_weather, trip_insights, …) cascade via FK ON DELETE CASCADE.
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
    this.assertPrimaryListTarget(tripId, packingListId);

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

  async addPackingItem(
    tripId: string,
    input: NewPackingItemInput,
    packingListId?: string,
  ): Promise<PackingItem> {
    this.assertPrimaryListTarget(tripId, packingListId);

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

  async deletePackingItem(
    tripId: string,
    itemId: string,
    packingListId?: string,
  ): Promise<void> {
    this.assertPrimaryListTarget(tripId, packingListId);

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
