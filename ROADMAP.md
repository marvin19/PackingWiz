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

---

## Next — Cleanup Phase 2

- [ ] AI-generated vs **manually created** packing list (empty list path)
- [ ] Review/Summary navigation improvements — edit from summary, clearer back paths
- [ ] **Back to all trips** from review/overview flows

---

## Cleanup Phase 3 — Packing item settings

Explicit item actions (reduce implicit/tap-only behavior):

- [ ] Item settings entry point
- [ ] Rename
- [ ] Quantity
- [ ] Need to buy
- [ ] Need to wash (new flag)
- [ ] Traveler assignment
- [ ] Delete
- [ ] Clearer distinction: pack vs purchase vs settings

---

## Cleanup Phase 4 — Profile / Important / onboarding readiness

- [ ] Profile preference model refinement
- [ ] Important management polish
- [ ] Onboarding-readiness (flows that gather preferences + Important without full auth)

---

## Cleanup Phase 5 — Future-readiness (no full implementation)

- [ ] Metric/imperial + Celsius/Fahrenheit preference split
- [ ] i18n-friendly string organization (English only; no full i18n)
- [ ] Affiliate/product recommendation **architecture** only — no URLs on `PackingItem`

---

## Frontend freeze

After cleanup phases 2–5:

- [ ] Full UX pass
- [ ] Web console / accessibility pass
- [ ] Native smoke test (iOS + Android)
- [ ] Agent/code review (Codex or equivalent)
- [ ] Resolve remaining regressions

---

## Backend / integration sequence

Planned order (may adjust):

1. **Supabase persistence** — trips (+ eventually profile/Important)
2. **Anonymous auth + account upgrade** — preserve data on link
3. **Onboarding / profile persistence**
4. **User trip-image upload** — Supabase Storage
5. **Destination autocomplete** — Google Places → structured `Destination`
6. **Weather + climate fallback** — real provider using coordinates
7. **Destination image provider** — for trip hero images
8. **OpenAI packing generation** — implement `PackingGenerator`

Mock implementations stay until each step is explicitly scheduled.

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
- Multi-list / family expansion
- Subscription / premium
- Broader travel assistant

---

## How to use this roadmap (agents)

- Implement **only** the phase or item the user requests
- Do not skip ahead to integration work without explicit approval
- When a phase completes, update this file if the user asks — do not auto-edit roadmap during feature work
