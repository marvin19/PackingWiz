# PackingWiz — architecture

Current implementation boundaries and patterns. Reflects the codebase as of Cleanup Phase 1.

**Related:** [AGENTS.md](./AGENTS.md) · [PRODUCT.md](./PRODUCT.md) · [ROADMAP.md](./ROADMAP.md)

---

## Layer model

```
┌─────────────────────────────────────────┐
│  src/app/          Expo Router routes   │  thin
├─────────────────────────────────────────┤
│  src/features/     screens, components, │
│                    hooks, utils         │
├─────────────────────────────────────────┤
│  src/providers/    React context state  │
├─────────────────────────────────────────┤
│  src/domain/       types, pure logic    │
├─────────────────────────────────────────┤
│  src/services/     assembly, packing,   │
│                    weather, Important   │
├─────────────────────────────────────────┤
│  src/repositories/ TripRepository       │
├─────────────────────────────────────────┤
│  mock (default)  │  Supabase (opt-in)   │
└─────────────────────────────────────────┘
```

**Rule:** UI → providers → services/repositories → concrete backend. No shortcuts.

---

## Routing (Expo Router)

```
src/app/
  _layout.tsx              Root stack + AppProviders
  (tabs)/
    _layout.tsx            Trips | Pack | Profile tabs
    index.tsx              Home / Trips list
    pack/
      _layout.tsx          Pack stack
      index.tsx            Pack screen
      overview.tsx         Trip overview
    profile.tsx            Profile
  trip/
    create.tsx             6-step wizard
    summary.tsx            Pre-generation summary
    generating.tsx         Mock generation progress
```

### Active trip navigation

| Action | Behavior |
|--------|----------|
| Open trip from Trips | `setActiveTripId` + navigate to Pack (`use-trip-navigation.ts`) |
| Commit new trip | `commitDraftTrip()` sets active id + clears draft |
| Pack / Overview | Read `activeTrip` from `TripsProvider` |
| Profile tab | Does **not** clear `activeTripId` |
| No active trip | Pack shows explicit empty state |
| Invalid `activeTripId` | Empty/not-found state — **no seed fallback** |

`reconcileActiveTripId()` in `src/domain/packing-stats.ts` validates id against loaded trips after hydration; never picks a default trip.

---

## Domain model

### Trip (`src/domain/trip.ts`)

- `destination: Destination` — structured, not a string
- `tripContext: string[]` — single tag array (suggested + custom)
- `travelers`, `bags`, `accommodation`, `laundry`, `note`
- `weather: TripWeather` — snapshot at creation
- `items: PackingItem[]`
- `insights: string[]`
- `status: 'upcoming' | 'past'`
- `generated: boolean`
- `image?: string` — reserved for future assets

### Destination (`src/domain/destination.ts`)

```typescript
displayName, placeId?, latitude?, longitude?, countryCode?, countryName?
```

Helpers: `createDestinationFromText`, `getDestinationLabel`, `getDestinationCountryLabel`.

### PackingItem (`src/domain/packing-item.ts`)

- Categories include **`Important`** and **`Essentials`** (distinct)
- `source?: 'generated' | 'important'`
- `importantItemId?` — link to profile master item when snapshotted
- `packed`, `needToBuy`, `quantity`, `assignedTo`, `note`

### Important master vs snapshot

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Master | `ProfileProvider` → `ImportantItemsPreferences` | `items`, `isConfigured`, `isEnabled`, `promptDismissed`, `updatedAt` |
| Snapshot | Trip `items` with `source: 'important'` | Per-trip copy at generation or explicit sync |
| Stale logic | `src/domain/important-snapshot.ts` | Exact key match (`importantItemId` or normalized name); **no fuzzy matching** |
| Sync | `src/services/packing/sync-important-snapshot.ts` | Preserves packed state; user-initiated only |
| Version / dismiss | `buildImportantMasterVersion(preferences)` | Includes `isEnabled` + `updatedAt` for notice dismissal |

When Important feature is **disabled** (`isEnabled: false`): master data retained in Profile; not shown on Pack; not injected into new trips.

---

## Providers

```
AuthProvider
  └─ ServicesProvider (createAppServices — singleton per app)
       └─ ProfileProvider (preferences, Important master, saved travelers)
            └─ TripsProvider (trips[], activeTripId, draft, packing mutations)
```

### TripsProvider (`src/providers/trips-provider.tsx`)

- Loads trips from `TripRepository` when auth ready
- Optimistic packing mutations with **surgical rollback** (revert single item, not whole trips array)
- Important inject/sync via `updateTripPackingItems()` — not full-trip `save()` from stale snapshots
- `tripsRef` for latest trip list in async callbacks

### ProfileProvider

- In-memory only today (no repository persistence)
- `saveImportantItems`, `setImportantEnabled`, stale-notice dismiss map (session)

### AuthProvider

- **Mock mode:** `isAuthReady = true` immediately, no session
- **Supabase mode:** anonymous sign-in, session in context

---

## Repository abstraction

### `TripRepository` (`src/repositories/trips/trip-repository.ts`)

| Method | Use |
|--------|-----|
| `getAll`, `getById` | Hydration |
| `createTrip`, `save` | New trip / full upsert |
| `updateTripPackingItems` | Important sync/inject — **items only** |
| `updatePackingItem` | Granular packed/qty/needToBuy/assign |
| `addPackingItem`, `deletePackingItem` | Custom items |

### MockTripRepository (default)

- In-memory; initialized from `mockSeedTrips`
- **Deep clone** via `src/lib/clone-trip.ts` — avoids shared-reference corruption between React state and repo
- **Session-only:** full browser/app reload re-seeds; custom trips and `activeTripId` not restored
- `save()` merges with existing trip metadata (preserves `status`, etc.)

### SupabaseTripRepository (opt-in)

- Implements same interface; uses Supabase client + `trip-mapper.ts`
- Migration: `supabase/migrations/20260817100000_initial_schema.sql`
- Packing generator and weather **still mock** even in Supabase mode today

---

## Persistence mode

File: `src/config/persistence.ts`

Supabase activates **only when both**:

1. `EXPO_PUBLIC_USE_SUPABASE=true`
2. Valid `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Otherwise → **mock**. Credentials alone do **not** enable Supabase.

---

## Services

### Trip assembly (`src/services/trip-assembly.ts`)

`assembleTripFromDraft(draft, { packingGenerator, weatherService }, { importantItems })`

- Calls weather + packing generators in parallel
- Merges Important items into generated list
- Assigns `id: trip-${Date.now()}`, `status: 'upcoming'`

### PackingGenerator (`src/services/packing/packing-generator.ts`)

- Interface: `generate({ draft }) → { items, insights }`
- **Current:** `mockPackingGenerator` + `mock-packing-generator-logic.ts`

### WeatherService (`src/services/weather/weather-service.ts`)

- Interface: `getWeatherForTrip({ draft }) → TripWeather`
- **Current:** `mockWeatherService` + `mock-weather-logic.ts`
- Supports `mode: 'forecast' | 'climate'` on `TripWeather`

---

## Theming

`src/theme/` — `colors`, `typography`, `spacing`, `radii`, `shadows`, `fonts`

- Platform-aware shadows (`src/theme/shadows.ts`)
- Components consume tokens via `useTheme()` — no Tailwind/NativeWind

---

## Future integration boundaries (not implemented)

| Integration | Status | Notes |
|-------------|--------|-------|
| Supabase persistence | Schema + repo exist; opt-in | Profile/Important not persisted yet |
| Anonymous auth + upgrade | Partial (anonymous in Supabase mode) | Account linking planned |
| Google Places | Destination fields ready | Autocomplete not wired |
| Weather/climate API | Mock only | Should consume lat/lng from Destination |
| OpenAI packing | Mock generator only | Same `PackingGenerator` interface |
| TripImageService | Placeholder in `trip-image.ts` | User upload → Supabase Storage; provider TBD |
| i18n | English hardcoded | Structure strings for future extraction (Phase 5) |
| Affiliate/products | Deferred | Must not hardcode URLs into `PackingItem` |

### TripImageService (planned shape)

```
TripImageService.resolve(trip) → image URL or local asset
  1. user upload (Supabase Storage)
  2. destination provider image
  3. fallback icon/tint (current)
```

---

## Cleanup Phase 1 lessons (state consistency)

Documented for agents fixing trip/packing bugs:

1. **Never** replace entire `trips[]` on single-item mutation failure — surgical rollback only  
2. **Never** `save(fullTrip)` from a stale React snapshot after granular repo updates  
3. Use **`updateTripPackingItems`** for Important snapshot changes  
4. **Deep clone** mock repo reads/writes  
5. **Never** default `activeTripId` to seed trip (`tokyo-kyoto` removed)  
6. Use **`goBackOrReplace()`** (`src/lib/safe-navigation.ts`) when navigation stack may be empty (web)

---

## Architecture risks / gaps

| Risk | Detail |
|------|--------|
| Profile not persisted | Important master + preferences lost on mock reload |
| Single process memory | Mock repo is singleton — HMR can reset in dev |
| Supabase partial integration | Trips may persist while Profile/Important do not |
| Generation-only path | No manual empty-list creation yet (Phase 2) |
| Item settings split | Some mutations in provider; unified item UI pending (Phase 3) |
