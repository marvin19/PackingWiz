# PackingWiz — product definition

What PackingWiz is and the product decisions agents must preserve.

**Related:** [AGENTS.md](./AGENTS.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [ROADMAP.md](./ROADMAP.md)

---

## Product vision

PackingWiz is an intelligent packing-list app for **iOS and Android**.

**Core loop:**

```
Trip context → weather/climate → personalized packing list → user edits/packs → trip remains available
```

The packing list is the **initial product**. Broader travel-assistant features are future possibilities, not current scope.

---

## MVP principles

- Fast trip creation
- AI should **reduce work**, not create configuration burden
- **One shared list per trip**
- User always retains manual control
- Weather context matters for list quality
- Prefer **try-before-signup** direction (anonymous-first)
- Avoid overbuilding before validating demand

### Current vs planned

| Principle | Current implementation | Planned |
|-----------|------------------------|---------|
| Manually created empty list | All trips go through mock generation flow | Cleanup Phase 2 |
| Try before signup | Mock mode needs no auth; Supabase mode uses anonymous auth | Full anonymous → account upgrade |
| Registration | Not required in mock mode | Google/Apple/email upgrade path |

---

## Trip creation

### 6-step wizard (implemented)

1. **Destination & dates** — structured `Destination` + date range  
2. **Trip context** — suggested/searchable/custom tags → `tripContext: string[]`  
3. **Accommodation & laundry**  
4. **Travelers** — presets + custom rows  
5. **Bags**  
6. **Additional information** (note)

Flow: wizard → **Summary** → **Generating** (mock steps) → **Pack** tab with new trip active.

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
| Master list | Profile → Important Items management |
| Enable/disable | `isEnabled` — when off, not injected into new trips; Pack hides Important section |
| New trips | Receive a **snapshot** at generation (`mergeImportantItems`) |
| Existing trips | Keep snapshot until user chooses **Update this list** |
| Stale detection | Master changes → notice on Pack; no silent sync |
| Empty master | Allowed (`isConfigured: true`, `items: []`) |

### Essentials

| Aspect | Detail |
|--------|--------|
| Source | PackingWiz recommendations (mock generator today; OpenAI later) |
| Examples | Passport, wallet, charger |
| Scope | Generated **per trip** into normal categories |

---

## Packing behavior (implemented)

### Filters

- **All** — full list; checkbox toggles `packed`
- **To pack** — unpacked items only
- **Shopping** — `needToBuy` items; checkbox marks **purchased** (`needToBuy` → false)

### Item capabilities (current)

- Toggle packed
- Quantity (provider support exists; explicit item settings UI planned — Cleanup Phase 3)
- Need to buy + purchased in Shopping view
- Traveler assignment (`assignedTo`)
- Add custom items
- Delete items (provider support exists)

### Planned (not implemented)

- `need to wash` flag
- Explicit per-item settings sheet (rename, quantity, assignment, delete in one place)

---

## Active trip UX

- User **opens a trip from Trips** or **generates a new trip** → that trip becomes active
- **Pack** and **Overview** operate on the active trip
- Navigating to **Profile** does not clear active trip
- No trip selected → Pack shows **"No trip selected"** with link to Trips
- No in-Pack trip picker (by design)

---

## User / account direction (planned)

- **Anonymous-first** preferred; data preserved on account upgrade
- Onboarding likely gathers profile, preferences, Important Items
- **Unit preferences:** `metricUnits` exists in mock Profile; Celsius/Fahrenheit split planned (Cleanup Phase 5)
- **Current:** Profile preferences and Important master are **in-memory only** (lost on full reload in mock mode)

---

## Trip images (planned)

Priority when implemented:

1. User-uploaded trip image  
2. Destination image from provider  
3. PackingWiz fallback (icon/tint by trip context — **current placeholder behavior**)

User upload → Supabase Storage (planned). Destination provider TBD — do not lock to a vendor in product copy.

---

## Explicitly deferred

Do not implement unless explicitly requested:

- Affiliate shopping / product URLs on items
- Full i18n (English only today)
- Multiple packing lists per traveler
- Historical-trip reuse ("pack like last time")
- AI tag suggestions
- Advanced family sharing
- Subscription / paywall
- Broader travel planning (itinerary, bookings, etc.)

See [ROADMAP.md](./ROADMAP.md) for sequencing.
