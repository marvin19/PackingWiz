import type { WeatherDay } from '@/domain/weather';

/** Reusable PackingProfile row — scoped by (user_id, id). */
export interface DbPackingProfileRow {
  user_id: string;
  id: string;
  name: string;
  age: number | null;
  birth_date: string | null;
  is_self: boolean;
  created_at?: string;
  updated_at?: string;
}

/** ImportantItemsConfig metadata for one reusable profile. */
export interface DbImportantProfileConfigRow {
  user_id: string;
  packing_profile_id: string;
  is_configured: boolean;
  is_enabled: boolean;
  prompt_dismissed: boolean;
  updated_at: string | null;
  created_at?: string;
}

/** Ordered Important master item for one reusable profile. */
export interface DbImportantProfileItemRow {
  user_id: string;
  packing_profile_id: string;
  id: string;
  name: string;
  quantity: number;
  enabled: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

/** First-class PackingList row on a Trip. */
export interface DbPackingListRow {
  trip_id: string;
  id: string;
  packing_profile_id: string;
  profile_snapshot: DbProfileSnapshotJson;
  packing_mode: 'generated' | 'manual';
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

/** JSON persisted in packing_lists.profile_snapshot — mirrors PackingProfileSnapshot. */
export interface DbProfileSnapshotJson {
  id: string;
  name: string;
  age?: number;
  birthDate?: string;
  isSelf: boolean;
}

/** List-scoped packing item row (extends flat schema with list ownership). */
export interface DbCanonicalPackingItemRow {
  trip_id: string;
  packing_list_id: string;
  id: string;
  name: string;
  quantity: number;
  category: string;
  packed: boolean;
  need_to_buy: boolean;
  assigned_to: string | null;
  note: string | null;
  source: 'generated' | 'important' | null;
  important_item_id: string | null;
  sort_order: number;
}

/** Trip aggregate as loaded for canonical round-trip (MP6-B2). */
export interface DbCanonicalTripAggregate {
  trip: {
    id: string;
    user_id: string;
    title: string;
    destination: string;
    country: string;
    start_date: string;
    end_date: string;
    accommodation: string;
    laundry: string;
    note: string;
    types: string[] | null;
    activities: string[] | null;
    generated: boolean;
    status: string;
    image: string | null;
  };
  packing_lists: DbPackingListRow[];
  packing_items: DbCanonicalPackingItemRow[];
  trip_bags: {
    id: string;
    trip_id: string;
    name: string;
    type: string;
    owner_id: string | null;
    sort_order: number;
  }[];
  trip_weather: {
    trip_id: string;
    mode: string;
    summary: string;
    detail: string;
    high: number;
    low: number;
    rainfall: string | null;
    conditions: string | null;
    days: WeatherDay[] | null;
  } | null;
  trip_insights: {
    id: string;
    trip_id: string;
    content: string;
    sort_order: number;
  }[];
}

/** Profile + Important master bundle for ProfileProvider persistence (MP6-B2). */
export interface DbPackingProfileAggregate {
  profile: DbPackingProfileRow;
  important_config: DbImportantProfileConfigRow | null;
  important_items: DbImportantProfileItemRow[];
}
