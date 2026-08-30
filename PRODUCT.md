# PackingWiz — product definition

What PackingWiz is and the product decisions agents must preserve.

**Related:** [AGENTS.md](./AGENTS.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [ROADMAP.md](./ROADMAP.md)

---

## Product vision

PackingWiz is an intelligent packing-list app for **iOS and Android**.

**Core loop:**

```
Trip context → weather/climate → personalized packing list(s) → user edits/packs → trip remains available
```

The packing list is the **initial product**. Broader travel-assistant features are future possibilities, not current scope.

---

## MVP principles

- Fast trip creation
- AI should **reduce work**, not create configuration burden
- **One or more packing lists per trip** — one list per person the user packs for
- User always retains manual control
- Weather context matters for list quality
- Prefer **try-before-signup** direction (anonymous-first)
- Avoid overbuilding before validating demand

Packing personalization is about **who you pack for**, not modeling every person who happens to travel.

### Current vs target

| Area | Current implementation | Target (MP phases) |
|------|------------------------|---------------------|
| Packing lists | Single shared list on `Trip.items` | `Trip → PackingList[] → PackingItem[]` |
| Who is modeled | Travelers + optional item assignment | Packing Profiles + one list per profile |
| Important master | Per Packing Profile (`importantByProfileId`) | Per Packing Profile |
| `packingMode` | Trip-level | Per Packing List |
| Trip name | `Trip.title` (often mirrors destination) | Separate editable trip name vs destination |
| Pack entry | Always one list | Direct Pack if one list; picker if multiple |
| Try before signup | Mock mode needs no auth; Supabase mode uses anonymous auth | Full anonymous → account upgrade |

---

## Domain model (target)

### 1. Trip

A **Trip** represents the shared journey.

**Owns:**

- Trip name (user-facing label; may default sensibly and be editable)
- Destination (structured place data)
- Dates
- Trip context tags
- Accommodation / laundry context
- Weather snapshot
- Bags (trip-level physical objects)
- One or more **Packing Lists**

**Trip name and destination are separate concepts.**

Example:

| Field | Example |
|-------|---------|
| Trip name | Hyttetur |
| Destination | Norefjell, Norway |
| Trip context | Skiing, Family trip |

Destination/place data will later drive weather and Places integration. **Do not duplicate destination names as trip-context tags.**

### 2. Packing Profile

A **Packing Profile** represents a person the user packs for across trips.

Examples: Anna, Emilie.

**Conceptually may own:**

- `id`
- `name`
- Age / age information
- Whether this is the user's own profile (`isSelf`)
- **Important Items** (master list)

**Not in MVP:** gender.

The authenticated or anonymous user's own profile is also a Packing Profile ("Me"). Additional people may later be reusable across multiple trips.

### 3. Important Items

Important Items belong to a **Packing Profile**.

They are **not**:

- AI-generated
- Trip-global
- One global list shared by every traveler

Example:

**Anna**

- House keys
- Migraine medication
- Contact lenses

**Emilie**

- Inhaler
- Comfort toy

Important Items remain **master/profile-level** data. Each new **Packing List** receives a snapshot of that profile's enabled Important Items. Existing list snapshots are **not** silently rewritten when the master changes.

First-time Important setup is offered during trip creation per Packing Profile when not yet configured. The **Important items** step is always shown (between Bags and Additional notes). It is optional (`Configure later` sets persistent `promptDismissed`; Continue without configuring does not mark configured). Important provides deterministic personal guarantees; generated recommendations remain separate.

The existing explicit stale/sync concept (**Update this list** / **Keep current list**) remains applicable — per Packing Profile / Packing List.

**Profile UX target:**

| Profiles | Important Items entry |
|----------|----------------------|
| One | Profile → Important Items opens that profile's list directly |
| Multiple | Profile → Important Items shows people first (e.g. "Anna — 3 items"), then that person's master list |

### 4. Packing List

A Trip may contain **one or more Packing Lists**. Each list belongs to one Packing Profile for that trip.

Example:

```
Hyttetur
├── Anna packing list
└── Emilie packing list
```

Packing items belong to a **Packing List**, not directly to the Trip in the target architecture.

**`packingMode: 'generated' | 'manual'`** belongs to the Packing List — allowing, for example, Anna generated and Emilie manual on the same trip.

**Current runtime:** `Trip.items` and `Trip.packingMode` still exist; migration is planned in [ROADMAP.md](./ROADMAP.md) (MP1–MP5).

### 5. Bags

Bags remain **trip-level** physical objects. They do **not** become Packing Profile objects.

Reason: a physical suitcase or backpack may contain items for multiple people.

```
Trip
├── Bags
│   ├── Shared suitcase
│   ├── Anna carry-on
│   └── Emilie backpack
└── PackingLists
    ├── Anna
    └── Emilie
```

A bag may optionally have an owner as metadata; shared bags remain supported. Packing items may later optionally reference a bag. Bag assignment changes are **not** in current scope.

---

## Trip creation

### Current wizard (7 steps — implemented)

1. **Destination & dates** — structured `Destination` + date range  
2. **Trip context** — suggested/searchable/custom tags → `tripContext: string[]`  
3. **Accommodation & laundry**  
4. **Who are you packing for?** — Packing Profiles (Me + optional others)  
5. **Bags**  
6. **Important items** — fixed review step: setup for unconfigured profiles, compact review for configured; optional (`Configure later` sets persistent `promptDismissed` per profile); Continue never blocks  
7. **Additional information** (note)

Flow: wizard → **Summary** → **Generating** (mock steps) → **Pack** tab with new trip active.

Adding a person to a draft selects them for that trip only. **Remember this person** is stored on the draft profile and committed to reusable saved profiles at **trip creation**, not when the person is first added.

### Target creation UX (MP2)

Replace **"Who's coming?"** with **"Who are you packing for?"**

| Default | Action |
|---------|--------|
| Me | Add someone |

For an additional person, MVP fields are minimal:

- Name
- Age / age information

**Do not ask for gender.** Goal: packing personalization, not full travel-party modeling.

Trip name may receive a sensible default and should become editable separately from destination.

### Trip context tags

- Primary chips + **Add tags** sheet with single search/add input
- Catalog tags in `src/domain/catalog.ts`; custom tags allowed
- Case-insensitive duplicate prevention
- **AI tag suggestions:** planned, not implemented

### Destination

- Structured fields: `displayName`, `placeId`, `latitude`, `longitude`, `countryCode`, `countryName`
- **Current:** free text + suggestion chips; Places autocomplete **not wired**
- **Planned:** Google Places populates structured fields; weather uses coordinates

---

## Important vs Essentials

These are **different concepts**. Do not conflate them.

### Important

| Aspect | Detail |
|--------|--------|
| Source | User-defined personal must-haves |
| Examples | Critical medication, house keys, personal equipment |
| AI | **Never** inferred or generated |
| Master list | Per Packing Profile (Profile person picker + trip-creation setup) |
| Enable/disable | When off, not injected into new lists for that profile |
| New lists | Receive a **snapshot** at list creation |
| Existing lists | Keep snapshot until user chooses **Update this list** |
| Stale detection | Master changes → notice on Pack; no silent sync |
| Empty master | Allowed |

### Essentials

| Aspect | Detail |
|--------|--------|
| Source | PackingWiz recommendations (mock generator today; OpenAI later) |
| Examples | Passport, wallet, charger |
| Scope | Generated **per packing list** (person-aware in target model) |

---

## Packing behavior

### Filters (implemented)

- **All** — full list; checkbox toggles `packed`
- **To pack** — unpacked items only
- **Shopping** — `needToBuy` items; checkbox marks **purchased** (`needToBuy` → false)

### Item capabilities

**Current:** toggle packed, quantity, need to buy, traveler assignment (`assignedTo`), add/delete custom items, item settings sheet (in progress).

**Target:** item operations scoped to the active Packing List; traveler assignment may be superseded or repurposed during MP migration.

### Deferred item features

- `need to wash` flag

---

## Trip opening & navigation (target)

| Trip lists | Opening behavior |
|------------|------------------|
| Exactly one | Open trip → go directly to **Pack** |
| Multiple | Open trip → lightweight **"Who are you packing for?"** picker with per-list progress hints |

Example picker:

```
Anna      18 / 32 packed
Emilie     9 / 24 packed
```

Inside Pack, provide a lightweight list switcher, e.g. **Packing for: Emilie ▾**. User should not need to return to Home to switch lists.

- **Trip Overview** — trip-level (shared context, weather, bags, insights)
- **Pack** — packing-list-level

### Current active-trip UX (legacy)

- User opens a trip from Trips or generates a new trip → that trip becomes active
- **Pack** and **Overview** operate on the active trip's single flat item list
- Navigating to **Profile** does not clear active trip
- No trip selected → Pack shows **"No trip selected"**
- No in-Pack packing-list picker or switcher yet

---

## Home / trip cards (target)

Trip cards represent the **Trip**, not an individual Packing List.

Example:

```
Hyttetur
Norefjell · 5 days · 2 people
3 / 47 packed
```

**Trip-level surfaces** (Home cards, Trip Overview) aggregate progress across all PackingLists: `sum(packed) / sum(total)` — not an average of list percentages. Multi-person cards may show `N people` in metadata.

**List-level surfaces** (Pack, packing-list picker) show progress for the active or selected PackingList only.

---

## Packing generation (target)

Generation boundary **per Packing List**:

```
Trip context
+ weather
+ Packing Profile / person context
+ that profile's Important Items
→ PackingGenerator
→ that person's Packing List
```

Each list can receive age/person-appropriate recommendations. OpenAI is **not** in scope until explicitly scheduled.

**Current:** one generation call produces one flat `Trip.items` list; weather is trip-level (correct in both models).

---

## User / account direction (planned)

- **Anonymous-first** preferred; data preserved on account upgrade
- Onboarding likely gathers profile, preferences, Packing Profiles, Important Items
- **Unit preferences:** `metricUnits` exists in mock Profile; Celsius/Fahrenheit split planned (Cleanup Phase 5)
- **Current:** Profile preferences and Important master are **in-memory only** (lost on full reload in mock mode)

---

## Trip images (planned)

Priority when implemented:

1. User-uploaded trip image  
2. Destination image from provider  
3. PackingWiz fallback (icon/tint by trip context — **current placeholder behavior**)

User upload → Supabase Storage (planned). Destination provider TBD.

---

## Explicitly deferred

Do not implement unless explicitly requested:

- Gender on Packing Profile
- Need to wash
- Google Places / destination autocomplete
- OpenAI packing generation
- Supabase persistence implementation (beyond existing opt-in repo)
- Image provider / user upload
- Affiliate shopping / product URLs on items
- Full i18n (English only today)
- Historical-trip reuse ("pack like last time")
- AI tag suggestions
- Advanced family sharing
- Subscription / paywall
- Broader travel planning (itinerary, bookings, etc.)
- **Mark as Important promotion** — promoting a regular PackingItem into the active profile's Important master (semantics, confirmation copy, filter behavior)

See [ROADMAP.md](./ROADMAP.md) for sequencing.

---

## Unresolved design questions

Document for future product decisions — do not guess in implementation:

1. **`travelers[]` migration** — remove vs keep as trip metadata separate from Packing Profiles
2. **Profile reuse across trips** — when/how saved Packing Profiles attach to new trips vs one-off people
3. **Active packing list state** — `activePackingListId` in provider vs route param vs derived from last-opened list
4. **Anonymous "Me" profile** — creation timing (first launch vs first trip) and persistence before auth
5. **Trip name default** — derive from destination, trip context, or user prompt
6. **Item → bag assignment** — UX and whether assignment replaces or complements list ownership
