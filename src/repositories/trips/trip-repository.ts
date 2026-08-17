import type { Trip } from '@/domain/trip';

export interface TripRepository {
  getAll(): Promise<Trip[]>;
  getById(id: string): Promise<Trip | null>;
  save(trip: Trip): Promise<Trip>;
  delete(id: string): Promise<void>;
}
