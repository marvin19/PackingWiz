import type { PackingItem } from '@/domain/packing-item';
import type { Trip } from '@/domain/trip';
import { createPackingItemId } from '@/lib/id';

import type {
  NewPackingItemInput,
  PackingItemPatch,
  TripRepository,
} from '@/repositories/trips/trip-repository';
import { mockSeedTrips } from '@/mocks/seed-trips';

export class MockTripRepository implements TripRepository {
  private trips: Trip[];

  constructor(initialTrips: Trip[] = mockSeedTrips) {
    this.trips = initialTrips.map((trip) => ({ ...trip }));
  }

  async getAll(): Promise<Trip[]> {
    return this.trips.map((trip) => ({ ...trip }));
  }

  async getById(id: string): Promise<Trip | null> {
    const trip = this.trips.find((entry) => entry.id === id);
    return trip ? { ...trip } : null;
  }

  async save(trip: Trip): Promise<Trip> {
    const index = this.trips.findIndex((entry) => entry.id === trip.id);
    if (index >= 0) {
      this.trips[index] = { ...trip };
    } else {
      this.trips = [{ ...trip }, ...this.trips];
    }
    return { ...trip };
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
    trip.items[index] = updated;
    return { ...updated };
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

    trip.items = [...trip.items, newItem];
    return { ...newItem };
  }

  async deletePackingItem(tripId: string, itemId: string): Promise<void> {
    const trip = this.trips.find((entry) => entry.id === tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    trip.items = trip.items.filter((item) => item.id !== itemId);
  }
}

export const mockTripRepository = new MockTripRepository();
