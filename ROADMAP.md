# PackingWiz — roadmap

Current status and intended sequencing. Order may change based on user testing.

**Related:** [AGENTS.md](./AGENTS.md) · [PRODUCT.md](./PRODUCT.md) · [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## Completed

Foundation and Cleanup Phase 1 (Expo rebuild on `rebuild/expo-app` / merged to main):

- [x] Expo SDK 57 app shell, fonts, theme tokens
- [x] Expo Router: tabs (Trips, Pack, Profile) + trip creation stack
- [x] Home / Trips list (upcoming + past)
- [x] Create Trip — 6-step wizard
- [x] Summary + mock generation flow
- [x] Pack screen — filters, categories, add item, celebration
- [x] Trip Overview
- [x] Profile — travelers, preferences, Important Items management
- [x] Repository abstraction + `MockTripRepository` (default)
- [x] Supabase schema + `SupabaseTripRepository` (opt-in)
- [x] Structured `Destination` model
- [x] Unified `tripContext: string[]` + tag sheet
- [x] Important Items — master/snapshot model, stale notice, enable/disable
- [x] Active trip model — explicit selection, no seed fallback
- [x] State consistency fixes (deep clone, surgical rollback, `updateTripPackingItems`)
- [x] Developer harness docs (this file set)

Partial / in-progress cleanup (may land before or during MP):

- [x] Manual packing list creation (`packingMode: 'manual'` at trip level — to migrate to per-list in MP)
- [x] Summary/review editing and navigation polish (Cleanup Phase 2B–2C)
- [ ] Packing item settings UI (Cleanup Phase 3 — in progress)

---

## Multi-person Packing (MP) — before external integrations

**Prerequisite for correct product shape.** Supersedes the earlier **one packing list per trip** MVP assumption.

Implement as **small, independently reviewable commits** — one MP sub-phase or logical slice at a time.

### MP1 — Domain / model foundation

- [ ] `PackingProfile` type (id, name, age info, `isSelf`; **no gender**)
- [ ] `PackingList` type (`packingProfileId` or embedded snapshot, `packingMode`, `items[]`)
- [ ] Trip **name** vs **destination** separation (evolve from `Trip.title`)
- [ ] Migration helpers: flat `Trip.items` ↔ nested `packingLists[]` for mocks/tests
- [ ] No major UX redesign yet — internal model + provider/repository contracts only

### MP2 — Creation UX

- [ ] Replace **"Who's coming?"** with **"Who are you packing for?"**
- [ ] Default **Me** + **Add someone**
- [ ] Additional person: name + age only
- [ ] Create one **Packing List** per selected Packing Profile
- [ ] Per-list `packingMode` (generated vs manual) at creation/summary

### MP3 — List navigation

- [ ] Single list → open trip directly to Pack
- [ ] Multiple lists → lightweight person/list picker on trip open
- [ ] In-Pack switcher: **Packing for: {name} ▾**
- [ ] Trip Overview remains trip-level; Pack scoped to active list
- [ ] `activePackingListId` (or equivalent) in provider/navigation

### MP4 — Important Items migration

- [ ] Important master **per Packing Profile**
- [ ] Per-list Important snapshots at list creation
- [ ] Stale/sync behavior scoped to profile + packing list
- [ ] Profile UX: direct list if one profile; people picker if multiple

### MP5 — Cleanup / migration

- [ ] Remove or repurpose obsolete **traveler assignment** assumptions (`assignedTo`, trip `travelers[]` as list driver)
- [ ] Migrate mocks/seeds (include multi-list exemplar trips)
- [ ] Regression pass: single-list and multi-list trips
- [ ] Define persistence contracts for Supabase (**schema work explicitly planned here — not during MP1–MP4 mock refactor**)

---

## Cleanup Phase 2 (remaining)

May proceed in parallel with early MP work where non-conflicting:

- [x] AI-generated vs **manually created** packing list (trip-level — migrate to per-list in MP2)
- [x] Review/Summary navigation improvements
- [x] **Back to all trips** from pack/overview flows

---

## Cleanup Phase 3 — Packing item settings

Explicit item actions (reduce implicit/tap-only behavior):

- [ ] Item settings entry point
- [ ] Rename
- [ ] Quantity
- [ ] Need to buy
- [ ] Traveler assignment *(may be deprecated/replaced during MP5)*
- [ ] Delete
- [ ] Clearer distinction: pack vs purchase vs settings

**Deferred from Phase 3:** need to wash (see Deferred below)

---

## Cleanup Phase 4 — Profile / onboarding readiness

- [ ] Profile preference model refinement
- [ ] Important management polish *(absorbed into MP4 for multi-profile Important)*
- [ ] Onboarding-readiness (flows that gather preferences + Packing Profiles + Important without full auth)

---

## Cleanup Phase 5 — Future-readiness (no full implementation)

- [ ] Metric/imperial + Celsius/Fahrenheit preference split
- [ ] i18n-friendly string organization (English only; no full i18n)
- [ ] Affiliate/product recommendation **architecture** only — no URLs on `PackingItem`

---

## Frontend freeze

After Cleanup Phases 2–5 **and** Multi-person Packing (MP1–MP5):

- [ ] Full UX pass
- [ ] Web console / accessibility pass
- [ ] Native smoke test (iOS + Android)
- [ ] Agent/code review (Codex or equivalent)
- [ ] Resolve remaining regressions

---

## Backend / integration sequence

**Starts after MP1–MP5** unless explicitly reprioritized. Mock implementations stay until each step is scheduled.

1. **Supabase persistence** — trips, Packing Profiles, Packing Lists, profile-scoped Important *(schema redesign in MP5 first)*
2. **Anonymous auth + account upgrade** — preserve data on link
3. **Onboarding / profile persistence**
4. **User trip-image upload** — Supabase Storage
5. **Destination autocomplete** — Google Places → structured `Destination`
6. **Weather + climate fallback** — real provider using coordinates
7. **Destination image provider** — for trip hero images
8. **OpenAI packing generation** — implement `PackingGenerator` **per packing list**

---

## Alpha / beta

- [ ] Internal alpha — destructive/manual testing
- [ ] TestFlight / closed Android beta
- [ ] Small user group
- [ ] Feedback-driven fixes

---

## Launch

- [ ] Production hardening
- [ ] Error / loading / offline-ish states
- [ ] Analytics + crash reporting decision
- [ ] Privacy / legal requirements
- [ ] App icon, splash, store metadata
- [ ] App Store + Google Play submission

---

## Post-MVP (validate demand first)

- Historical similar-trip reuse
- AI tag suggestions
- Affiliate shopping
- Full i18n
- Packing Profile reuse polish across many trips
- Subscription / premium
- Broader travel assistant
- Item → bag assignment UX
- Finalized multi-list aggregate progress on Home cards

---

## Deferred (explicit — do not implement unless requested)

- Gender on Packing Profile
- Need to wash
- Google Places
- OpenAI
- Supabase implementation (beyond MP5-planned contracts)
- Image provider / upload
- Affiliate shopping
- i18n

---

## How to use this roadmap (agents)

- Implement **only** the phase or item the user requests
- **Multi-person Packing (MP1–MP5)** takes precedence over backend integration for product correctness
- Do not skip ahead to Supabase/OpenAI/Places without explicit approval
- Keep MP commits small and independently reviewable
- When a phase completes, update this file if the user asks — do not auto-edit roadmap during feature work
