import type { PackingItem } from '@/domain/packing-item';
import type { Trip } from '@/domain/trip';
import { clonePackingItem, cloneTrip } from '@/lib/clone-trip';
import { createPackingItemId } from '@/lib/id';

import type {
  NewPackingItemInput,
  PackingItemPatch,
  TripRepository,
} from '@/repositories/trips/trip-repository';
import { mockSeedTrips } from '@/mocks/seed-trips';

/** In-memory only — resets to seed trips on full app reload in mock mode. */
export class MockTripRepository implements TripRepository {
  private trips: Trip[];

  constructor(initialTrips: Trip[] = mockSeedTrips) {
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
        items: normalized.items,
      });
      return cloneTrip(this.trips[index]);
    }

    this.trips = [normalized, ...this.trips.map((entry) => cloneTrip(entry))];
    return cloneTrip(normalized);
  }

  async updateTripPackingItems(tripId: string, items: PackingItem[]): Promise<Trip> {
    const index = this.trips.findIndex((entry) => entry.id === tripId);
    if (index < 0) {
      throw new Error('Trip not found');
    }

    const existing = this.trips[index];
    const updated = cloneTrip({
      ...existing,
      items: items.map((item) => clonePackingItem(item)),
    });
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
  ): Promise<PackingItem> {
    const trip = this.trips.find((entry) => entry.id === tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    const index = trip.items.findIndex((item) => item.id === itemId);
    if (index < 0) {
      throw new Error('Packing item not found');
    }

    const updated: PackingItem = { ...trip.items[index], ...patch };
    trip.items = trip.items.map((item, itemIndex) =>
      itemIndex === index ? updated : clonePackingItem(item),
    );
    return clonePackingItem(updated);
  }

  async addPackingItem(tripId: string, input: NewPackingItemInput): Promise<PackingItem> {
    const trip = this.trips.find((entry) => entry.id === tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

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

    trip.items = [...trip.items.map(clonePackingItem), clonePackingItem(newItem)];
    return clonePackingItem(newItem);
  }

  async deletePackingItem(tripId: string, itemId: string): Promise<void> {
    const trip = this.trips.find((entry) => entry.id === tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    trip.items = trip.items.filter((item) => item.id !== itemId).map(clonePackingItem);
  }
}

function cloneTrips(trips: Trip[]): Trip[] {
  return trips.map((trip) => cloneTrip(trip));
}

export const mockTripRepository = new MockTripRepository();
