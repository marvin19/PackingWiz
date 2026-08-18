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

### 2. Apply the database migration

**Option A — Supabase CLI (recommended)**

```bash
# From the repo root, link your project once:
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations:
supabase db push
```

**Option B — SQL Editor**

1. Open **SQL Editor** in the dashboard.
2. Paste the contents of `supabase/migrations/20260817100000_initial_schema.sql`.
3. Run the script.

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
| `trips` | `auth.uid() = user_id` |
| Child tables | `EXISTS (SELECT 1 FROM trips WHERE trips.id = … AND trips.user_id = auth.uid())` |

Anonymous users receive a real `auth.users` row and are subject to the same policies.

## Atomic trip creation

New trips are inserted via the `create_trip_with_details(jsonb)` RPC function, which runs in a single PostgreSQL transaction. If any insert fails, the entire trip graph is rolled back.

## Testing persistence

See the validation checklist in the project task description. Quick smoke test:

1. Fresh install with `.env` configured → anonymous session created.
2. Create a trip through the wizard → appears on Pack tab.
3. Force-quit and reopen → trip reloads from Supabase.
4. Toggle packed / change quantity → restart → changes persist.

## Switching back to mock persistence

Remove or leave empty `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The app falls back to `MockTripRepository` with seed data.
