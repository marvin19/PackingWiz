# Supabase setup for PackingWiz

## Prerequisites

1. Create a [Supabase](https://supabase.com) project.
2. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) (optional but recommended).

## Dashboard configuration (required)

### 1. Enable Anonymous Sign-Ins

1. Open your project in the Supabase Dashboard.
2. Go to **Authentication → Providers → Anonymous**.
3. Enable **Anonymous Sign-Ins**.

Without this, the app cannot create a session on first launch.

### 2. Apply database migrations

**Option A — Supabase CLI (recommended)**

The CLI applies the full migration history in order. From the repo root:

```bash
# Link your project once:
supabase link --project-ref YOUR_PROJECT_REF

# Push all pending migrations:
supabase db push
```

Use this for normal setup. Do not manually rerun migrations that are already recorded in your project's migration history.

**Option B — SQL Editor (manual)**

Use this only when you cannot use the CLI. Run **every** migration file below **in order**, skipping any your project has already applied (check **Database → Migrations** in the dashboard before re-running):

1. `supabase/migrations/20260817100000_initial_schema.sql`
2. `supabase/migrations/20260905100000_mp6b1_canonical_packing_schema.sql`
3. `supabase/migrations/20260906100000_mp6b2_canonical_trip_rpcs.sql`
4. `supabase/migrations/20260906110000_mp6b2_data_api_grants.sql`
5. `supabase/migrations/20260906120000_mp6b2_trip_table_data_api_grants.sql`
6. `supabase/migrations/20260911100000_user_preferences.sql`
7. `supabase/migrations/20260911110000_user_preferences_data_api_grants.sql`

Do not blindly re-apply migrations that are already present — especially the initial schema and B1 forward migration, which are not idempotent for existing data.

### 3. Environment variables

Copy `.env.example` to `.env` in the repo root and fill in values from **Project Settings → API**:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_anon_publishable_key
```

Use the **anon / publishable** key only. Never put the service-role key in the mobile app.

Restart Expo after changing `.env`.

## RLS strategy

All user-owned tables have Row Level Security enabled.

| Table | Ownership check |
|-------|-----------------|
| `profiles` | `auth.uid() = id` |
| `packing_profiles` | `auth.uid() = user_id` |
| `important_profile_configs` | `auth.uid() = user_id` |
| `important_profile_items` | `auth.uid() = user_id` |
| `trips` | `auth.uid() = user_id` |
| `user_preferences` | `auth.uid() = user_id` |
| Trip child tables (`packing_lists`, `packing_items`, …) | Parent trip owned by `auth.uid()` |

Anonymous users receive a real `auth.users` row and are subject to the same policies. Future account linking should preserve that same `auth.users.id` so existing rows require no domain copy migration (see `ARCHITECTURE.md` — Account persistence readiness).

## Identity model

Domain IDs for travelers, bags, packing lists, and packing items are **not globally unique** in the app (e.g. `t-you`, `mock-item-1` reused across trips). The database uses composite keys where needed:

| Table | Primary key | Notes |
|-------|-------------|--------|
| `trips` | `id UUID` | Generated UUID on persist |
| `packing_lists` | `(trip_id, id)` | One or more lists per trip |
| `packing_items` | `(trip_id, id)` | **List-scoped** via `packing_list_id` FK |
| `packing_profiles` | `(user_id, id)` | Reusable people — **not** deleted with trips |
| `trip_travelers` | `(trip_id, id)` | Legacy compat metadata |
| `trip_bags` | `(trip_id, id)` | `owner_id` FK → `(trip_id, id)` on travelers |

Cross-trip references are rejected by composite foreign keys. New custom packing items get UUID domain IDs via `createPackingItemId()`.

## Canonical schema (MP6-B1)

```
trips → packing_lists → packing_items
auth.users → packing_profiles → important_profile_configs / important_profile_items
```

- **Trip delete** cascades lists and list-scoped items (not reusable profiles).
- **Legacy flat trips** are migrated to one compatibility list (`{tripId}-list-primary`) automatically by the B1 migration.
- **Full multi-list repository round-trip** is implemented in MP6-B2 via `create_canonical_trip` / `save_canonical_trip` RPCs.

See `ARCHITECTURE.md` and `src/repositories/trips/supabase-trip-persistence-contract.ts`.

## Atomic trip creation

New trips are inserted via the `create_trip_with_details(jsonb)` RPC function, which runs in a single PostgreSQL transaction. The B1 migration updates this RPC to also insert one compatibility `packing_lists` row and attach items to it.

## Testing persistence

See the validation checklist in the project task description. Quick smoke test:

1. Fresh install with `.env` configured → anonymous session created.
2. Create a trip through the wizard → appears on Pack tab.
3. Force-quit and reopen → trip reloads from Supabase.
4. Toggle packed / change quantity → restart → changes persist.

Multi-person trips require Supabase mode (`EXPO_PUBLIC_USE_SUPABASE=true`) and all five migrations above (including B2 RPCs and Data API grants).

## Switching back to mock persistence

Mock mode is the default. Supabase is used only when **both** are true:

- `EXPO_PUBLIC_USE_SUPABASE=true`
- `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are set

Leave `EXPO_PUBLIC_USE_SUPABASE` unset or set it to anything other than `true` to use `MockTripRepository` with seed data (even if Supabase credentials are present in `.env`).
