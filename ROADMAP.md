# PackingWiz — roadmap

Current status and intended sequencing. Order may change based on user testing.

**Related:** [AGENTS.md](./AGENTS.md) · [PRODUCT.md](./PRODUCT.md) · [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## Current focus

PackingWiz is completing the multi-person packing refactor before external integrations.

Current sequence:

1. Finish and verify **MP3 — List navigation**

2. **MP4 — Important Items per Packing Profile**

3. **MP5 — Multi-person cleanup / migration**

4. **Cleanup Phase 4–5**

5. **Frontend freeze**

6. Backend integrations and Web/SEO work

7. Alpha / beta

8. Launch

External integrations remain deferred until the multi-person domain and UX are stable.

---

## Completed

### Foundation / Cleanup Phase 1

- Expo SDK 57 app shell, fonts, theme tokens

- Expo Router: tabs (Trips, Pack, Profile) + trip creation stack

- Home / Trips list (upcoming + past)

- Create Trip wizard

- Summary + mock generation flow

- Pack screen — filters, categories, add item, celebration

- Trip Overview

- Profile

- Repository abstraction + `MockTripRepository` (default)

- Supabase schema + `SupabaseTripRepository` (opt-in / compatibility only)

- Structured `Destination` model

- Unified `tripContext: string[]` + tag sheet

- Important Items — master/snapshot model, stale notice, enable/disable

- Active trip model — explicit selection, no global/seed fallback

- State consistency fixes

- Developer harness docs

- TypeScript / ESLint validation conventions

- MP invariant harness

### Cleanup Phase 2 — Trip creation / Summary

- Generated vs manual packing mode

- Manual packing list creation

- Summary/review navigation

- Edit trip flow — **post-generation Edit trip details still required before frontend freeze; prefer entry from Trip Overview**

- Draft preservation

- Continue-planning behavior

- Summary layout polish

- Weather preview

- Additional Information presentation

- Back to all trips from Pack

- Add-person sheet in wizard (mobile-friendly)

Packing mode has since migrated from the original trip-level assumption to the

per-PackingList multi-person model.

### Cleanup Phase 3 — Packing item settings

- Explicit item settings entry point

- Rename

- Quantity

- Need to buy

- Purchase state

- Optional personal item note (`note`; user-editable; shown on Pack rows when set)

- Explicit **Update item** save model in Item Settings (dismiss discards staged edits)

- Pack header actions: Filter · Insights · Back to trips (explicit, no overflow menu)

- Trip-level Insights (Trip Overview) carry PackingWiz reasoning — not per-item Pack commentary

- Legacy traveler assignment support

- Delete

- Compact Pack rows (quantity/delete in settings)

- Clearer distinction between packing and item settings

- Item-specific accessibility labels

- Safe rollback behavior

- Shared settings sheet architecture

**Deferred:** need to wash.

---

## Multi-person Packing (MP)

**Prerequisite for the final product shape.**

A Trip is shared journey context. A Trip can contain one or more Packing Lists,

with one Packing List per Packing Profile.

Implement MP work as small, independently reviewable commits.

### MP1 — Domain / model foundation — COMPLETE

- `PackingProfile`
    - id

    - name

    - age / birth-date information

    - `isSelf`

    - no gender

- `PackingProfileSnapshot`

- `PackingList`
    - id

    - `packingProfileId`

    - profile snapshot

    - `packingMode`

    - items

- Trip name separated from destination

- Nested `packingLists[]`

- Legacy flat-trip compatibility helpers

- Deterministic legacy migration

- Primary PackingList helpers

- List-aware item mutation helpers

- Explicit multi-list seed / invariant fixtures

- Mock repository support for nested lists

- Supabase compatibility guardrails

- Custom/non-deterministic primary-list regression coverage

Known migration debt is intentionally retained until MP5.

### MP2 — Creation UX — COMPLETE

- Replace "Who's coming?" with **"Who are you packing for?"**

- Default **Me**

- Add another person with name + age

- No gender

- Reusable/saved Packing Profiles

- "People you've packed for before"

- "Remember this person"

- Stable ids for remembered profiles

- Trip-only ids for non-remembered profiles

- Validation for name, age, duplicates

- One Packing List per selected Packing Profile

- Per-list generated/manual packing mode

- Shared weather lookup once per trip

- One generator call per Packing List/profile

- Profile-aware generator contract

- Multi-list creation invariants

Temporary Important behavior remains self-only until MP4.

### MP3 — List navigation — IN VERIFICATION

#### MP3A — Active PackingList foundation — COMPLETE

- `activePackingListId`

- Active PackingList reconciliation

- List-scoped Pack state

- List-scoped item mutations

- List-scoped packing stats

- List-scoped celebration

- Repository APIs accept optional PackingList id

- Mock repository supports list-scoped CRUD

- Supabase rejects unsupported non-primary mutations

- Cross-trip selection protection

- Multi-list isolation invariants

- Actual primary-list resolution rather than deterministic-id assumptions

#### MP3B — Picker / switcher — IMPLEMENTED, MANUAL VERIFICATION PENDING

- Single-list Trip → direct Pack

- Multi-list Trip → person/list selection when selection is required

- Entry picker: **Who are you packing for?**

- In-Pack switcher: **Packing for: {name} ▾**

- Shared PackingList display helpers

- List-specific progress in picker

- Switching updates Pack without route reset

- Settings state reconciles when switching lists

- No user-visible primary-list fallback for unresolved multi-list entry

- Important UX remains self-only

- Accessibility labels / selected state / touch targets

- Cross-trip and list-specific regression coverage

Before marking MP3 complete:

- Manual single-list test

- Manual Me + additional person test

- Picker → Pack

- In-Pack switching

- Item mutation isolation

- Important self-only behavior

- Re-entry/resume behavior decision

- Copilot/code review

- Native/web smoke check as appropriate

---

## MP4 — Important Items per Packing Profile — IN PROGRESS

Migrate Important Items from the temporary self/global behavior to the final

profile-scoped model.

### MP4A — Profile-scoped domain/state — COMPLETE

- Important master stored per canonical `PackingProfile.id` (`profile-self` for Me)

- Profile-scoped provider APIs (`saveImportantItemsForProfile`, etc.)

- Legacy self Important data migrates to `profile-self` deterministically

- Disable retains saved items per profile; no cross-profile leakage

- Existing packing lists are not dynamically mutated by master edits

- Session/mock only — Supabase persistence deferred (MP5)

**Next:** MP4C Important UX

### MP4B — Snapshot into PackingLists — COMPLETE

- Each new PackingList receives a snapshot of its profile's enabled Important master items

- Generated and manual creation share the same profile-scoped resolution path

- `importantItemsForProfileList` reads canonical `importantByProfileId` (not bootstrap snapshots)

- Important items injected post-generation via existing `mergeImportantItems` (no generator changes)

- Profile-level and item-level disable semantics preserved at snapshot time

- Existing lists remain independent of later master edits

### MP4C — Profile-aware Important UX — COMPLETE

- Optional first-time Important setup in trip creation (per unconfigured profile)

- **MP4C correction:** fixed Important wizard step (setup + review; unconfigured first; optional Continue); Profile vertical Important rows; deferred remember-profile commit at trip creation

- Configure-later using persistent `promptDismissed` per profile

- Pack Important context, stale notice, and sync scoped to active PackingList profile

- Summary compact review for configured profiles

- **Trip-level aggregate progress** on Home/Trip Overview (`packingStatsForTrip`); Pack/picker remain list-scoped

**Next:** MP5 multi-person cleanup

### Domain

- Important master belongs to a Packing Profile

- Saved Packing Profiles retain their own Important Items

- Self profile has its own Important master

- No Important state shared accidentally between profiles

### PackingList creation

- Snapshot the selected profile's Important Items into that profile's Packing List

- Generated and manual Packing Lists follow the same ownership rules

### Sync / stale behavior

- Stale detection scoped to Packing Profile + Packing List

- Sync affects only the intended person's list

- Updating Me must not affect another profile

- Updating another profile must not affect Me

### Profile UX

If only one relevant Packing Profile:

- open Important directly

If multiple Packing Profiles:

- vertical settings rows per profile (e.g. "Important for Me" / "Important for Emilie")

- tapping a row opens that profile's Important editor

Preserve:

- enable / disable behavior

- saved items when disabled

- first-time setup

- restricted Important rename/delete behavior inside Pack

---

## MP5 — Multi-person cleanup / migration

Stabilize the final multi-person domain before real persistence.

### Remove / reduce compatibility debt

Review and remove or repurpose where safe:

- flat `Trip.items`

- trip-level `packingMode`

- trip-level `generated`

- legacy `travelers[]` assumptions

- legacy `assignedTo` semantics

- deterministic primary-list compatibility where no longer required

- synthetic self-profile ids

Compatibility should remain only where there is an explicit migration need.

### Seeds / fixtures / regressions

- Canonical single-list fixtures

- Canonical multi-list fixtures

- Stable Packing Profile ids

- Regression coverage for old/normalized trips

- Manual + generated multi-list trips

- Profile-scoped Important fixtures

### Supabase persistence contract

Define the final persistence model for:

- Trips

- Packing Profiles

- Packing Lists

- Packing Items

- profile-scoped Important Items

- profile snapshots

- preferences

Schema planning happens here.

Full production Supabase persistence happens after frontend freeze unless explicitly

reprioritized.

### Product decisions to resolve

- **Cross-list item assignment (transitional today):** `assignedTo` labels on items are legacy traveler metadata — not final multi-list semantics. Decide whether assigning an item to another person while viewing one PackingList should **move** or **copy** it into that person's list, and require explicit confirmation copy such as "This item will be moved to Emilie's packing list." or "This item will be added to Emilie's packing list." Final UX must make clear the item belongs in that person's PackingList, not merely that it carries a person label.

- **Mark as Important promotion:** whether a regular PackingItem can be promoted into the active Packing Profile's Important master and current list; confirmation copy; interaction with Important category/filter

- Final active-list resume behavior where necessary

---

## Cleanup Phase 4 — Profile / onboarding readiness

After MP4/MP5 so Profile is built around the final Packing Profile model.

- Profile preference model refinement

- Self Packing Profile ownership

- Saved Packing Profile management polish

- Onboarding-ready flows

- Gather preferences without requiring full auth

- Gather Important Items without requiring full auth

- Prepare for later account persistence

Do not implement full authentication here.

---

## Cleanup Phase 5 — Future readiness

### Units

- Metric / imperial preference

- Celsius / Fahrenheit preference as a separate setting

- Ensure weather presentation follows temperature preference

- Prepare packing-related measurements to follow unit preference

### i18n readiness

English only for MVP.

- Organize user-facing strings

- Reduce scattered hard-coded copy

- Prepare architecture for later localization

Do not implement full i18n.

### Affiliate architecture

Architecture only.

- Define future recommendation/product-link boundaries

- Keep commerce concerns out of core `PackingItem`

- No affiliate marketplace

- No affiliate URLs on `PackingItem`

---

## Frontend freeze

After MP1–MP5 and Cleanup Phases 2–5.

This is a formal milestone before production backend integrations.

### Full product flow

Review:

Home

→ Create Trip

→ Packing Profiles

→ Summary

→ Generate / Manual

→ PackingList picker

→ Pack

→ Switch person

→ Trip Overview

→ Important

→ Profile

### Quality pass

- Full UX review

- Navigation / back behavior

- Loading states

- Empty states

- Error states

- Responsive web behavior

- Keyboard behavior

- Accessibility

- Web console warnings

- TypeScript

- ESLint

- Invariant suite

- iOS smoke test

- Android smoke test

- Web smoke test

- Agent/code review

- Regression cleanup

After frontend freeze, avoid major frontend/domain refactors unless a real product

or integration issue requires one.

---

# Production backend / integrations

Start after the multi-person model and frontend are stable unless explicitly

reprioritized.

Mock implementations remain the default until their integration phase begins.

## Backend 1 — Supabase persistence

Implement the MP5 persistence contract.

Persist:

- Trips

- Packing Profiles

- Packing Lists

- Packing Items

- Important Items

- preferences

- relevant user state

Also address:

- migrations

- RLS

- repository implementation

- reload/restart persistence

- failure handling

- data ownership

- migration from temporary/local state where required

## Backend 2 — Authentication

Target low-friction first use.

Preferred direction:

anonymous/local identity

→ use PackingWiz

→ optional account upgrade

Requirements:

- preserve data during account linking

- login/logout

- account ownership

- account deletion

- recovery where applicable

## Backend 3 — Profile / onboarding persistence

- Persist self Packing Profile

- Persist reusable Packing Profiles

- Persist preferences

- Persist profile-scoped Important Items

- Connect onboarding/profile flows to real persistence

## Integration 1 — Destination autocomplete

Google Places or selected equivalent:

- autocomplete

- structured `Destination`

- coordinates

- country / region metadata

- weather lookup location

## Integration 2 — Real weather + climate

- Real forecast provider

- Coordinates from structured Destination

- Forecast for near-term trips

- Climate/historical fallback for trips beyond forecast range

- Weather summary

- Generator weather context

- Failure / unavailable-data fallback

## Integration 3 — OpenAI packing generation

Implement the real `PackingGenerator`.

Input context:

- shared Trip context

- destination

- dates

- weather/climate

- Packing Profile

- profile-scoped Important Items

- packing preferences

Output:

- one Packing List per profile

- trip/list-level Insights summarizing noteworthy packing decisions (weather, laundry,
  activities, destination-specific requirements) — **not** per-item Pack commentary;
  Pack stays task-focused and quiet; do not generate rationale for every obvious item

Production requirements:

- structured output

- schema validation

- retries/fallbacks

- duplicate handling

- prompt versioning

- latency UX

- cost controls

- logging/evaluation

- packing-list quality testing

## Integration 4 — Images

Only where validated as useful.

Potential scope:

- destination image provider

- user trip-image upload

- Supabase Storage

- fallback imagery

Exact ordering may change based on product testing.

---

# Web & SEO

A public PackingWiz website is part of MVP launch readiness.

This work can proceed **in parallel with backend/integration work** once the core

product positioning and UI are stable.

Prefer a separate web/marketing project rather than coupling SEO architecture to

the Expo app.

Likely stack: Next.js + Vercel.

## Web 1 — Marketing foundation

Public PackingWiz website:

- Homepage

- Product / features

- How it works

- Product screenshots

- App Store / Google Play CTAs when available

- About

- Support / contact

Primary goal:

Explain PackingWiz clearly and convert relevant visitors into users.

## Web 2 — Legal / trust

Launch-required or launch-supporting pages:

- Privacy Policy

- Terms of Service

- Support

- Account/data deletion information

- Relevant cookie/privacy handling if required

## Web 3 — Technical SEO

- SEO metadata

- Canonical URLs

- XML sitemap

- robots.txt

- Open Graph / social metadata

- Structured data where useful

- Google Search Console

- Analytics

- Performance / Core Web Vitals

- Indexation monitoring

## Web 4 — Search-intent landing pages

Perform keyword research before deciding the final page structure.

Start with a limited number of high-quality pages around real packing intent,

for example:

- packing list

- family packing list

- beach vacation packing list

- ski trip packing list

- weekend packing list

- business trip packing list

- packing with kids

Prioritize useful content over page volume.

Do not mass-publish thin AI-generated SEO pages.

## Web 5 — Guides / organic acquisition

Build useful destination, season and trip-type packing content.

Potential examples:

- What to pack for Iceland in October

- Packing for Norway in winter

- 7-day family vacation packing list

Desired funnel:

Search

→ useful PackingWiz content

→ personalized PackingWiz value proposition

→ app install / signup / trip creation

Programmatic SEO may be explored later using combinations such as:

destination × season/month × trip type

Only scale this after validating search demand, content quality and initial SEO

performance.

---

# Internal alpha

Begin once production persistence and the critical integrations are functional.

Focus on destructive/manual testing.

Test:

- new trips

- migrated trips

- single-person trips

- multi-person trips

- adults / children

- saved Packing Profiles

- manual packing

- generated packing

- Important Items

- trip editing

- app restart

- persistence

- network failure

- API failure

- generator failure

- stale data

- switching accounts where applicable

- iOS

- Android

- web

Also begin systematic evaluation of real AI packing output.

---

# External beta

- TestFlight

- Closed Android beta

- Small external user group

- Feedback-driven fixes

Measure and observe:

### Activation

- Do users understand PackingWiz?

- Can they create their first Trip without assistance?

- Do they understand who they are packing for?

### Packing quality

- Are generated lists useful?

- Are important items missing?

- Are lists too long or too short?

- Does profile/weather personalization feel relevant?

### Multi-person UX

- Do users understand Trip vs Packing List?

- Is "Packing for" intuitive?

- Is switching between people easy?

### Retention

- Do users return to active trips?

- Do they reuse Packing Profiles?

- Do they maintain Important Items?

- Do they create another trip?

Use beta findings for targeted fixes rather than reopening architecture without

evidence.

---

# Launch hardening

## Production

- Production environments

- Secrets management

- Supabase/RLS security review

- API rate limiting

- OpenAI cost protection

- Failure monitoring

- Crash reporting

- Analytics

- Privacy/data handling

- Account deletion

## App stores

- App icon

- Splash assets

- Screenshots

- App Store metadata

- Google Play metadata

- Privacy declarations

- Review requirements

- Deep links / public URLs where required

## Web

- Production domain

- Marketing site live

- Legal pages live

- Search Console configured

- Sitemap submitted

- Analytics verified

- Important SEO pages indexable

---

# Launch

- Apple App Store

- Google Play

- Production PackingWiz website

- SEO indexing

- Analytics funnels

- Crash monitoring

- AI quality monitoring

- API/cost monitoring

After launch, prioritize measured user behavior and feedback over roadmap assumptions.

---

# Post-MVP

Validate demand before implementing:

- Historical similar-trip reuse

- AI tag suggestions

- Affiliate shopping / product recommendations

- Full i18n

- Packing Profile reuse polish

- Subscription / premium

- Broader travel assistant

- Item → bag assignment UX

- Need to wash

- Programmatic SEO at scale

---

# Deferred — do not implement unless scheduled

- Gender on Packing Profile

- Need to wash

- Full i18n

- Affiliate shopping

- Subscription / premium

- Similar-trip reuse

- Broader travel assistant

- Item → bag assignment

- Large-scale programmatic SEO

External integrations such as Supabase production persistence, Google Places,

weather providers, OpenAI and image providers are **scheduled roadmap work**, but

must not be implemented early during MP/frontend cleanup unless explicitly requested.

---

# How to use this roadmap (agents)

- Implement **only** the phase or item the user requests.

- Read `AGENTS.md`, `PRODUCT.md`, `ARCHITECTURE.md`, and this roadmap before major work.

- Multi-person Packing MP1–MP5 takes precedence over production backend integrations.

- Do not skip ahead to Supabase/OpenAI/Places/weather unless explicitly approved.

- Keep commits small and independently reviewable.

- Preserve mock/session behavior until the relevant persistence phase.

- Do not silently remove compatibility code before MP5 evaluates its migration purpose.

- Do not implement deferred features opportunistically.

- Stop after the requested phase.

- Run the repository validation commands required by `AGENTS.md`.

- When a phase completes, update this file only when explicitly requested.
