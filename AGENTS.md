# PackingWiz — agent instructions

Operational guide for coding agents (Cursor, Codex, etc.) working in this repository.

**Also read:** [PRODUCT.md](./PRODUCT.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [ROADMAP.md](./ROADMAP.md)

---

## Project stack

| Layer | Choice |
|-------|--------|
| App | React Native (Expo SDK **57**) |
| Language | TypeScript |
| Navigation | Expo Router (`src/app/`) |
| Styling | React Native `StyleSheet` + semantic tokens in `src/theme/` |
| State | React providers in `src/providers/` |
| Data | Repository/service abstractions; **mock is default** |
| Backend | Supabase planned/opt-in; schema exists but not production-default |
| Reference UI | `v0-prototype/` — **read-only reference, never modify** |

**Expo docs:** read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing Expo-specific code.

**Do not introduce:** Next.js, shadcn, Tailwind, NativeWind, or other web-first UI stacks.

---

## Mandatory rules

### Repository boundaries

- **Never modify `v0-prototype/`**
- Keep route files in `src/app/` **thin** — delegate to `src/features/**/screens`
- Keep **domain logic** in `src/domain/` and **services** in `src/services/` — not in presentation components
- UI must **not** call Supabase, OpenAI, or weather APIs directly
- Use `TripRepository`, `PackingGenerator`, `WeatherService` via `createAppServices()` / providers
- **Mock implementations remain default** until the relevant integration phase (see [ROADMAP.md](./ROADMAP.md))
- Avoid unnecessary dependencies

### Trip / state invariants

- **Never silently fall back** to a seed or default trip when `activeTripId` is missing or invalid
- Missing active trip → explicit empty / not-found UI (see `pack-screen.tsx`)
- Opening a trip from Trips or committing a new trip sets `activeTripId`; Profile tab navigation must **not** clear it
- React trip state and `TripRepository` must stay consistent (see [ARCHITECTURE.md](./ARCHITECTURE.md))

**Target (not yet implemented):** when a trip has multiple packing lists, also track the **active packing list** for Pack. Do not implement until the Multi-person Packing (MP) phases are explicitly requested.

### Important Items

**Target architecture:**

- Important master list belongs to a **Packing Profile** (person), not the trip and not one global user list
- Each **Packing List** receives a **snapshot** of that profile's enabled Important Items at creation
- Existing list snapshots do **not** auto-update when the master changes
- User explicitly syncs via Pack stale notice (**Update this list** / **Keep current list**) — conceptually per profile / packing list
- Important items are **never AI-generated**

**Current runtime (legacy):** Important master is user-global in `ProfileProvider` → `ImportantItemsPreferences`; snapshots live on `Trip.items`. Treat this as migration debt until MP4.

### UI / accessibility

- Preserve accessibility labels on interactive controls
- Prefer existing components in `src/components/` and tokens in `src/theme/` before creating duplicates

### Scope

- **Do not implement** future roadmap features unless explicitly requested
- **Do not start** the next cleanup/integration phase automatically after finishing a task
- **Do not implement** Multi-person Packing (MP1–MP5) unless explicitly requested

---

## Product invariants agents must respect

See [PRODUCT.md](./PRODUCT.md) for full context.

### Target architecture (planned)

| Topic | Rule |
|-------|------|
| Trip | Shared journey container: name, destination, dates, trip context, accommodation/laundry, weather, bags, packing lists |
| Trip name vs destination | Separate concepts — e.g. name "Hyttetur", destination "Norefjell, Norway" |
| Packing Profile | Reusable person the user packs for (e.g. Anna, Emilie); may include name, age, `isSelf`; owns Important master |
| Packing List | One per Packing Profile per trip; owns items and `packingMode: 'generated' \| 'manual'` |
| Bags | Trip-level physical objects; may be shared; not Packing Profile objects |
| Important | Per Packing Profile master + per Packing List snapshot; never AI-generated |
| Essentials | Generated recommendations per packing list (person-aware) |
| Trip context | Single canonical `tripContext: string[]`; destination/place must not be duplicated as tags |
| Pack UX | Trip-level Overview; Pack is packing-list-level with in-Pack list switcher when multiple lists |
| Home cards | Represent the **Trip**, not an individual packing list |
| Gender | **Not** in MVP model — do not add |

### Current runtime (until MP migration)

The codebase still largely implements `Trip → PackingItem[]`. Agents must not assume the target model is live:

| Topic | Current behavior |
|-------|------------------|
| Packing lists | Single flat list on `Trip.items` |
| `packingMode` | On `Trip`, not per list |
| Travelers | Wizard step "Who's coming?" → `travelers[]` + optional `assignedTo` on items |
| Important master | User-global in Profile, not per Packing Profile |
| Pack navigation | One active trip; no packing-list picker or switcher |
| Trip name | Uses `Trip.title` today; separation from destination is incomplete |

When changing current code, preserve existing behavior unless the user requests an MP phase. When designing new abstractions, align with the **target** model in [ARCHITECTURE.md](./ARCHITECTURE.md).

### Unchanged invariants

| Topic | Rule |
|-------|------|
| Important vs Essentials | Different concepts, different sources |
| Active trip | Explicit selection; Overview uses `activeTripId` |
| Shopping filter | Checkbox = purchased/handled (`needToBuy` cleared) — keep semantics clear |
| No silent Important sync | Master changes require explicit user action on stale notice |

---

## Development workflow

We use **small logical commits**, not large milestone dumps.

When implementing changes:

1. **One logical change at a time** (one bug, one UX slice, one refactor)
2. Run validation (below)
3. **Report** what changed and why
4. **Let the user test** when behavior changes
5. Do **not** bundle unrelated fixes
6. Do **not** automatically continue to the next milestone/phase
7. Do **not commit** unless explicitly asked
8. Do **not push** unless explicitly asked

For Multi-person Packing work: keep MP sub-phases (**MP1**–**MP5**) as separate, reviewable commits.

---

## Validation

Default checks after code changes:

```bash
npx tsc --noEmit
npx eslint src
```

Full web/native smoke tests may be requested separately by the user.

---

## Code review behavior

When asked for review **without** implementation:

- Do **not** modify code unless explicitly asked
- Prioritize findings by severity
- Focus on: data loss, state consistency, architecture violations, accessibility, security, race conditions, regression risk
- Include **file references** (path + line where helpful)
- Distinguish **confirmed issues** from **suggestions**
- Flag code that cements legacy `Trip.items` assumptions when MP migration is imminent

---

## Key paths (quick reference)

```
src/app/              Expo Router routes (thin)
src/features/         Screens, feature components, hooks
src/domain/           Types + pure domain logic
src/services/         Application services (packing, weather, assembly)
src/repositories/     TripRepository + mappers
src/providers/        TripsProvider, ProfileProvider, AuthProvider, …
src/config/           Persistence mode, service wiring
src/theme/            Colors, typography, spacing, shadows
src/mocks/            Seed trips, mock generator/weather logic
v0-prototype/         Reference only — do not edit
```
