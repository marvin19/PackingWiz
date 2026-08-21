# PackingWiz — architecture

Implementation boundaries, patterns, and the **target multi-person packing model**.

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

## Target domain model (planned)

Multi-person packing supersedes the earlier **one list per trip** assumption. See [PRODUCT.md](./PRODUCT.md) for UX detail.

```
Trip
├── name, destination, dates, tripContext, accommodation, laundry
├── weather (snapshot)
├── bags[]                    ← trip-level physical objects
└── packingLists[]
    └── PackingList
        ├── packingProfileId / embedded profile snapshot
        ├── packingMode: 'generated' | 'manual'
        ├── items: PackingItem[]
        └── importantSnapshotVersion (conceptual; stale sync per list)

PackingProfile (reusable across trips)
├── id, name, age info, isSelf
└── importantItems master
```

**Generation boundary (target):** one `PackingGenerator` call **per Packing List**, using trip context + weather + that profile's person context + that profile's Important Items.

**Bags:** remain on `Trip`; optional `ownerId` metadata; shared bags supported. Items may later reference a bag — not implemented.

---

## Current domain model (runtime)

The codebase still reflects an earlier single-list model. Agents must treat this as **legacy** until MP migration lands.

### Trip (`src/domain/trip.ts`)

- `title` — used as trip display name today; target separates **trip name** from **destination**
- `destination: Destination` — structured, not a string
- `tripContext: string[]` — single tag array (suggested + custom)
- `travelers`, `bags`, `accommodation`, `laundry`, `note`
- `weather: TripWeather` — snapshot at creation (trip-level — unchanged in target)
- `items: PackingItem[]` — **legacy flat list** (target: nested under `PackingList`)
- `packingMode: 'generated' | 'manual'` — **legacy trip-level** (target: per `PackingList`)
- `insights: string[]`
- `status: 'upcoming' | 'past'`
- `generated: boolean` — mirrors packing mode for Supabase schema
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
- **`assignedTo`** — legacy traveler assignment; may become obsolete or change meaning after MP5

### Important master vs snapshot (current)

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Master | `ProfileProvider` → `ImportantItemsPreferences` | User-global today; **target:** per `PackingProfile` |
| Snapshot | Trip `items` with `source: 'important'` | **Target:** per `PackingList` |
| Stale logic | `src/domain/important-snapshot.ts` | Exact key match; user-initiated sync only |
| Sync | `src/services/packing/sync-important-snapshot.ts` | Preserves packed state |

When Important feature is **disabled**: master retained; not injected into new trips/lists; Pack hides Important section.

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

### Active trip navigation (current)

| Action | Behavior |
|--------|----------|
| Open trip from Trips | `setActiveTripId` + navigate to Pack (`use-trip-navigation.ts`) |
| Commit new trip | `commitDraftTrip()` sets active id + clears draft |
| Pack / Overview | Read `activeTrip` from `TripsProvider` |
| Profile tab | Does **not** clear `activeTripId` |
| No active trip | Pack shows explicit empty state |
| Invalid `activeTripId` | Empty/not-found state — **no seed fallback** |

`reconcileActiveTripId()` in `src/domain/packing-stats.ts` validates id against loaded trips after hydration; never picks a default trip.

### Target navigation (MP3 — not implemented)

| Trip lists | Open trip |
|------------|-----------|
| One | `activeTripId` + direct Pack |
| Multiple | Lightweight packing-list picker, then Pack |

Pack should expose **Packing for: {name} ▾** to switch lists without returning Home. Trip Overview stays trip-level.

State will likely need **`activePackingListId`** (or equivalent) alongside `activeTripId` — exact shape TBD (see [PRODUCT.md](./PRODUCT.md) open questions).

---

## Providers

```
AuthProvider
  └─ ServicesProvider (createAppServices — singleton per app)
       └─ ProfileProvider (preferences, Important master, saved travelers)
            └─ TripsProvider (trips[], activeTripId, draft, packing mutations)
```

**Target additions (planned):** `PackingProfile` storage (ProfileProvider or dedicated provider/repository), `activePackingListId`, list-scoped packing mutations.

### TripsProvider (`src/providers/trips-provider.tsx`)

- Loads trips from `TripRepository` when auth ready
- Optimistic packing mutations with **surgical rollback**
- Important inject/sync via `updateTripPackingItems()` — not full-trip `save()` from stale snapshots
- `tripsRef` for latest trip list in async callbacks
- Mutations today assume **flat `Trip.items`** — will need list-scoped APIs in MP1/MP3

### ProfileProvider

- In-memory only today (no repository persistence)
- `saveImportantItems`, `setImportantEnabled`, stale-notice dismiss map (session)
- **Target:** Important master keyed by `PackingProfile.id`; multi-profile Important hub UX (MP4)

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

**Target:** methods should accept `packingListId` (or nested path) once MP1 lands. Persistence contracts must be designed before Supabase schema changes.

### MockTripRepository (default)

- In-memory; initialized from `mockSeedTrips`
- **Deep clone** via `src/lib/clone-trip.ts`
- **Session-only:** full reload re-seeds
- `save()` merges with existing trip metadata

### SupabaseTripRepository (opt-in)

- Implements same interface; uses Supabase client + `trip-mapper.ts`
- Migration: `supabase/migrations/20260817100000_initial_schema.sql`
- **Not ready** for `PackingList`, `PackingProfile`, or per-list Important — **no Supabase migration during mock refactor unless explicitly planned**

---

## Persistence mode

File: `src/config/persistence.ts`

Supabase activates **only when both**:

1. `EXPO_PUBLIC_USE_SUPABASE=true`
2. Valid `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Otherwise → **mock**.

---

## Services

### Trip assembly (`src/services/trip-assembly.ts`) — current

`assembleTripFromDraft(draft, { packingGenerator, weatherService }, { packingMode, importantItems })`

- Fetches weather (trip-level)
- Generates **one** flat item list (or empty for manual)
- Merges Important items from **user-global** master
- Assigns `id`, `status: 'upcoming'`

**Target:** assemble **N packing lists** (one per selected Packing Profile), each with its own `packingMode`, Important snapshot, and generator input including person context.

### PackingGenerator (`src/services/packing/packing-generator.ts`)

- Interface: `generate({ draft }) → { items, insights }`
- **Current:** `mockPackingGenerator` — trip/draft scoped, not person-scoped
- **Target:** accept profile/person context for age-appropriate recommendations per list

### WeatherService (`src/services/weather/weather-service.ts`)

- Interface: `getWeatherForTrip({ draft }) → TripWeather`
- Trip-level in both current and target models
- **Current:** mock only; `mode: 'forecast' | 'climate'`

---

## Theming

`src/theme/` — `colors`, `typography`, `spacing`, `radii`, `shadows`, `fonts`

- Platform-aware shadows (`src/theme/shadows.ts`)
- Components consume tokens via `useTheme()` — no Tailwind/NativeWind

---

## Current vs target — migration gaps

| Area | Current | Target | Risk if ignored |
|------|---------|--------|-----------------|
| Item ownership | `Trip.items[]` | `PackingList.items[]` | Double migration, broken mutations |
| Packing mode | `Trip.packingMode` | `PackingList.packingMode` | Wrong manual/generated semantics per person |
| Important master | User-global `ImportantItemsPreferences` | Per `PackingProfile` | Data loss on profile split |
| Important snapshot | On trip items | Per packing list | Stale sync applies to wrong scope |
| Travelers | `travelers[]` + `assignedTo` | Packing Profiles + lists | Orphaned assignment UI |
| Trip naming | `title` often ≈ destination | Separate `name` + `Destination` | Confusing Home/Overview copy |
| Pack state | `activeTripId` only | + `activePackingListId` | Cannot switch lists reliably |
| Generation | One call per trip | One call per list | Lists lack person-specific items |
| Supabase schema | Flat trip + items | Profiles, lists, nested items | Premature SQL locks wrong shape |
| Seed data | Single-list seed trips | Multi-list exemplars | Hard to test MP UX |

**Do not implement Supabase schema changes for this model until MP5 persistence contracts are defined and explicitly scheduled.**

---

## Future integration boundaries (not implemented)

| Integration | Status | Notes |
|-------------|--------|-------|
| Supabase persistence | Schema + repo exist; opt-in | **Not** aligned with MP model yet |
| Anonymous auth + upgrade | Partial (anonymous in Supabase mode) | Account linking planned |
| Google Places | Destination fields ready | Autocomplete not wired |
| Weather/climate API | Mock only | Should consume lat/lng from Destination |
| OpenAI packing | Mock generator only | Per-list generation in target model |
| TripImageService | Placeholder in `trip-image.ts` | User upload → Supabase Storage; provider TBD |
| i18n | English hardcoded | Structure strings for future extraction |
| Affiliate/products | Deferred | Must not hardcode URLs into `PackingItem` |

---

## State consistency lessons (Cleanup Phase 1)

Documented for agents fixing trip/packing bugs:

1. **Never** replace entire `trips[]` on single-item mutation failure — surgical rollback only  
2. **Never** `save(fullTrip)` from a stale React snapshot after granular repo updates  
3. Use **`updateTripPackingItems`** for Important snapshot changes (until list-scoped API exists)  
4. **Deep clone** mock repo reads/writes  
5. **Never** default `activeTripId` to a seed trip  
6. Use **`goBackOrReplace()`** (`src/lib/safe-navigation.ts`) when navigation stack may be empty (web)

During MP migration, apply the same discipline at **packing-list** granularity once nested items exist.

---

## Architecture risks / gaps

| Risk | Detail |
|------|--------|
| Legacy flat `Trip.items` | Entire Pack/Overview/provider stack assumes single list |
| Profile not persisted | Important master + preferences lost on mock reload |
| Important not per-profile | Cannot model Anna vs Emilie must-haves correctly |
| Single process memory | Mock repo singleton — HMR can reset in dev |
| Supabase partial integration | Trips may persist while Profile/Important do not; schema mismatched with MP target |
| Traveler assignment debt | `assignedTo` may conflict with per-person lists |
| Aggregate progress undefined | Home cards need rules before MP3 UI |
