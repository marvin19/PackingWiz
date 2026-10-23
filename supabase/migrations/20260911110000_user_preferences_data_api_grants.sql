-- Data API privileges for user_preferences.
-- Anonymous sign-in uses the authenticated role; unsigned anon must not access rows.

GRANT SELECT, INSERT, UPDATE ON TABLE public.user_preferences TO authenticated;

REVOKE ALL ON TABLE public.user_preferences FROM anon;
