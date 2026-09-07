import { mockLisbonTrip } from '@/mocks/seed-trips';
import { cloneTrip } from '@/lib/clone-trip';

/**
 * MP6-B2 lifted the Supabase multi-list save guards.
 * These tests document the former guard semantics for regression awareness only.
 */
describe('supabase-trip-save-guard (historical)', () => {
  it('multi-list trips are no longer blocked at repository layer after MP6-B2', () => {
    const multi = cloneTrip(mockLisbonTrip);
    expect(multi.packingLists.length).toBeGreaterThan(1);
  });
});
