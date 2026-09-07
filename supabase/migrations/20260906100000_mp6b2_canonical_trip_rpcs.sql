-- MP6-B2: Canonical Trip aggregate RPCs (create + save).
-- Does not modify B1 schema. SupabaseTripRepository uses these for multi-list round-trip.

-- ---------------------------------------------------------------------------
-- Shared helper: upsert compatibility trip_travelers from payload JSON array
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_trip_travelers_from_payload(
  p_trip_id UUID,
  p_travelers JSONB
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  traveler JSONB;
  v_sort INTEGER;
  v_ids TEXT[];
BEGIN
  v_ids := ARRAY(
    SELECT t.value->>'id'
    FROM jsonb_array_elements(COALESCE(p_travelers, '[]'::JSONB)) AS t(value)
  );

  DELETE FROM public.trip_travelers tt
  WHERE tt.trip_id = p_trip_id
    AND (cardinality(v_ids) = 0 OR NOT (tt.id = ANY (v_ids)));

  v_sort := 0;
  FOR traveler IN SELECT value FROM jsonb_array_elements(COALESCE(p_travelers, '[]'::JSONB))
  LOOP
    INSERT INTO public.trip_travelers (trip_id, id, name, role, age, birth_date, sort_order)
    VALUES (
      p_trip_id,
      traveler->>'id',
      traveler->>'name',
      traveler->>'role',
      NULLIF(traveler->>'age', '')::INTEGER,
      NULLIF(traveler->>'birthDate', ''),
      v_sort
    )
    ON CONFLICT (trip_id, id) DO UPDATE SET
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      age = EXCLUDED.age,
      birth_date = EXCLUDED.birth_date,
      sort_order = EXCLUDED.sort_order,
      updated_at = now();
    v_sort := v_sort + 1;
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- Shared helper: sync trip_bags from payload
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_trip_bags_from_payload(
  p_trip_id UUID,
  p_bags JSONB,
  p_travelers JSONB
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  bag JSONB;
  v_sort INTEGER;
  v_ids TEXT[];
BEGIN
  v_ids := ARRAY(
    SELECT b.value->>'id'
    FROM jsonb_array_elements(COALESCE(p_bags, '[]'::JSONB)) AS b(value)
  );

  DELETE FROM public.trip_bags tb
  WHERE tb.trip_id = p_trip_id
    AND (cardinality(v_ids) = 0 OR NOT (tb.id = ANY (v_ids)));

  v_sort := 0;
  FOR bag IN SELECT value FROM jsonb_array_elements(COALESCE(p_bags, '[]'::JSONB))
  LOOP
    IF NULLIF(bag->>'ownerId', '') IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(COALESCE(p_travelers, '[]'::JSONB)) AS t(value)
        WHERE t.value->>'id' = bag->>'ownerId'
      )
    THEN
      RAISE EXCEPTION 'Bag owner % is not a traveler on this trip', bag->>'ownerId';
    END IF;

    INSERT INTO public.trip_bags (trip_id, id, name, type, owner_id, sort_order)
    VALUES (
      p_trip_id,
      bag->>'id',
      bag->>'name',
      bag->>'type',
      NULLIF(bag->>'ownerId', ''),
      v_sort
    )
    ON CONFLICT (trip_id, id) DO UPDATE SET
      name = EXCLUDED.name,
      type = EXCLUDED.type,
      owner_id = EXCLUDED.owner_id,
      sort_order = EXCLUDED.sort_order,
      updated_at = now();
    v_sort := v_sort + 1;
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- Shared helper: sync trip_weather from payload (nullable)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_trip_weather_from_payload(
  p_trip_id UUID,
  p_weather JSONB
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_weather IS NULL OR p_weather = 'null'::JSONB THEN
    DELETE FROM public.trip_weather WHERE trip_id = p_trip_id;
    RETURN;
  END IF;

  INSERT INTO public.trip_weather (
    trip_id, mode, summary, detail, high, low, rainfall, conditions, days
  ) VALUES (
    p_trip_id,
    p_weather->>'mode',
    p_weather->>'summary',
    p_weather->>'detail',
    (p_weather->>'high')::NUMERIC,
    (p_weather->>'low')::NUMERIC,
    NULLIF(p_weather->>'rainfall', ''),
    NULLIF(p_weather->>'conditions', ''),
    p_weather->'days'
  )
  ON CONFLICT (trip_id) DO UPDATE SET
    mode = EXCLUDED.mode,
    summary = EXCLUDED.summary,
    detail = EXCLUDED.detail,
    high = EXCLUDED.high,
    low = EXCLUDED.low,
    rainfall = EXCLUDED.rainfall,
    conditions = EXCLUDED.conditions,
    days = EXCLUDED.days,
    updated_at = now();
END;
$$;

-- ---------------------------------------------------------------------------
-- Shared helper: sync trip_insights from payload (content-only contract)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_trip_insights_from_payload(
  p_trip_id UUID,
  p_insights JSONB
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  insight JSONB;
  v_sort INTEGER;
BEGIN
  DELETE FROM public.trip_insights WHERE trip_id = p_trip_id;

  v_sort := 0;
  FOR insight IN SELECT value FROM jsonb_array_elements(COALESCE(p_insights, '[]'::JSONB))
  LOOP
    INSERT INTO public.trip_insights (trip_id, content, sort_order)
    VALUES (p_trip_id, insight #>> '{}', v_sort);
    v_sort := v_sort + 1;
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- Shared helper: replace canonical packing_lists + list-scoped packing_items
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.replace_canonical_packing_lists_from_payload(
  p_trip_id UUID,
  p_packing_lists JSONB
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  list JSONB;
  item JSONB;
  v_list_id TEXT;
  v_list_sort INTEGER;
  v_item_sort INTEGER;
  v_list_ids TEXT[];
  v_item_keys TEXT[];
BEGIN
  v_list_ids := ARRAY(
    SELECT l.value->>'id'
    FROM jsonb_array_elements(COALESCE(p_packing_lists, '[]'::JSONB)) AS l(value)
  );

  -- Remove lists (and their items via FK cascade) not present in payload
  DELETE FROM public.packing_lists pl
  WHERE pl.trip_id = p_trip_id
    AND (cardinality(v_list_ids) = 0 OR NOT (pl.id = ANY (v_list_ids)));

  v_list_sort := 0;
  FOR list IN SELECT value FROM jsonb_array_elements(COALESCE(p_packing_lists, '[]'::JSONB))
  LOOP
    v_list_id := list->>'id';

    INSERT INTO public.packing_lists (
      trip_id, id, packing_profile_id, profile_snapshot, packing_mode, sort_order
    ) VALUES (
      p_trip_id,
      v_list_id,
      list->>'packingProfileId',
      list->'profileSnapshot',
      list->>'packingMode',
      v_list_sort
    )
    ON CONFLICT (trip_id, id) DO UPDATE SET
      packing_profile_id = EXCLUDED.packing_profile_id,
      profile_snapshot = EXCLUDED.profile_snapshot,
      packing_mode = EXCLUDED.packing_mode,
      sort_order = EXCLUDED.sort_order,
      updated_at = now();

    v_item_keys := ARRAY(
      SELECT i.value->>'id'
      FROM jsonb_array_elements(COALESCE(list->'items', '[]'::JSONB)) AS i(value)
    );

    DELETE FROM public.packing_items pi
    WHERE pi.trip_id = p_trip_id
      AND pi.packing_list_id = v_list_id
      AND (cardinality(v_item_keys) = 0 OR NOT (pi.id = ANY (v_item_keys)));

    v_item_sort := 0;
    FOR item IN SELECT value FROM jsonb_array_elements(COALESCE(list->'items', '[]'::JSONB))
    LOOP
      INSERT INTO public.packing_items (
        trip_id, packing_list_id, id, name, quantity, category, packed, need_to_buy,
        assigned_to, note, source, important_item_id, sort_order
      ) VALUES (
        p_trip_id,
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
        v_item_sort
      )
      ON CONFLICT (trip_id, id) DO UPDATE SET
        packing_list_id = EXCLUDED.packing_list_id,
        name = EXCLUDED.name,
        quantity = EXCLUDED.quantity,
        category = EXCLUDED.category,
        packed = EXCLUDED.packed,
        need_to_buy = EXCLUDED.need_to_buy,
        assigned_to = EXCLUDED.assigned_to,
        note = EXCLUDED.note,
        source = EXCLUDED.source,
        important_item_id = EXCLUDED.important_item_id,
        sort_order = EXCLUDED.sort_order,
        updated_at = now();
      v_item_sort := v_item_sort + 1;
    END LOOP;

    v_list_sort := v_list_sort + 1;
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- create_canonical_trip — atomic aggregate insert (1..N packing lists)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_canonical_trip(payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_trip_id UUID;
  v_user_id UUID;
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
    COALESCE((payload->>'generated')::BOOLEAN, FALSE),
    COALESCE(payload->>'status', 'upcoming'),
    NULLIF(payload->>'image', '')
  );

  PERFORM public.upsert_trip_travelers_from_payload(v_trip_id, payload->'travelers');
  PERFORM public.replace_canonical_packing_lists_from_payload(v_trip_id, payload->'packingLists');
  PERFORM public.sync_trip_bags_from_payload(v_trip_id, payload->'bags', payload->'travelers');
  PERFORM public.sync_trip_weather_from_payload(v_trip_id, payload->'weather');
  PERFORM public.sync_trip_insights_from_payload(v_trip_id, payload->'insights');

  RETURN v_trip_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_canonical_trip(JSONB) TO authenticated;

-- ---------------------------------------------------------------------------
-- save_canonical_trip — atomic aggregate upsert for an owned trip
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.save_canonical_trip(payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_trip_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_trip_id := (payload->>'id')::UUID;
  IF v_trip_id IS NULL THEN
    RAISE EXCEPTION 'Trip id is required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.trips t WHERE t.id = v_trip_id AND t.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Trip not found or not owned by current user';
  END IF;

  UPDATE public.trips SET
    title = payload->>'title',
    destination = payload->>'destination',
    country = COALESCE(payload->>'country', ''),
    start_date = (payload->>'startDate')::DATE,
    end_date = (payload->>'endDate')::DATE,
    accommodation = COALESCE(payload->>'accommodation', 'hotel'),
    laundry = COALESCE(payload->>'laundry', 'unsure'),
    note = COALESCE(payload->>'note', ''),
    types = COALESCE(ARRAY(SELECT jsonb_array_elements_text(payload->'types')), '{}'),
    activities = COALESCE(ARRAY(SELECT jsonb_array_elements_text(payload->'activities')), '{}'),
    generated = COALESCE((payload->>'generated')::BOOLEAN, FALSE),
    status = COALESCE(payload->>'status', 'upcoming'),
    image = NULLIF(payload->>'image', ''),
    updated_at = now()
  WHERE id = v_trip_id;

  PERFORM public.upsert_trip_travelers_from_payload(v_trip_id, payload->'travelers');
  PERFORM public.replace_canonical_packing_lists_from_payload(v_trip_id, payload->'packingLists');
  PERFORM public.sync_trip_bags_from_payload(v_trip_id, payload->'bags', payload->'travelers');
  PERFORM public.sync_trip_weather_from_payload(v_trip_id, payload->'weather');
  PERFORM public.sync_trip_insights_from_payload(v_trip_id, payload->'insights');

  RETURN v_trip_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_canonical_trip(JSONB) TO authenticated;
