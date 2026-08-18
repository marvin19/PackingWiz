-- PackingWiz initial schema
-- Run via Supabase CLI: supabase db push
-- Or paste into Supabase Dashboard → SQL Editor

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (one row per auth user; supports future account linking)
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Trips
-- Domain mapping notes:
--   types, activities        → text[] (TripTypeId[], activity ids)
--   accommodation, laundry   → text catalog ids
--   status                   → 'upcoming' | 'past'
-- ---------------------------------------------------------------------------
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT '',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  accommodation TEXT NOT NULL DEFAULT 'hotel',
  laundry TEXT NOT NULL DEFAULT 'unsure',
  note TEXT NOT NULL DEFAULT '',
  types TEXT[] NOT NULL DEFAULT '{}',
  activities TEXT[] NOT NULL DEFAULT '{}',
  generated BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'upcoming',
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trips_user_id ON public.trips (user_id);
CREATE INDEX idx_trips_created_at ON public.trips (created_at DESC);

-- ---------------------------------------------------------------------------
-- Travelers
-- Domain Traveler.id is scoped to the trip (e.g. t-you, t-anna).
-- Composite PK (trip_id, id) avoids global collisions across trips/users.
-- ---------------------------------------------------------------------------
CREATE TABLE public.trip_travelers (
  trip_id UUID NOT NULL REFERENCES public.trips (id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  age INTEGER,
  birth_date TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (trip_id, id)
);

-- ---------------------------------------------------------------------------
-- Bags
-- owner_id references a traveler on the same trip (nullable = shared bag).
-- Composite FK prevents cross-trip owner references.
-- ---------------------------------------------------------------------------
CREATE TABLE public.trip_bags (
  trip_id UUID NOT NULL REFERENCES public.trips (id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  owner_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (trip_id, id),
  CONSTRAINT trip_bags_owner_same_trip_fkey
    FOREIGN KEY (trip_id, owner_id)
    REFERENCES public.trip_travelers (trip_id, id)
    ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- Packing items
-- assigned_to references a traveler on the same trip (nullable = shared).
-- Composite PK + FK prevent cross-trip ID collisions and invalid assignments.
-- ---------------------------------------------------------------------------
CREATE TABLE public.packing_items (
  trip_id UUID NOT NULL REFERENCES public.trips (id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  category TEXT NOT NULL,
  packed BOOLEAN NOT NULL DEFAULT false,
  need_to_buy BOOLEAN NOT NULL DEFAULT false,
  assigned_to TEXT,
  note TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (trip_id, id),
  CONSTRAINT packing_items_assigned_same_trip_fkey
    FOREIGN KEY (trip_id, assigned_to)
    REFERENCES public.trip_travelers (trip_id, id)
    ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- Weather snapshot (1:1 with trip)
-- days stored as JSONB → TripWeather.days (WeatherDay[])
-- ---------------------------------------------------------------------------
CREATE TABLE public.trip_weather (
  trip_id UUID PRIMARY KEY REFERENCES public.trips (id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  summary TEXT NOT NULL,
  detail TEXT NOT NULL,
  high NUMERIC NOT NULL,
  low NUMERIC NOT NULL,
  rainfall TEXT,
  conditions TEXT,
  days JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Insights (domain Trip.insights: string[])
-- ---------------------------------------------------------------------------
CREATE TABLE public.trip_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips (id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trip_insights_trip_id ON public.trip_insights (trip_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_trip_travelers_updated_at
  BEFORE UPDATE ON public.trip_travelers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_trip_bags_updated_at
  BEFORE UPDATE ON public.trip_bags
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_packing_items_updated_at
  BEFORE UPDATE ON public.packing_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_trip_weather_updated_at
  BEFORE UPDATE ON public.trip_weather
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create profile on auth user creation (incl. anonymous users)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Atomic trip creation (single transaction; rolls back on any failure)
-- Payload shape matches tripToCreatePayload() in trip-mapper.ts
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_trip_with_details(payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_trip_id UUID;
  v_user_id UUID;
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
      trip_id, id, name, quantity, category, packed, need_to_buy, assigned_to, note, sort_order
    ) VALUES (
      v_trip_id,
      item->>'id',
      item->>'name',
      COALESCE((item->>'quantity')::INTEGER, 1),
      item->>'category',
      COALESCE((item->>'packed')::BOOLEAN, FALSE),
      COALESCE((item->>'needToBuy')::BOOLEAN, FALSE),
      NULLIF(item->>'assignedTo', ''),
      NULLIF(item->>'note', ''),
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

GRANT EXECUTE ON FUNCTION public.create_trip_with_details(JSONB) TO authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Strategy:
--   • trips: direct user_id = auth.uid() ownership
--   • child tables: ownership verified via parent trip join
--   • Anonymous Supabase users are authenticated (auth.uid() is set)
--   • No client-side filtering replaces RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_travelers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_bags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_weather ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_insights ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- trips
CREATE POLICY trips_select_own ON public.trips
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY trips_insert_own ON public.trips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY trips_update_own ON public.trips
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY trips_delete_own ON public.trips
  FOR DELETE USING (auth.uid() = user_id);

-- trip_travelers
CREATE POLICY trip_travelers_select_own ON public.trip_travelers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_travelers.trip_id AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY trip_travelers_insert_own ON public.trip_travelers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_travelers.trip_id AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY trip_travelers_update_own ON public.trip_travelers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_travelers.trip_id AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY trip_travelers_delete_own ON public.trip_travelers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_travelers.trip_id AND trips.user_id = auth.uid()
    )
  );

-- trip_bags
CREATE POLICY trip_bags_select_own ON public.trip_bags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_bags.trip_id AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY trip_bags_insert_own ON public.trip_bags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_bags.trip_id AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY trip_bags_update_own ON public.trip_bags
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_bags.trip_id AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY trip_bags_delete_own ON public.trip_bags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_bags.trip_id AND trips.user_id = auth.uid()
    )
  );

-- packing_items
CREATE POLICY packing_items_select_own ON public.packing_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = packing_items.trip_id AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY packing_items_insert_own ON public.packing_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = packing_items.trip_id AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY packing_items_update_own ON public.packing_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = packing_items.trip_id AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY packing_items_delete_own ON public.packing_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = packing_items.trip_id AND trips.user_id = auth.uid()
    )
  );

-- trip_weather
CREATE POLICY trip_weather_select_own ON public.trip_weather
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_weather.trip_id AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY trip_weather_insert_own ON public.trip_weather
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_weather.trip_id AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY trip_weather_update_own ON public.trip_weather
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_weather.trip_id AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY trip_weather_delete_own ON public.trip_weather
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_weather.trip_id AND trips.user_id = auth.uid()
    )
  );

-- trip_insights
CREATE POLICY trip_insights_select_own ON public.trip_insights
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_insights.trip_id AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY trip_insights_insert_own ON public.trip_insights
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_insights.trip_id AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY trip_insights_update_own ON public.trip_insights
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_insights.trip_id AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY trip_insights_delete_own ON public.trip_insights
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_insights.trip_id AND trips.user_id = auth.uid()
    )
  );
