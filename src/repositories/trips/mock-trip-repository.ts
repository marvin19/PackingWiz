import type { PackingItem } from '@/domain/packing-item';
import type { Trip } from '@/domain/trip';
import {
  appendPackingListItem,
  appendPrimaryPackingItem,
  findPackingItemInList,
  patchPackingListItem,
  removePackingListItem,
  removePrimaryPackingItem,
  replacePackingListItems,
  resolveCompatibilityPrimaryPackingList,
  type TripLike,
} from '@/domain/trip-compatibility';
import { clonePackingItem, cloneTrip } from '@/lib/clone-trip';
import { createPackingItemId } from '@/lib/id';

import type {
  NewPackingItemInput,
  PackingItemPatch,
  TripRepository,
} from '@/repositories/trips/trip-repository';
import { mockSeedTrips } from '@/mocks/seed-trips';

function resolvePackingListId(trip: Trip, packingListId?: string): string {
  if (packingListId) {
    return packingListId;
  }

  const resolved = resolveCompatibilityPrimaryPackingList(trip);
  if (resolved) {
    return resolved.id;
  }

  throw new Error('Explicit packingListId required for multi-list trips without a compatibility-primary list');
}

/** Persists all nested packing lists in memory — list-scoped item APIs supported (MP3A). */
export class MockTripRepository implements TripRepository {
  private trips: Trip[];

  constructor(initialTrips: (Trip | TripLike)[] = mockSeedTrips) {
    this.trips = initialTrips.map((trip) => cloneTrip(trip));
  }

  async getAll(): Promise<Trip[]> {
    return cloneTrips(this.trips);
  }

  async getById(id: string): Promise<Trip | null> {
    const trip = this.trips.find((entry) => entry.id === id);
    return trip ? cloneTrip(trip) : null;
  }

  async save(trip: Trip): Promise<Trip> {
    const index = this.trips.findIndex((entry) => entry.id === trip.id);
    const normalized = cloneTrip(trip);

    if (index >= 0) {
      const existing = this.trips[index];
      this.trips[index] = cloneTrip({
        ...existing,
        ...normalized,
        status: normalized.status ?? existing.status,
        travelers: normalized.travelers.length > 0 ? normalized.travelers : existing.travelers,
        bags: normalized.bags.length > 0 ? normalized.bags : existing.bags,
        weather: normalized.weather ?? existing.weather,
        insights: normalized.insights.length > 0 ? normalized.insights : existing.insights,
        packingLists: normalized.packingLists,
      });
      return cloneTrip(this.trips[index]);
    }

    this.trips = [normalized, ...this.trips.map((entry) => cloneTrip(entry))];
    return cloneTrip(normalized);
  }

  async updateTripPackingItems(
    tripId: string,
    items: PackingItem[],
    packingListId?: string,
  ): Promise<Trip> {
    const index = this.trips.findIndex((entry) => entry.id === tripId);
    if (index < 0) {
      throw new Error('Trip not found');
    }

    const listId = resolvePackingListId(this.trips[index], packingListId);
    const updated = replacePackingListItems(
      this.trips[index],
      listId,
      items.map((item) => clonePackingItem(item)),
    );
    this.trips[index] = updated;
    return cloneTrip(updated);
  }

  async createTrip(trip: Trip): Promise<Trip> {
    return this.save(trip);
  }

  async delete(id: string): Promise<void> {
    this.trips = this.trips.filter((trip) => trip.id !== id);
  }

  async updatePackingItem(
    tripId: string,
    itemId: string,
    patch: PackingItemPatch,
    packingListId?: string,
  ): Promise<PackingItem> {
    const index = this.trips.findIndex((entry) => entry.id === tripId);
    if (index < 0) {
      throw new Error('Trip not found');
    }

    const trip = this.trips[index];
    const listId = resolvePackingListId(trip, packingListId);
    const item = findPackingItemInList(trip, listId, itemId);
    if (!item) {
      throw new Error('Packing item not found');
    }

    const updated: PackingItem = { ...item, ...patch };
    this.trips[index] = patchPackingListItem(trip, listId, itemId, patch);
    return clonePackingItem(updated);
  }

  async addPackingItem(
    tripId: string,
    input: NewPackingItemInput,
    packingListId?: string,
  ): Promise<PackingItem> {
    const index = this.trips.findIndex((entry) => entry.id === tripId);
    if (index < 0) {
      throw new Error('Trip not found');
    }

    const trip = this.trips[index];
    const listId = resolvePackingListId(trip, packingListId);
    const newItem: PackingItem = {
      id: input.id ?? createPackingItemId(),
      name: input.name.trim(),
      category: input.category,
      quantity: input.quantity ?? 1,
      packed: input.packed ?? false,
      needToBuy: input.needToBuy ?? false,
      assignedTo: input.assignedTo ?? null,
      note: input.note,
    };

    const mirrorList = resolveCompatibilityPrimaryPackingList(trip);
    this.trips[index] =
      mirrorList && listId === mirrorList.id
        ? appendPrimaryPackingItem(trip, newItem)
        : appendPackingListItem(trip, listId, newItem);
    return clonePackingItem(newItem);
  }

  async deletePackingItem(
    tripId: string,
    itemId: string,
    packingListId?: string,
  ): Promise<void> {
    const index = this.trips.findIndex((entry) => entry.id === tripId);
    if (index < 0) {
      throw new Error('Trip not found');
    }

    const trip = this.trips[index];
    const listId = resolvePackingListId(trip, packingListId);
    const mirrorList = resolveCompatibilityPrimaryPackingList(trip);
    this.trips[index] =
      mirrorList && listId === mirrorList.id
        ? removePrimaryPackingItem(trip, itemId)
        : removePackingListItem(trip, listId, itemId);
  }
}

function cloneTrips(trips: Trip[]): Trip[] {
  return trips.map((trip) => cloneTrip(trip));
}

export const mockTripRepository = new MockTripRepository();
