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

## Canonical domain model (MP6-A runtime)

Multi-person packing is the application contract. New code reads and mutates **`Trip.packingLists[]`** — not flat `Trip.items`, trip-level `packingMode`, or `travelers[]`.

```
Trip                          PackingList (one per person)
├── name, destination         ├── packingProfileId + profileSnapshot
├── dates, tripContext        ├── packingMode: generated | manual
├── accommodation, laundry      └── items: PackingItem[]
├── bags, note
├── weather (snapshot)
├── insights (snapshot)
└── packingLists[]
```

| Concept | Canonical owner |
|---------|-----------------|
| Who is on the trip | `packingLists[].profileSnapshot` |
| Packing content / progress | `packingLists[].items` |
| Generated vs manual | `packingLists[].packingMode` (per list) |
| Important master | `importantByProfileId[profileId]` (ProfileProvider) |
| Important on a list | Item snapshot rows on that `PackingList` |
| Unfinished wizard | `StoredTripDraft` (separate aggregate) |

Helpers: `src/domain/trip-canonical.ts` — list resolution, legacy ingress detection, cross-list item reads.

### Legacy compatibility boundary (until MP6-B2 repository)

These fields remain on `Trip` **only** for Supabase compatibility read/write and one-way legacy ingress migration:

| Field | Role | Authoritative? |
|-------|------|----------------|
| `items` | Mirrors `packingLists[0].items` on save/load | **No** — use list items |
| `packingMode` / `generated` | Mirrors first list mode for DB column | **No** — use per-list mode |
| `travelers[]` | Populated during assembly/migration | **No** — use profile snapshots |
| `title` | Mirrors `name` | **No** |

**Normalization** (`normalizeTrip`):

1. **Legacy ingress** (no lists / single compatibility-primary list) → `migrateLegacyTripIngress`
2. **Canonical nested lists** → `normalizeCanonicalTrip` (idempotent; preserves list ids, mixed modes, snapshots)
3. **Mirror sync** → `syncLegacyTripMirrors` updates deprecated fields from the **compatibility-primary** list (`primaryPackingListId(trip.id)` when present; sole list when count is 1). Multi-list trips without a compatibility-primary list do **not** fall back to `packingLists[0]`.

**List targeting:** 1 list → auto-resolve; 2+ lists → explicit `packingListId` required (`resolveExplicitPackingListId`). No hidden primary fallback in Pack mutations (MP3B list picker).

**Clone vs reuse:** `cloneTrip` preserves identity; reuse/build paths generate fresh trip/list/item ids.

**Item `assignedTo`:** transitional single-list metadata only; hidden on multi-list trips (list ownership is canonical).

See `src/domain/trip-compatibility.ts` for migration helpers (`primaryPackingListId`, `buildPrimaryPackingList`, …) retained until Supabase nested repository round-trip (MP6-B2).

---

## Historical note (pre-MP6)

The codebase previously documented a single-list runtime here. That path is now compatibility-only; seeds and mock persistence use canonical multi-list fixtures.

### Insights vs Trip Details vs Pack (v1A)

| Surface | Meaning |
|---------|---------|
| **Trip Details / Trip Summary** | User-provided trip facts (destination, dates, context tags, accommodation, laundry, …) |
| **Insights** | PackingWiz reasoning about what those facts mean for packing — e.g. why rain gear or fewer shirts were included |
| **Pack** | The resulting packing lists and item state |

**Insights v1 rules:**

- Trip-level only — one shared snapshot on `Trip.insights`, not per `PackingList` or profile.
- Created once during generated trip assembly (`assembleTripFromDraft` → `InsightGenerator`); not recomputed when Trip Details later change.
- Deterministic generator today (`generateDeterministicTripInsights`); OpenAI-backed generator can implement the same `Insight` contract later.
- Legacy string insights normalize to structured `Insight` records on read (`normalizeInsights`).
- Legacy ids are **content-derived** (`legacyInsightIdFromBody`) — stable across repeated reads, not index-based or random.
- Supabase persistence is **content-only** for now: save `body`, reload with DB row `id` plus compatibility `category`/`title` defaults (`insightFromPersistedContent`). Category/title do not survive Supabase reload until schema evolves; mock/session structured insights stay fully structured until saved.

Contract: `src/domain/insight.ts` — `id`, `category`, `title`, `body`.

**Trip Summary vs Trip Details (MP5A IA):**

| Surface | When | Purpose |
|---------|------|---------|
| **Trip Summary** | Creation review (`/trip/summary`) | Draft facts before generate/manual create; includes Weather preview + Important |
| **Trip Details** | Existing trip (`/trip/edit`) | User-provided facts with section-level editing; no Weather (see Insights) |
| **Insights** | Existing trip (`/(tabs)/pack/overview`) | Packing reasoning + Weather snapshot |

Shared presentation: `TripSummaryDetailsContent` (`src/features/trip-creation/components/trip-summary-details-content.tsx`).

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

### Important master vs snapshot

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Master | `ProfileProvider.importantByProfileId` keyed by canonical `PackingProfile.id` (`profile-self` for Me) | **Sole mutable runtime source of truth** for Important master (MP4A) |
| Bootstrap | `PackingProfile.importantItemsBootstrap?` | Read-only session/mock snapshot for remembered profiles; seeds canonical store only when missing |
| Snapshot | `PackingList.items` with `source: 'important'` | Trip-specific item copies snapshotted at list creation (MP4B) |
| Stale logic | `src/domain/important-snapshot.ts` | Exact key match; user-initiated sync only |
| Sync | `src/services/packing/sync-important-snapshot.ts` | Preserves packed state |

**MP4A source-of-truth:** `importantByProfileId` is the canonical Important master. All edits (add/update/remove/enable) mutate that store only. `PackingProfile.importantItemsBootstrap` is never read preferentially after initialization — it may seed a **missing** canonical entry on bootstrap, but must not overwrite an existing one. `rememberPackingProfile()` exports canonical → bootstrap (one-way); re-selecting a remembered profile does not revert canonical state from stale embedded data.

**MP4A contract:** Changing profile master data does **not** mutate existing packing lists.

**MP4B creation flow:** `assembleTripFromDraft` reads `importantByProfileId` and, for each selected `PackingProfile`, resolves enabled master items via `importantItemsForProfileList`, then merges them into that profile's new `PackingList` using `mergeImportantItems` (generated and manual). Existing lists never re-read the master after creation.

**MP4C UX:** Important items is a **fixed** wizard step (always between Bags and Additional notes). It combines setup for unconfigured profiles and quick review for configured ones on one card-based screen — unconfigured profiles first, optional configuration (Continue does not block or mark configured). Edits are staged locally and committed on wizard Continue. `promptDismissed` affects Pack/configure-later UX only, not wizard step count. Profile Important management uses vertical settings rows per profile. Pack Important editors resolve the active/canonical profile id. Stale/sync compares profile master against the active `PackingList` only; user-initiated sync via `syncImportantSnapshotForList`.

**Draft vs reusable profiles:** Adding a person to a trip draft selects them for that draft only. `rememberForFutureTrips` on the draft profile expresses intent; `rememberPackingProfile()` runs at **trip commit** when Remember is on — not when the person is added to the draft.

**MP5B draft-only Important:** Important for draft-only packing profile ids (`draft-profile-*`) is stored on the draft envelope (`StoredTripDraft.draftImportantByProfileId`), not in the global profile store. Self and remembered/reusable profiles continue to use `importantByProfileId` in ProfileProvider.

**Trip-level progress:** Home and Trip Overview use `packingStatsForTrip` — sum of packed/total item counts across all `PackingList`s (not averaged percentages). Pack and the packing-list picker remain list-scoped via `packingStatsForList`.

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
      overview.tsx         Insights (packing reasoning + weather)
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
| Commit new trip | `commitDraftTrip()` sets active id + removes only the committed draft (MP5B) |
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
            └─ TripsProvider (trips[], activeTripId, drafts[], activeDraftId, packing mutations)
```

**Target additions (planned):** `PackingProfile` storage (ProfileProvider or dedicated provider/repository), `activePackingListId`, list-scoped packing mutations.

### TripsProvider (`src/providers/trips-provider.tsx`)

- Loads trips from `TripRepository` when auth ready
- **MP5B session drafts:** `drafts: StoredTripDraft[]` + `activeDraftId`; each draft has stable `id`, wizard step/resume metadata, and draft-scoped Important for draft-only profiles
- Optimistic packing mutations with **surgical rollback**
- Important inject/sync via `updateTripPackingItems()` — not full-trip `save()` from stale snapshots
- `tripsRef` for latest trip list in async callbacks
- Mutations today assume **flat `Trip.items`** — will need list-scoped APIs in MP1/MP3

**Draft APIs (MP5B-A):** `createNewDraft`, `resumeDraft(id)`, `deleteDraft(id)`, `getDraftById`, `commitDraftTrip(mode, draftId?)`. No silent fallback to an arbitrary draft. Persistence deferred to a later slice; refresh may reset session drafts.

**Home draft navigation (MP5B-B):** Normal Create Trip entry is via Home **Plan new trip** (`createNewDraft` + navigate) or **Continue planning** card (`resumeDraft(id)` + navigate to wizard or summary). Home shows at most two in-progress drafts; **View all drafts (N)** opens the canonical Trips browser (`/trip/browse?filter=drafts`). Direct `/trip/create` or `/trip/summary` without a valid `activeDraftId` redirects to Trips/Home unless a trip commit is in flight (post-create Pack navigation). Trip Summary **Save and close** preserves the draft without committing.

**Committed trip lifecycle (MP5C):** Drafts (`StoredTripDraft`) are separate from committed `Trip` records. Upcoming vs Previous is date-derived from `endDate` (trips ending today remain Upcoming); `Trip.status` stores `upcoming` | `past` and is normalized from dates on read. There is no manual Archive/Restore in 1.0 — Previous is automatic trip history. Permanent delete removes the trip aggregate via `deleteTripPermanently` / `TripRepository.delete` (no tombstone). Saved Packing Profiles and profile-scoped Important masters survive trip deletion. Deleting the active trip clears `activeTripId` and `activePackingListId` without selecting another trip.

**Trips browser (MP5C):** Home is a compact dashboard (max 2 drafts, max 2 previous trips, full Upcoming list). **Manage all trips** at the bottom of Home always opens `/trip/browse` (All filter). Contextual **View all drafts (N)** and **View all previous trips (N)** deep-link to Drafts/Previous filters only when counts exceed the Home preview limit. The canonical **Trips** screen filters: All | Drafts | Upcoming | Previous. Upcoming and Previous committed trips share compact management cards with overflow **Reuse trip** and **Delete permanently**. Search is deferred but the browser architecture is ready for a future query over the active filter's collection.

**New trip dates:** Creating a new trip requires `startDate >=` the user's local calendar day. Stale drafts with past start dates remain drafts until corrected; commit is blocked before assembly/persistence. Existing Previous trips may retain historical dates when edited.

**Trip reuse (MP5D-A / MP5D-C):** `buildReusedTrip()` (`src/domain/trip-reuse.ts`) copies selected `PackingList` content from a source Trip into a **new** Trip aggregate. `reuseTrip()` orchestration persists via `TripRepository.createTrip()`. Contract:

| Aspect | Copied source lists | Newly added travellers |
|--------|---------------------|-------------------------|
| List origin | Source list snapshot copy (MP5D-A) | Fresh list via `assemblePackingListForProfile()` (MP5A semantics) |
| PackingGenerator | **Zero** calls | One call per `packingMode: 'generated'` traveller |
| Weather | Not copied; `emptyTripWeather()` on shell | Generator uses new-trip draft context only — **no** source weather fetch/copy |
| Important | Snapshot copied; `importantItemId` preserved | Current enabled profile Important master injected (MP4) |
| Progress | Reset `packed: false` on copied items | N/A (new list) |

Mixed reuse assembles the **full** aggregate (copied lists + new lists) before a **single** `createTrip()` — no partial persist. Source trip is never mutated.

Copy-only path (no new travellers): no PackingGenerator, weather fetch, InsightGenerator, or Important reinjection.

| Aspect | Behavior |
|--------|----------|
| Source trip | Immutable — ids, packed progress, weather, insights unchanged |
| New ids | Fresh UUIDs for Trip, each PackingList, each PackingItem, and copied bags |
| Profile identity | Copied lists preserve `profileSnapshot` / `packingProfileId`; new lists use planned profile |
| packingMode | Preserved per copied list; chosen per new traveller |
| Dates | Required new `startDate`/`endDate`; validated with `validateNewTripDateRange` |
| Travellers | Selected source list ids + optional `newTravellers[]` plan entries |
| Weather | `emptyTripWeather()` on shell — not copied from source |
| Insights | `[]` — stale reasoning not carried over |
| Image | Not copied (`undefined` on new trip) |
| Active trip | `TripsProvider.reuseTrip()` returns created trip; does **not** set `activeTripId` (unlike `commitDraftTrip`) |
| Remember profile | Promoted only after successful reuse commit (same atomicity as `commitDraftTrip`) |

Supabase: `createTrip()` rejects multi-list aggregates until MP6 persistence; UI blocks when total resulting lists (selected source + new) > 1.

**Reuse UI (MP5D-B / MP5D-C):** Previous trips in `/trip/browse` expose **Reuse trip** in the overflow menu → `/trip/reuse?tripId=…`. The screen collects new dates, source traveller checkboxes, **Add person** (saved profile or new + generate/manual choice), optional shared-detail edits, and a deterministic **Changes from original** summary. Success calls `reuseTrip()`, then `beginTripPackEntry()` on the created trip and navigates to Pack or list selection. Form state is transient (`ReuseTripSessionProvider`); cancel clears the session without creating a draft or promoting remembered profiles.

### ProfileProvider

- **Mock mode:** in-memory saved profiles, Important master, and preferences (session-only reload)
- **Supabase mode:** loads/saves reusable `packing_profiles`, Important masters, and `user_preferences` after `isAuthReady`
- Important master keyed by canonical `PackingProfile.id` (`profile-self` for Me)

### AuthProvider

- **Mock mode:** `isAuthReady = true` immediately, no session
- **Supabase mode:** restores existing session via `getSession()`; otherwise `signInAnonymously()` once
- Exposes `userId` (`auth.users.id`) to providers — **not** shown in Profile UI
- **Out of scope (1.0):** sign-out, mid-session user switching, multi-account lifecycle

### Account persistence readiness (Cleanup Phase 4)

PackingWiz persisted data is owned by the **Supabase auth user id** (`auth.users.id`), not by packing-domain ids such as `profile-self`.

```
auth.users.id  (anonymous today; linkable to permanent credentials later)
├── user_preferences
├── packing_profiles (incl. profile-self row for Me)
│   ├── important_profile_configs
│   └── important_profile_items
└── trips
    ├── packing_lists (+ profileSnapshot copies)
    ├── packing_items
    ├── trip_weather / trip_insights / trip_bags / trip_travelers (compat)
    └── …
```

| Concept | Role |
|---------|------|
| `auth.users.id` | **Persistence owner** for all Supabase rows |
| `profile-self` | **Packing-domain** id for Me — Important master + canonical self profile |
| `{tripId}-profile-self` | **Historical list snapshot** id — frozen at trip commit |
| `public.profiles` | Auth-user shell row (auto-created on signup) — not a Packing Profile |

**Current runtime:** anonymous Supabase sign-in → JWT uses `authenticated` role → RLS filters every query with `auth.uid()`.

**Future account linking (not implemented):** upgrade/link the **same** Supabase auth identity to email/OAuth/password. Because ownership columns already reference `auth.users.id`, trips, packing profiles, Important masters, and preferences should **remain attached without domain-level copy migration**.

**Explicit non-goal:** if a future flow creates a **new** auth user instead of linking the existing anonymous identity, ownership transfer/merge is a separate explicit migration — must **not** happen implicitly during sign-in.

Repositories obtain ownership only from the authenticated Supabase session (`auth.getUser()` / RPC `auth.uid()`). They never persist UI profile ids as account owners.

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

### SupabaseTripRepository (opt-in) — MP6-B2 canonical

- Implements `TripRepository` via `create_canonical_trip` / `save_canonical_trip` RPCs (atomic aggregate)
- Loads nested `packing_lists` + list-scoped `packing_items` through `mapSupabaseSelectRowToTrip`
- Canonical nested rows hydrate with `normalizeCanonicalTrip` — **not** legacy flat remigration
- Pre-B1 flat rows (no `packing_lists`) still ingress once via `mapTripRow` → `normalizeTrip`
- List-scoped mutations require explicit `packingListId` when trip has 2+ lists (`resolveExplicitPackingListId`)
- Migrations:
  - `20260817100000_initial_schema.sql`
  - `20260905100000_mp6b1_canonical_packing_schema.sql`
  - `20260906100000_mp6b2_canonical_trip_rpcs.sql`
- Profile + Important: `SupabasePackingProfileRepository` wired through `ProfileProvider` / `TripsProvider`

#### Canonical vs compatibility persistence fields

| Write source | DB target | Authoritative? |
|--------------|-----------|----------------|
| `PackingList.packingMode` | `packing_lists.packing_mode` | **Yes** |
| `PackingList.profileSnapshot` | `packing_lists.profile_snapshot` | **Yes** (list-owned) |
| `PackingItem.*` | `packing_items.*` scoped by `packing_list_id` | **Yes** |
| `trips.generated` | Derived mirror at RPC boundary only | **No** |
| `trip_travelers` | Derived from list snapshots for bag FK compat | **No** |
| `Trip.items` / `Trip.packingMode` | Not written by Supabase repo | **No** |

**Delete:** `trips` delete cascades lists/items/weather/insights/bags/travelers — **not** `packing_profiles`.

**Promotion:** Remember ON profiles persist **after** successful trip create/reuse; trip success is not rolled back on profile persist failure.

**Deferred:** draft persistence, structured Insight metadata, weather override.

#### Supabase gap inventory (post MP6-B2 — local implementation)

| Gap | Status |
|-----|--------|
| Multi-list create/save/read round-trip | **B2 DONE** (local tests; live Supabase unverified) |
| List-scoped item mutations | **B2 DONE** |
| Profile + Important Supabase persistence | **B2 DONE** (local) |
| Multi-list reuse in Supabase mode | **B2 DONE** (guard lifted) |
| Structured Insight category/title | DEFERRED |
| StoredTripDraft persistence | DEFERRED |
| Live Supabase integration smoke | **PENDING** (project paused) |

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

`assembleTripFromDraft(draft, { packingGenerator, weatherService }, { packingMode, importantByProfileId })`

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
- **Future (outside MP6):** user override of expected temperature bands and multi-select conditions — see ROADMAP.md

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
| Anonymous auth + upgrade | Anonymous session + auth-user ownership in place | Link/upgrade **same** auth user id (no data copy) — UX not implemented |
| Google Places | Destination fields ready | Autocomplete not wired |
| Weather/climate API | Mock only | Should consume lat/lng from Destination |
| OpenAI packing | Mock generator only | Per-list generation in target model |
| TripImageService | Placeholder in `trip-image.ts` | User upload → Supabase Storage; provider TBD |
| i18n | English hardcoded | Structure strings for future extraction |
| Affiliate/products | Deferred — architecture documented below | Must not hardcode URLs into `PackingItem` |

---

## Affiliate / product recommendations (future — not implemented)

**Status:** Architecture contract only (Cleanup Phase 5). No affiliate links, commerce UI,
tracking, product APIs, or schema tables in 1.0.

### Product intent (from roadmap)

Affiliate shopping / product recommendations are **validated-demand candidates** and
**explicitly deferred** until post–frontend-freeze integration work. They are **not** MVP
requirements.

Current **Shopping** in Pack is a packing workflow filter only: items flagged `needToBuy`
mark a purchase intent; checking them off clears the flag. It is **not** commerce,
affiliate routing, or product enrichment.

Weather/trip **recommendations** in roadmap copy refer to **packing-list change
review** (add/remove items when context changes) — not merchant product suggestions.

### Packing intent vs purchasable product

`PackingItem` (`src/domain/packing-item.ts`) is canonical **packing intent**:

| Field | Role | Commerce-safe? |
|-------|------|----------------|
| `id`, `name`, `quantity`, `category` | What to pack | Yes — semantic need (e.g. "Rain jacket") |
| `packed`, `needToBuy` | User packing/shopping workflow | Yes — not merchant metadata |
| `note` | User-authored reminder | Yes |
| `source`, `importantItemId` | Important vs generated provenance | Yes |
| `assignedTo` | Legacy assignment metadata | Yes — transitional |

**Rule:** Do **not** add affiliate URLs, merchant ids, product skus, prices, or provider
payloads to `PackingItem` or `packing_items`. A merchant-specific title must not replace
the generic packing need as the item's canonical name.

Problematic if added directly to `PackingItem`:

- Stale prices/links baked into trip history
- Provider lock-in in persisted trip rows
- AI generation coupled to a single merchant catalog
- Pack/check semantics tied to product availability
- Privacy leakage (full trip context sent to commerce APIs as part of core item shape)

### Future enrichment boundary

When implemented, treat **product recommendations as optional enrichment** attached to a
packing need — not as the need itself.

Conceptual shape (documentation only — **not** implemented):

```
PackingItem (unchanged intent)
  └── zero or more ProductRecommendation (future, separate)
        providerId, productId, merchant, destinationUrl, affiliateUrl?,
        imageUrl?, price?, currency?, availability?, fetchedAt, expiresAt?,
        disclosure?, rationale?
```

- **Zero recommendations** is valid — the list remains fully useful.
- Recommendations may be **refreshed or replaced** without changing item identity (`id`, `name`).
- Eligibility: likely generated/essential items and explicit `needToBuy` — not Important
  master snapshots unless product policy explicitly allows (TBD at implementation).

### Persistence recommendation (future)

Prefer a **hybrid, low-coupling** model:

| Layer | Persist? | Rationale |
|-------|----------|-----------|
| `PackingItem` rows | Yes (current) | Stable trip history; user packing state |
| Live provider lookup | Transient | Fresh price/availability; swappable providers |
| UI/session cache | Optional, TTL | Avoid refetch spam; tolerate staleness |
| Snapshot of chosen product | Only if user explicitly saves/pins | Rare; document expiry; never overwrite item `name` |

**Do not** persist affiliate URLs on `packing_items` by default. If a snapshot table is
added later, scope it separately (e.g. keyed by `trip_id` + `packing_item_id` + `fetched_at`),
cascade-delete with trip/item deletion, and keep provider swappable without migrating core items.

Consider: expired links, stale prices, merchant API failures, and historical trips where
commerce data should degrade gracefully (hide offer, keep "Rain jacket" packable).

### AI generation vs affiliate selection (hard separation)

Two independent integrations:

| Stage | Responsibility | Must not know |
|-------|----------------|---------------|
| **A. PackingGenerator** (mock today; OpenAI later) | Produce packing **needs** — names, categories, quantities, `needToBuy` hints | Affiliate URLs, merchants, skus, commission rules |
| **B. ProductRecommendationProvider** (future) | Map eligible needs → optional purchasable products | Whether an essential item exists; must not add/remove packing rows silently |

Affiliate availability or API failure **must not** remove or block core packing items.
Commerce is an optional layer on top of a complete list.

### UI / UX constraints (future)

When commerce UI is built:

- Packing list remains fully usable with **no** product links
- Opening a product link is **optional** — pack/check flows work without it
- Sponsored/affiliate content must be **visually and verbally distinct** from packing content
- No forced purchase flow; no paywall on basic packing
- Display generic packing name as primary; merchant product title secondary if shown
- `needToBuy` checkbox semantics stay **purchased/handled** — not "bought via affiliate"

Do not implement badges, buttons, or disclosure copy until a scheduled commerce phase.

### Provider abstraction (conceptual API only)

A future service interface (no runtime implementation until scheduled):

```typescript
// Conceptual — not in codebase
interface ProductRecommendationProvider {
  /** Returns zero or more offers for one packing need; empty on failure. */
  getRecommendations(input: {
    packingItemId: string;
    itemName: string;
    category: PackingCategory;
    quantity: number;
    /** Minimal trip context — avoid sending full notes/private profile by default */
    destinationCountry?: string;
    locale?: string;
  }): Promise<ProductRecommendation[]>;
}
```

Keep the surface minimal. Tracking/analytics, A/B tests, and consent gates belong in a
**separate** layer — not inside the provider or `PackingItem`.

### Privacy / tracking (future)

When affiliate features ship (separate phase):

- Clear **affiliate/sponsored disclosure** before external navigation
- **Minimal** event tracking — e.g. offer impression / outbound click — not full trip dumps
- Do not send full private trip notes, Important master contents, or profile PII to merchant
  APIs unless explicitly required and consented
- External links open with user intent; no hidden redirects
- Consent/privacy rules depend on jurisdiction and store policies — resolve at implementation

**No** analytics, tracking SDKs, or affiliate URLs in the current codebase.

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
| Mock reload | Important master + preferences reset in mock mode (expected) |
| Single process memory | Mock repo singleton — HMR can reset in dev |
| Account linking UX | Schema ready; anonymous → permanent credential flow not built |
| Mid-session user switch | Out of scope for 1.0 anonymous-session path |
| Traveler assignment debt | `assignedTo` may conflict with per-person lists |
