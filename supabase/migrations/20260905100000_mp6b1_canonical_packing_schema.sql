-- MP6-B1: Canonical Supabase persistence schema for multi-person packing.
-- Establishes packing_lists, list-scoped packing_items, reusable packing_profiles,
-- and profile-scoped Important master tables. Backfills flat trips into one
-- compatibility PackingList per trip. Full repository round-trip lands in MP6-B2.

-- ---------------------------------------------------------------------------
-- Reusable Packing Profiles (distinct from auth `profiles` table)
-- Domain id is stable per user (e.g. profile-self, profile-emilie) — not name-based.
-- Draft-only `draft-profile-*` ids must NOT be persisted (repository boundary).
-- ---------------------------------------------------------------------------
CREATE TABLE public.packing_profiles (
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  birth_date TEXT,
  is_self BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);

CREATE INDEX idx_packing_profiles_user_id ON public.packing_profiles (user_id);

-- ---------------------------------------------------------------------------
-- Important master configuration (one row per reusable Packing Profile)
-- ---------------------------------------------------------------------------
CREATE TABLE public.important_profile_configs (
  user_id UUID NOT NULL,
  packing_profile_id TEXT NOT NULL,
  is_configured BOOLEAN NOT NULL DEFAULT false,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  prompt_dismissed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, packing_profile_id),
  CONSTRAINT important_profile_configs_profile_fkey
    FOREIGN KEY (user_id, packing_profile_id)
    REFERENCES public.packing_profiles (user_id, id)
    ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- Important master items (ordered; snapshots on PackingList items are separate)
-- ---------------------------------------------------------------------------
CREATE TABLE public.important_profile_items (
  user_id UUID NOT NULL,
  packing_profile_id TEXT NOT NULL,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, packing_profile_id, id),
  CONSTRAINT important_profile_items_profile_fkey
    FOREIGN KEY (user_id, packing_profile_id)
    REFERENCES public.packing_profiles (user_id, id)
    ON DELETE CASCADE
);

CREATE INDEX idx_important_profile_items_profile
  ON public.important_profile_items (user_id, packing_profile_id);

-- ---------------------------------------------------------------------------
-- Packing lists (first-class; Trip owns 1..N lists)
-- No authoritative "primary person" column — compatibility primary is ingress-only.
-- ---------------------------------------------------------------------------
CREATE TABLE public.packing_lists (
  trip_id UUID NOT NULL REFERENCES public.trips (id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  packing_profile_id TEXT NOT NULL,
  profile_snapshot JSONB NOT NULL,
  packing_mode TEXT NOT NULL CHECK (packing_mode IN ('generated', 'manual')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (trip_id, id),
  CONSTRAINT packing_lists_trip_profile_unique UNIQUE (trip_id, packing_profile_id)
);

CREATE INDEX idx_packing_lists_trip_id ON public.packing_lists (trip_id);

-- ---------------------------------------------------------------------------
-- List-scoped packing items
-- assigned_to remains non-authoritative legacy metadata (single-list compat).
-- ---------------------------------------------------------------------------
ALTER TABLE public.packing_items
  ADD COLUMN packing_list_id TEXT,
  ADD COLUMN source TEXT CHECK (source IS NULL OR source IN ('generated', 'important')),
  -- Intentional snapshot link to profile Important master — NOT an FK so historical
  -- list rows survive if the reusable master item is later deleted or renamed.
  ADD COLUMN important_item_id TEXT;

-- ---------------------------------------------------------------------------
-- Forward migration: flat Trip + flat packing_items → one compatibility list
--
-- Mirrors buildPrimaryProfileSnapshot / buildPrimaryPackingList (trip-compatibility.ts).
-- Does NOT infer multiple PackingLists from assignedTo or extra trip_travelers rows.
--
-- Deterministic cases:
--   A. Explicit self traveler (id = t-you OR name = You) → copy name/age/birthDate;
--      packing_profile_id = {tripId}-profile-self (compatibility ingress id, not profile-self)
--   B. Sole/other travelers with non-default ids/names → NOT promoted to primary identity;
--      snapshot falls through to synthetic Me (domain: never infer self from first traveler)
--   C. No trip_travelers / no recoverable self marker → synthetic Me, isSelf true
--   D. Additional legacy travelers present → ignored for list creation; still exactly one list
--
-- profile_snapshot is a denormalized list-owned copy — NOT an authorization source.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  trip_rec RECORD;
  v_list_id TEXT;
  v_profile_id TEXT;
  v_snapshot JSONB;
  v_self_name TEXT;
  v_self_age INTEGER;
  v_self_birth_date TEXT;
BEGIN
  FOR trip_rec IN SELECT id, generated FROM public.trips LOOP
    IF EXISTS (SELECT 1 FROM public.packing_lists pl WHERE pl.trip_id = trip_rec.id) THEN
      CONTINUE;
    END IF;

    v_list_id := trip_rec.id::text || '-list-primary';
    v_profile_id := trip_rec.id::text || '-profile-self';

    v_self_name := NULL;
    v_self_age := NULL;
    v_self_birth_date := NULL;

    SELECT tt.name, tt.age, tt.birth_date
    INTO v_self_name, v_self_age, v_self_birth_date
    FROM public.trip_travelers tt
    WHERE tt.trip_id = trip_rec.id
      AND (tt.id = 't-you' OR tt.name = 'You')
    ORDER BY tt.sort_order
    LIMIT 1;

    v_snapshot := jsonb_build_object(
      'id', v_profile_id,
      'name', COALESCE(v_self_name, 'Me'),
      'isSelf', true
    );

    IF v_self_age IS NOT NULL THEN
      v_snapshot := v_snapshot || jsonb_build_object('age', v_self_age);
    END IF;

    IF v_self_birth_date IS NOT NULL THEN
      v_snapshot := v_snapshot || jsonb_build_object('birthDate', v_self_birth_date);
    END IF;

    INSERT INTO public.packing_lists (
      trip_id, id, packing_profile_id, profile_snapshot, packing_mode, sort_order
    ) VALUES (
      trip_rec.id,
      v_list_id,
      v_profile_id,
      v_snapshot,
      CASE WHEN trip_rec.generated THEN 'generated' ELSE 'manual' END,
      0
    );

    UPDATE public.packing_items pi
    SET packing_list_id = v_list_id
    WHERE pi.trip_id = trip_rec.id
      AND pi.packing_list_id IS NULL;
  END LOOP;
END $$;

-- Fail loud if any item would violate NOT NULL / FK (do not delete rows to satisfy constraints).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.packing_items WHERE packing_list_id IS NULL) THEN
    RAISE EXCEPTION
      'MP6-B1 migration: packing_items rows remain without packing_list_id after backfill';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.packing_items pi
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.packing_lists pl
      WHERE pl.trip_id = pi.trip_id AND pl.id = pi.packing_list_id
    )
  ) THEN
    RAISE EXCEPTION
      'MP6-B1 migration: packing_items reference missing packing_lists row';
  END IF;
END $$;
ALTER TABLE public.packing_items
  ALTER COLUMN packing_list_id SET NOT NULL;

ALTER TABLE public.packing_items
  ADD CONSTRAINT packing_items_list_same_trip_fkey
    FOREIGN KEY (trip_id, packing_list_id)
    REFERENCES public.packing_lists (trip_id, id)
    ON DELETE CASCADE;

CREATE INDEX idx_packing_items_trip_list
  ON public.packing_items (trip_id, packing_list_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers (new tables)
-- ---------------------------------------------------------------------------
CREATE TRIGGER set_packing_profiles_updated_at
  BEFORE UPDATE ON public.packing_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_important_profile_configs_updated_at
  BEFORE UPDATE ON public.important_profile_configs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_important_profile_items_updated_at
  BEFORE UPDATE ON public.important_profile_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_packing_lists_updated_at
  BEFORE UPDATE ON public.packing_lists
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- create_trip_with_details — compatibility path until MP6-B2
-- Inserts one compatibility PackingList and attaches flat items to it.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_trip_with_details(payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_trip_id UUID;
  v_user_id UUID;
  v_list_id TEXT;
  v_profile_id TEXT;
  v_snapshot JSONB;
  self_traveler JSONB;
  traveler JSONB;
  bag JSONB;
  item JSONB;
  insight JSONB;
  v_sort INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_trip_id := COALESCE(NULLIF(payload->>'id', '')::UUID, gen_random_uuid());
  v_list_id := v_trip_id::text || '-list-primary';
  v_profile_id := v_trip_id::text || '-profile-self';

  INSERT INTO public.trips (
    id, user_id, title, destination, country, start_date, end_date,
    accommodation, laundry, note, types, activities, generated, status, image
  ) VALUES (
    v_trip_id,
    v_user_id,
    payload->>'title',
    payload->>'destination',
    COALESCE(payload->>'country', ''),
    (payload->>'startDate')::DATE,
    (payload->>'endDate')::DATE,
    COALESCE(payload->>'accommodation', 'hotel'),
    COALESCE(payload->>'laundry', 'unsure'),
    COALESCE(payload->>'note', ''),
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(payload->'types')), '{}'),
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(payload->'activities')), '{}'),
    COALESCE((payload->>'generated')::BOOLEAN, TRUE),
    COALESCE(payload->>'status', 'upcoming'),
    NULLIF(payload->>'image', '')
  );

  v_sort := 0;
  FOR traveler IN SELECT value FROM jsonb_array_elements(COALESCE(payload->'travelers', '[]'::JSONB))
  LOOP
    INSERT INTO public.trip_travelers (trip_id, id, name, role, age, birth_date, sort_order)
    VALUES (
      v_trip_id,
      traveler->>'id',
      traveler->>'name',
      traveler->>'role',
      NULLIF(traveler->>'age', '')::INTEGER,
      NULLIF(traveler->>'birthDate', ''),
      v_sort
    );
    v_sort := v_sort + 1;
  END LOOP;

  -- Compatibility profile snapshot for the single flat list
  SELECT value INTO self_traveler
  FROM jsonb_array_elements(COALESCE(payload->'travelers', '[]'::JSONB)) AS t(value)
  WHERE t.value->>'id' = 't-you' OR t.value->>'name' = 'You'
  LIMIT 1;

  v_snapshot := jsonb_build_object(
    'id', v_profile_id,
    'name', COALESCE(self_traveler->>'name', 'Me'),
    'isSelf', true
  );

  IF NULLIF(self_traveler->>'age', '') IS NOT NULL THEN
    v_snapshot := v_snapshot || jsonb_build_object('age', (self_traveler->>'age')::INTEGER);
  END IF;

  IF NULLIF(self_traveler->>'birthDate', '') IS NOT NULL THEN
    v_snapshot := v_snapshot || jsonb_build_object('birthDate', self_traveler->>'birthDate');
  END IF;

  INSERT INTO public.packing_lists (
    trip_id, id, packing_profile_id, profile_snapshot, packing_mode, sort_order
  ) VALUES (
    v_trip_id,
    v_list_id,
    v_profile_id,
    v_snapshot,
    CASE WHEN COALESCE((payload->>'generated')::BOOLEAN, TRUE) THEN 'generated' ELSE 'manual' END,
    0
  );

  v_sort := 0;
  FOR bag IN SELECT value FROM jsonb_array_elements(COALESCE(payload->'bags', '[]'::JSONB))
  LOOP
    IF NULLIF(bag->>'ownerId', '') IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(COALESCE(payload->'travelers', '[]'::JSONB)) AS t(value)
        WHERE t.value->>'id' = bag->>'ownerId'
      )
    THEN
      RAISE EXCEPTION 'Bag owner % is not a traveler on this trip', bag->>'ownerId';
    END IF;

    INSERT INTO public.trip_bags (trip_id, id, name, type, owner_id, sort_order)
    VALUES (
      v_trip_id,
      bag->>'id',
      bag->>'name',
      bag->>'type',
      NULLIF(bag->>'ownerId', ''),
      v_sort
    );
    v_sort := v_sort + 1;
  END LOOP;

  v_sort := 0;
  FOR item IN SELECT value FROM jsonb_array_elements(COALESCE(payload->'items', '[]'::JSONB))
  LOOP
    IF NULLIF(item->>'assignedTo', '') IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(COALESCE(payload->'travelers', '[]'::JSONB)) AS t(value)
        WHERE t.value->>'id' = item->>'assignedTo'
      )
    THEN
      RAISE EXCEPTION 'Packing item assignee % is not a traveler on this trip', item->>'assignedTo';
    END IF;

    INSERT INTO public.packing_items (
      trip_id, packing_list_id, id, name, quantity, category, packed, need_to_buy,
      assigned_to, note, source, important_item_id, sort_order
    ) VALUES (
      v_trip_id,
      v_list_id,
      item->>'id',
      item->>'name',
      COALESCE((item->>'quantity')::INTEGER, 1),
      item->>'category',
      COALESCE((item->>'packed')::BOOLEAN, FALSE),
      COALESCE((item->>'needToBuy')::BOOLEAN, FALSE),
      NULLIF(item->>'assignedTo', ''),
      NULLIF(item->>'note', ''),
      NULLIF(item->>'source', ''),
      NULLIF(item->>'importantItemId', ''),
      v_sort
    );
    v_sort := v_sort + 1;
  END LOOP;

  IF payload->'weather' IS NOT NULL AND payload->'weather' <> 'null'::JSONB THEN
    INSERT INTO public.trip_weather (
      trip_id, mode, summary, detail, high, low, rainfall, conditions, days
    ) VALUES (
      v_trip_id,
      payload->'weather'->>'mode',
      payload->'weather'->>'summary',
      payload->'weather'->>'detail',
      (payload->'weather'->>'high')::NUMERIC,
      (payload->'weather'->>'low')::NUMERIC,
      NULLIF(payload->'weather'->>'rainfall', ''),
      NULLIF(payload->'weather'->>'conditions', ''),
      payload->'weather'->'days'
    );
  END IF;

  v_sort := 0;
  FOR insight IN SELECT value FROM jsonb_array_elements(COALESCE(payload->'insights', '[]'::JSONB))
  LOOP
    INSERT INTO public.trip_insights (trip_id, content, sort_order)
    VALUES (v_trip_id, insight #>> '{}', v_sort);
    v_sort := v_sort + 1;
  END LOOP;

  RETURN v_trip_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security (same ownership model as existing child tables)
-- ---------------------------------------------------------------------------
ALTER TABLE public.packing_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.important_profile_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.important_profile_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packing_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY packing_profiles_select_own ON public.packing_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY packing_profiles_insert_own ON public.packing_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY packing_profiles_update_own ON public.packing_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY packing_profiles_delete_own ON public.packing_profiles
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY important_profile_configs_select_own ON public.important_profile_configs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY important_profile_configs_insert_own ON public.important_profile_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY important_profile_configs_update_own ON public.important_profile_configs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY important_profile_configs_delete_own ON public.important_profile_configs
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY important_profile_items_select_own ON public.important_profile_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY important_profile_items_insert_own ON public.important_profile_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY important_profile_items_update_own ON public.important_profile_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY important_profile_items_delete_own ON public.important_profile_items
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY packing_lists_select_own ON public.packing_lists
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = packing_lists.trip_id AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY packing_lists_insert_own ON public.packing_lists
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = packing_lists.trip_id AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY packing_lists_update_own ON public.packing_lists
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = packing_lists.trip_id AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY packing_lists_delete_own ON public.packing_lists
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = packing_lists.trip_id AND trips.user_id = auth.uid()
    )
  );
