/**
 * Static contract for user-owned Supabase tables and account persistence readiness.
 * Verified in account-persistence-readiness.contract.test.ts.
 */

/** Tables with a direct FK to auth.users.id. */
export const DIRECT_AUTH_USER_OWNED_TABLES = [
  { table: 'profiles', ownerColumn: 'id' },
  { table: 'trips', ownerColumn: 'user_id' },
  { table: 'packing_profiles', ownerColumn: 'user_id' },
  { table: 'user_preferences', ownerColumn: 'user_id' },
] as const;

/** Profile-scoped Important tables — user_id ownership via packing_profiles composite FK + RLS. */
export const PROFILE_SCOPED_USER_OWNED_TABLES = [
  { table: 'important_profile_configs', ownerColumn: 'user_id' },
  { table: 'important_profile_items', ownerColumn: 'user_id' },
] as const;

/** Trip-scoped child tables — ownership via parent trips.user_id in RLS. */
export const TRIP_OWNED_CHILD_TABLES = [
  'trip_travelers',
  'trip_bags',
  'packing_items',
  'trip_weather',
  'trip_insights',
  'packing_lists',
] as const;

export const ACCOUNT_PERSISTENCE_SCHEMA_MIGRATIONS = [
  '20260817100000_initial_schema.sql',
  '20260905100000_mp6b1_canonical_packing_schema.sql',
  '20260911100000_user_preferences.sql',
] as const;
