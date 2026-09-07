-- MP6-B2 follow-up: Data API table privileges for B1 canonical tables.
--
-- B1 enabled RLS on these tables but did not GRANT table privileges to the
-- Supabase API roles. Without GRANT, PostgREST/Supabase JS returns:
--   permission denied for table …
-- even when RLS policies would allow the row.
--
-- Runtime: anonymous sign-in produces a JWT with role `authenticated`
-- (auth.uid() is set). The `anon` role applies only to unsigned requests.
--
-- RLS remains authoritative for row ownership; grants only permit the role
-- to attempt operations that RLS then filters.

-- ---------------------------------------------------------------------------
-- B1 canonical tables — direct repository access (ProfileProvider, trip load)
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.packing_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.important_profile_configs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.important_profile_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.packing_lists TO authenticated;

-- Defense in depth: unsigned anon key must not mutate/read profile or list rows.
REVOKE ALL ON TABLE public.packing_profiles FROM anon;
REVOKE ALL ON TABLE public.important_profile_configs FROM anon;
REVOKE ALL ON TABLE public.important_profile_items FROM anon;
REVOKE ALL ON TABLE public.packing_lists FROM anon;

-- ---------------------------------------------------------------------------
-- B2 RPCs (re-assert; already granted in 20260906100000 — idempotent)
-- Helper functions are invoked only via PERFORM inside these RPCs, not exposed
-- to Data API callers, and intentionally have no EXECUTE grant to authenticated.
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.create_canonical_trip(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_canonical_trip(JSONB) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_canonical_trip(JSONB) FROM anon;
REVOKE EXECUTE ON FUNCTION public.save_canonical_trip(JSONB) FROM anon;
