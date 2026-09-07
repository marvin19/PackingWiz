-- MP6-B2 follow-up: Data API table privileges for initial-schema trip tables.
--
-- create_canonical_trip / save_canonical_trip run as SECURITY INVOKER (default).
-- The authenticated JWT role must hold table privileges on every relation the RPC
-- body reads or writes; RLS policies from initial_schema.sql then enforce ownership.
--
-- B1 canonical tables (packing_lists, packing_profiles, …) were granted in
-- 20260906110000_mp6b2_data_api_grants.sql — not repeated here.

-- ---------------------------------------------------------------------------
-- trips — create INSERT; save SELECT+UPDATE; repository SELECT+DELETE
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.trips TO authenticated;

-- ---------------------------------------------------------------------------
-- trip_travelers — upsert_trip_travelers_from_payload: DELETE, INSERT, UPDATE
-- Child RLS checks require SELECT on parent trips (granted above).
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.trip_travelers TO authenticated;

-- ---------------------------------------------------------------------------
-- trip_bags — sync_trip_bags_from_payload: DELETE, INSERT, UPDATE
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.trip_bags TO authenticated;

-- ---------------------------------------------------------------------------
-- packing_items — replace_canonical_packing_lists_from_payload + repository CRUD
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.packing_items TO authenticated;

-- ---------------------------------------------------------------------------
-- trip_weather — sync_trip_weather_from_payload: DELETE, INSERT, UPDATE (upsert)
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.trip_weather TO authenticated;

-- ---------------------------------------------------------------------------
-- trip_insights — sync_trip_insights_from_payload: DELETE, INSERT only (no UPDATE)
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, DELETE ON TABLE public.trip_insights TO authenticated;

-- ---------------------------------------------------------------------------
-- Defense in depth: unsigned anon must not access trip-owned rows directly
-- ---------------------------------------------------------------------------
REVOKE ALL ON TABLE public.trips FROM anon;
REVOKE ALL ON TABLE public.trip_travelers FROM anon;
REVOKE ALL ON TABLE public.trip_bags FROM anon;
REVOKE ALL ON TABLE public.packing_items FROM anon;
REVOKE ALL ON TABLE public.trip_weather FROM anon;
REVOKE ALL ON TABLE public.trip_insights FROM anon;
