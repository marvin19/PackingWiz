import type { Trip } from '@/domain/trip';
import type { TripRepository } from '@/repositories/trips/trip-repository';
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

  async delete(id: string): Promise<void> {
    this.trips = this.trips.filter((trip) => trip.id !== id);
  }
}

export const mockTripRepository = new MockTripRepository();
