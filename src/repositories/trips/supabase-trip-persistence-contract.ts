/**
 * MP6-B1 — Supabase canonical persistence contract (implementation in MP6-B2).
 *
 * This module documents the repository/schema boundary established by B1.
 * MP6-B2 — Supabase canonical repository implementation complete (local).
 * Multi-list save guards removed from SupabaseTripRepository.
 */

import type { ImportantItemsConfig } from '@/domain/important-items-config';
import type { PackingItem } from '@/domain/packing-item';
import type { PackingProfile } from '@/domain/packing-profile';
import type { Trip } from '@/domain/trip';

/**
 * ## Canonical storage model
 *
 * ```
 * auth.users
 *   └── packing_profiles (reusable people — NOT deleted with trips)
 *         └── important_profile_configs + important_profile_items (master)
 *
 * trips (shared journey)
 *   ├── trip_weather, trip_insights, trip_bags, trip_travelers (legacy compat)
 *   └── packing_lists (1..N — first-class)
 *         └── packing_items (list-scoped; CASCADE on list delete)
 * ```
 *
 * ### Ownership rules
 * - **Trip delete** cascades: packing_lists → packing_items, trip_weather, trip_insights,
 *   trip_bags, trip_travelers. Does **not** delete packing_profiles or Important masters.
 * - **PackingList delete** cascades its packing_items only.
 * - **Profile snapshots** on packing_lists are immutable list-owned copies; editing a
 *   reusable packing_profile does not mutate historical lists.
 * - **Important snapshots** on list items may retain `importantItemId`; master changes
 *   do not auto-sync to existing lists.
 *
 * ### Non-authoritative legacy fields (retained for migration)
 * - `trips.generated` — mirror of compatibility-primary list mode until B2 write path drops it
 * - `trip_travelers` — legacy assembly metadata; canonical people = profile snapshots
 * - `packing_items.assigned_to` — transitional label, not list ownership
 *
 * ### Deferred (outside B1/B2 unless promoted)
 * - StoredTripDraft persistence
 * - Structured Insight category/title columns (content-only trip_insights unchanged)
 * - Weather manual override
 *
 * Migration: `supabase/migrations/20260905100000_mp6b1_canonical_packing_schema.sql`
 * Mappers: `src/repositories/trips/mappers/supabase-canonical-mapper.ts`
 *
 * **Deployment ordering:** apply B1 SQL migration before deploying app builds that write
 * `packing_list_id` / `source` / `important_item_id` on packing_items upserts.
 */

/** Select graph for canonical trip load (MP6-B2). */
export const CANONICAL_TRIP_SELECT = `
  *,
  packing_lists (*),
  packing_items (*),
  trip_bags (*),
  trip_weather (*),
  trip_insights (*)
`;

/** MP6-B2 must implement these TripRepository semantics against nested schema. */
export interface SupabaseCanonicalTripPersistenceContract {
  /** Load full aggregate; hydrate Trip.packingLists[] from packing_lists + list-scoped items. */
  loadTrip(id: string): Promise<Trip | null>;

  /**
   * Upsert trip metadata + all packing_lists + all list-scoped packing_items atomically.
   * Must not flatten multi-list trips to primary list only.
   */
  saveTripAggregate(trip: Trip): Promise<Trip>;

  /**
   * createTrip with 1..N packing lists — removes current multi-list create guard when implemented.
   * Reusable profiles referenced by lists may be upserted when rememberForFutureTrips applies.
   */
  createTripAggregate(trip: Trip): Promise<Trip>;

  /** List-scoped item mutations — packingListId required when trip has 2+ lists. */
  updateTripPackingItems(tripId: string, items: PackingItem[], packingListId: string): Promise<Trip>;

  /** Permanent trip delete — cascades lists/items; profiles survive. */
  deleteTrip(id: string): Promise<void>;
}

/** Profile + Important master persistence (MP6-B2 — likely ProfileProvider backing store). */
export interface SupabasePackingProfilePersistenceContract {
  loadProfiles(userId: string): Promise<PackingProfile[]>;
  saveProfile(userId: string, profile: PackingProfile): Promise<PackingProfile>;
  deleteProfile(userId: string, profileId: string): Promise<void>;

  loadImportantMaster(userId: string, profileId: string): Promise<ImportantItemsConfig>;
  saveImportantMaster(
    userId: string,
    profileId: string,
    config: ImportantItemsConfig,
  ): Promise<ImportantItemsConfig>;
}

/** Guards intentionally retained until B2 — see supabase-trip-save-guard.ts */
