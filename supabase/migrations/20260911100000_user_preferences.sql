-- Phase 4: user-scoped packing preferences (smart quantities, metric units).
-- packing_reminders remains session-only until notifications ship.

CREATE TABLE public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  smart_quantities BOOLEAN NOT NULL DEFAULT true,
  metric_units BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_preferences_select_own ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_preferences_insert_own ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_preferences_update_own ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);
