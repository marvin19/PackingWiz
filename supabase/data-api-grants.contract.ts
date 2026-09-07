/**
 * Static contract for MP6-B1/B2 Supabase Data API privileges.
 * Verified against migration SQL in data-api-grants.contract.test.ts.
 *
 * Local PostgreSQL integration is not required — this documents expected grants
 * for review and CI parsing only.
 */

/** B1 tables accessed directly by Supabase JS (not only via RPC). */
export const MP6B1_AUTHENTICATED_TABLE_GRANTS = [
  'packing_profiles',
  'important_profile_configs',
  'important_profile_items',
  'packing_lists',
] as const;

/**
 * Initial-schema trip tables touched by SECURITY INVOKER canonical RPCs and/or
 * SupabaseTripRepository direct Data API access.
 */
export const MP6B2_EXISTING_TRIP_TABLE_GRANTS = {
  trips: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
  trip_travelers: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
  trip_bags: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
  packing_items: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
  trip_weather: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
  trip_insights: ['SELECT', 'INSERT', 'DELETE'],
} as const satisfies Record<string, readonly ('SELECT' | 'INSERT' | 'UPDATE' | 'DELETE')[]>;

/**
 * Every table written/read by create_canonical_trip / save_canonical_trip (incl. helpers).
 * Used by contract tests to ensure grants exist across B1 + trip-table migrations.
 */
export const MP6B2_CANONICAL_RPC_TABLE_DEPENDENCIES = [
  'trips',
  'trip_travelers',
  'packing_lists',
  'packing_items',
  'trip_bags',
  'trip_weather',
  'trip_insights',
] as const;

/** B2 aggregate RPCs callable through Supabase JS `.rpc()`. */
export const MP6B2_AUTHENTICATED_RPC_EXECUTES = [
  'create_canonical_trip',
  'save_canonical_trip',
] as const;

/**
 * B2 helper functions — internal to RPC bodies only; must NOT receive EXECUTE
 * grants to authenticated/anon (Data API would otherwise expose them).
 */
export const MP6B2_INTERNAL_RPC_HELPERS = [
  'upsert_trip_travelers_from_payload',
  'sync_trip_bags_from_payload',
  'sync_trip_weather_from_payload',
  'sync_trip_insights_from_payload',
  'replace_canonical_packing_lists_from_payload',
] as const;

export const MP6B2_DATA_API_GRANTS_MIGRATION = '20260906110000_mp6b2_data_api_grants.sql';

export const MP6B2_TRIP_TABLE_DATA_API_GRANTS_MIGRATION =
  '20260906120000_mp6b2_trip_table_data_api_grants.sql';

export const MP6B2_CANONICAL_RPCS_MIGRATION = '20260906100000_mp6b2_canonical_trip_rpcs.sql';

export const INITIAL_SCHEMA_MIGRATION = '20260817100000_initial_schema.sql';

/** Full SELECT/INSERT/UPDATE/DELETE — used for B1 tables and most trip tables. */
export const AUTHENTICATED_TABLE_PRIVILEGES = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'] as const;

/** Maps each RPC dependency table to the migration file that grants authenticated access. */
export const MP6B2_RPC_TABLE_GRANT_MIGRATIONS: Record<
  (typeof MP6B2_CANONICAL_RPC_TABLE_DEPENDENCIES)[number],
  string
> = {
  trips: MP6B2_TRIP_TABLE_DATA_API_GRANTS_MIGRATION,
  trip_travelers: MP6B2_TRIP_TABLE_DATA_API_GRANTS_MIGRATION,
  packing_lists: MP6B2_DATA_API_GRANTS_MIGRATION,
  packing_items: MP6B2_TRIP_TABLE_DATA_API_GRANTS_MIGRATION,
  trip_bags: MP6B2_TRIP_TABLE_DATA_API_GRANTS_MIGRATION,
  trip_weather: MP6B2_TRIP_TABLE_DATA_API_GRANTS_MIGRATION,
  trip_insights: MP6B2_TRIP_TABLE_DATA_API_GRANTS_MIGRATION,
};
