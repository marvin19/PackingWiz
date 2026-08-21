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

### Important Items

- Important master list = **user/profile** (`ImportantItemsPreferences`)
- Trips store **snapshots** only; existing trips do **not** auto-update when master changes
- User explicitly syncs via Pack stale notice (**Update this list** / **Keep current list**)
- Important items are **never AI-generated**

### UI / accessibility

- Preserve accessibility labels on interactive controls
- Prefer existing components in `src/components/` and tokens in `src/theme/` before creating duplicates

### Scope

- **Do not implement** future roadmap features unless explicitly requested
- **Do not start** the next cleanup/integration phase automatically after finishing a task

---

## Product invariants agents must respect

See [PRODUCT.md](./PRODUCT.md) for full context. Non-negotiables:

| Topic | Rule |
|-------|------|
| Packing lists | One shared list per trip in MVP |
| Travelers | Context + optional item assignment — **not** separate lists |
| Important vs Essentials | Different concepts, different sources |
| Important | User-defined; master in Profile; snapshot per trip |
| Essentials | Generated/mock recommendations per trip |
| Trip context | Single canonical `tripContext: string[]` on trip/draft |
| Destination | Structured `Destination` object — not a display string only |
| Active trip | Explicit selection; Pack/Overview use `activeTripId` |
| Shopping filter | Checkbox = purchased/handled (`needToBuy` cleared) — keep semantics clear |

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
