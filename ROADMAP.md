# PackingWiz — roadmap

Current status and intended sequencing. Order may change based on user testing.

**Related:** [AGENTS.md](./AGENTS.md) · [PRODUCT.md](./PRODUCT.md) · [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## Current focus

PackingWiz has completed the core multi-person packing and profile-scoped Important
work plus the lightweight Quality Foundation (CI + unit-test harness). The next focus
is Trip lifecycle and management before external integrations.

Current sequence:

1. **MP5 — Trip Lifecycle & Management**
2. **MP6 — Multi-person cleanup / migration / persistence contract**
3. **Verification & Test Hardening**
4. **Cleanup Phase 4–5**
5. **Frontend freeze + manual accessibility pass**
6. Backend integrations and Web/SEO work
7. Alpha / beta
8. Launch

---

## Completed

### Quality Foundation — CI + unit-test harness — COMPLETE

- Jest + `jest-expo` for Expo SDK 57
- `npm test` / `npm test:watch` scripts
- Co-located `*.test.ts` unit tests for pure domain helpers
- GitHub Actions: TypeScript, ESLint, `verify:mp1`, unit tests
- Invariant harness preserved (`npm run verify:mp1`) — not migrated to Jest

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
- Draft preservation
- Continue-planning behavior
- Summary layout polish
- Weather preview
- Additional Information presentation
- Back to all trips from Pack
- Add-person sheet in wizard (mobile-friendly)

Packing mode has since migrated from the original trip-level assumption to the
per-PackingList multi-person model.

**Remaining lifecycle work:** post-generation Edit Trip, multiple drafts,
archive/delete, duplication/reuse, and richer Review Trip editing are now explicitly
owned by MP5.

### Cleanup Phase 3 — Packing item settings

- Explicit item settings entry point
- Rename
- Quantity
- Need to buy
- Purchase state
- Optional personal item note (`note`; user-editable; shown on Pack rows when set)
- Explicit **Update item** save model in Item Settings (dismiss discards staged edits)
- Pack header actions: Filter · Insights · Back to trips
- Trip-level Insights carry PackingWiz reasoning — not per-item Pack commentary
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

Known migration debt is intentionally retained until MP6.

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

### MP3 — List navigation — COMPLETE

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

#### MP3B — Picker / switcher — COMPLETE

- Single-list Trip → direct Pack
- Multi-list Trip → person/list selection when selection is required
- Entry picker: **Who are you packing for?**
- In-Pack switcher: **Packing for: {name} ▾**
- Shared PackingList display helpers
- List-specific progress in picker
- Switching updates Pack without route reset
- Settings state reconciles when switching lists
- No user-visible primary-list fallback for unresolved multi-list entry
- Accessibility labels / selected state / touch targets
- Cross-trip and list-specific regression coverage

---

## MP4 — Important Items per Packing Profile — IMPLEMENTED, FINAL REVIEW PENDING

Migrate Important Items from temporary self/global behavior to the final
profile-scoped model.

### MP4A — Profile-scoped domain/state — COMPLETE

- Important master stored per canonical `PackingProfile.id` (`profile-self` for Me)
- Profile-scoped provider APIs (`saveImportantItemsForProfile`, etc.)
- Legacy self Important data migrates to `profile-self` deterministically
- Disable retains saved items per profile; no cross-profile leakage
- Existing packing lists are not dynamically mutated by master edits
- Session/mock only — production persistence deferred

### MP4B — Snapshot into PackingLists — COMPLETE

- Each new PackingList receives a snapshot of its profile's enabled Important master items
- Generated and manual creation share the same profile-scoped resolution path
- `importantItemsForProfileList` reads canonical `importantByProfileId`
- Important items injected post-generation via `mergeImportantItems`
- Profile-level and item-level disable semantics preserved at snapshot time
- Existing lists remain independent of later master edits
- Snapshot items retain linkage to their Important master item where required

### MP4C — Profile-aware Important UX — IMPLEMENTED, FINAL REVIEW PENDING

- Fixed 7-step trip-creation wizard:
  1. Destination
  2. Trip context
  3. Accommodation
  4. Packing profiles
  5. Bags
  6. Important items
  7. Anything else?
  → Review Trip
- Important is always a fixed setup/review step
- Unconfigured selected profiles shown before configured profiles
- Configured profile cards show item count and updated date
- Compact Important item preview
- Configure later using profile-scoped `promptDismissed`
- Dismissed unconfigured cards become compact `Not configured` + `Edit`
- Inline staged Important editing in the wizard
- Wizard Continue commits staged Important changes
- No per-card Save action
- Important remains optional
- Profile uses vertical Important settings rows per traveller
- Profile editor shows last-updated information
- Pack Important context scoped to active PackingList profile
- Compact notice for unconfigured Important state
- Profile/list-scoped stale detection and explicit sync
- Draft-only profiles can hold Important state without becoming reusable
- Remembered non-self profiles are persisted to reusable session state only when the
  Trip is committed
- Important state migrates safely when a draft person resolves to an existing saved
  profile
- Aggregate trip progress on Home / Trips / Trip Overview
- Per-person breakdown on Trip Overview
- Pack and PackingList picker remain list-scoped
- Responsive multi-person Pack action/header layout

### MP4 invariants

- Important master belongs to a Packing Profile
- Saved Packing Profiles retain their own Important Items
- Self profile has its own Important master
- No Important state is shared accidentally between profiles
- Existing Packing Lists are not dynamically mutated by later master changes
- Sync affects only the intended person's Packing List
- Updating Me must not affect another profile
- Updating another profile must not affect Me
- Generated and manual Packing Lists follow the same Important ownership rules
- Configure later does not create items or mark a profile configured
- Wizard step count does not change based on Important configuration state

### MP4 completion gate

Before marking MP4 fully complete:

- Final code review
- Resolve blocking review findings
- Targeted manual regression if review changes behavior
- Commit / merge

---

# MP5 — Trip Lifecycle & Management

Define and implement the lifecycle of a Trip before final persistence contracts are
locked.

Core principle:

> Editing shared Trip context must never silently overwrite a user's existing
> Packing List work.

Existing generated/manual Packing Lists, checked progress, quantities, notes,
Need to buy state, and manual additions remain authoritative unless the user
explicitly chooses a destructive action.

Implement MP5 as small, independently reviewable slices.

---

## MP5A — Edit Trip contract

Define the domain/product contract before broad UI implementation.

### Entry points

Decide the final editing hierarchy.

Preferred direction:

- Trip Overview is the primary Trip-management/editing surface
- Pack may expose a compact **Edit trip** action that navigates to the appropriate
  Trip editing surface
- Review Trip allows editing individual sections or navigating directly to the
  relevant edit screen
- Review Trip provides **Back to all trips**

Do not overload the Pack task UI with full Trip-management controls.

### Editable shared Trip context

Support editing:

- destination
- dates
- trip context
- accommodation / laundry
- bags
- Packing Profiles / travellers
- Additional Information where appropriate

### Non-destructive editing

Changing shared Trip context must not automatically regenerate existing Packing Lists.

Examples:

Changing:

- dates
- destination
- weather context
- accommodation
- laundry
- bags
- trip tags/context

must preserve existing:

- Packing Items
- packed/unpacked state
- quantities
- personal notes
- Need to buy
- manual additions
- Important snapshots

A later recommendation-refresh flow may suggest changes, but must not silently
overwrite the user's list.

### Add traveller

Adding a Packing Profile to an existing Trip:

- preserves every existing Packing List
- creates exactly one new Packing List for the new traveller
- uses the current Trip context
- uses that profile's current enabled Important master
- allows generated/manual creation for the new list
- does not regenerate Me or any other existing traveller

The UI should clearly communicate that existing lists will not be changed.

### Remove traveller

Removing a traveller is destructive for that traveller's Trip-specific Packing List.

Require explicit confirmation such as:

> Remove Emilie?
>
> Emilie's packing list and packing progress for this trip will be permanently
> removed.

Removing the traveller must not delete the reusable Packing Profile or that
profile's Important master unless separately requested.

### Changed-context recommendations

Do not implement automatic destructive regeneration.

Define a later-safe direction such as:

**Trip details changed**
→ **Review recommendations**

A recommendation flow may propose additions/removals based on changed weather or
context, but the user must approve changes.

---

## MP5B — Multiple drafts

Replace the current single-draft assumption.

### Draft model

- Multiple TripDrafts can exist simultaneously
- Each draft has stable identity
- Starting a new draft must not overwrite another draft
- Draft state remains session/mock until persistence work
- Draft-only Packing Profiles remain isolated to their draft unless remembered at
  Trip commit

### Home UX

Add a **Continue planning** section capable of showing multiple drafts.

Prefer visible rows/cards rather than a hidden carousel.

Potential behavior:

- show the most relevant/recent drafts
- show a small bounded number on Home
- provide View all when needed

### Draft actions

- Resume correct draft
- Delete draft
- Confirm deletion where appropriate
- Preserve each draft's:
  - destination
  - dates
  - trip context
  - accommodation
  - Packing Profiles
  - bags
  - Important staged/configured state
  - Additional Information

---

## MP5C — Trip archive & deletion

Define clear lifecycle states for completed/previous Trips.

### Lifecycle

Distinguish:

- draft
- active/upcoming
- previous
- archived
- permanently deleted

Archive and delete must not mean the same thing.

### Previous Trips

Home should show a limited number of recent Previous Trips.

Preferred initial behavior:

- show approximately 3–5 recent trips
- provide **View trip archive** when more history exists

### Trip Archive

Add a Trip Archive / Manage Trips surface.

Initial behavior:

- chronological, newest first
- optionally grouped by year
- Archive
- Restore
- Delete permanently
- Duplicate

Do not add advanced search/filtering until there is enough trip history to justify it.

### Delete semantics

Deleting a Trip permanently deletes the Trip record and its Trip-specific Packing
Lists/items.

Trip deletion must not implicitly delete independent reusable data such as:

- saved Packing Profiles
- profile-scoped Important masters

Do not secretly retain deleted Trip history for future recommendation logic.

If historical reuse requires retained Trip data, that history must come from
non-deleted/archive data or a future explicit product/privacy contract.

---

## MP5D — Duplicate / reuse Trip

Provide explicit reuse before building intelligent automatic similarity.

### Duplicate Trip

Allow a user to create a new Trip from an existing Trip.

Potential framing:

**Plan another trip like Mallorca Beach**

Minimal flow:

- Destination
- Dates
- Packing for
- Start with the same packing items
- Create trip

The user should not be forced through the full creation wizard unless they choose
**Edit trip details**.

### Copy semantics

A duplicated Trip receives:

- fresh Trip id
- fresh PackingList ids
- fresh PackingItem ids
- selected Packing Profiles
- copied list content when requested
- reset packed/unpacked progress

Preserve useful content such as:

- item names
- quantities
- manual additions
- relevant notes where appropriate

Do not automatically AI-regenerate copied Packing Lists.

New dates/weather must not silently modify copied list content.

### Recommendation refresh

A future explicit action such as **Refresh recommendations** may compare the copied
list with current:

- destination
- dates
- weather
- trip context

and suggest additions/removals for approval.

### Automatic similar-trip reuse

Defer automatic semantic matching until explicit duplicate/reuse behavior is proven
useful.

Examples of later behavior:

- Lærdal for 3 days resembles a previous Lærdal trip
- Vik for 3 days has similar weather/context to a previous Bergen trip

Potential future prompt:

> This trip looks similar to Bergen · Aug 2026.
> Start with that packing list?

Do not make this a 1.0.0 blocker unless user testing demonstrates strong value.

---

# MP6 — Multi-person cleanup / migration / persistence contract

Formerly MP5.

Stabilize the final multi-person and Trip lifecycle domain before real persistence.

## Remove / reduce compatibility debt

Review and remove or repurpose where safe:

- flat `Trip.items`
- trip-level `packingMode`
- trip-level `generated`
- legacy `travelers[]` assumptions
- legacy `assignedTo` semantics
- deterministic primary-list compatibility where no longer required
- synthetic self-profile ids
- remaining draft/saved-profile identity debt

Compatibility should remain only where there is an explicit migration need.

## Assignment semantics

Legacy `assignedTo` labels are transitional metadata, not final multi-list ownership.

Define whether assigning an item to another person while viewing one PackingList
should:

- move the item into that person's PackingList
- copy the item into that person's PackingList

Require explicit feedback such as:

> This item will be moved to Emilie's packing list.

or:

> This item will be added to Emilie's packing list.

The final UX must make clear that the item belongs to that person's PackingList,
rather than merely carrying a person label.

Remove **Shared** where it no longer makes product sense, including solo travel.

## Important promotion semantics

Define whether a regular PackingItem can be promoted into the active Packing
Profile's reusable Important master.

Decide:

- whether promotion updates both current list and master
- confirmation behavior
- duplicate handling
- interaction with Important category
- interaction with future Important filtering

Do not treat Important as a generic decorative tag.

## Seeds / fixtures / regressions

- Canonical single-list fixtures
- Canonical multi-list fixtures
- Stable Packing Profile ids
- Regression coverage for old/normalized trips
- Manual + generated multi-list trips
- Profile-scoped Important fixtures
- Editable Trip fixtures
- Multiple-draft fixtures
- Archive/delete lifecycle fixtures
- Duplicate Trip fixtures

## Persistence contract

Define the final persistence model for:

- Trips
- Trip lifecycle/archive state
- TripDrafts if persisted independently
- Packing Profiles
- Packing Lists
- Packing Items
- profile-scoped Important Items
- profile snapshots
- preferences

Schema planning happens here.

Full production Supabase persistence happens after frontend freeze unless explicitly
reprioritized.

---

## Cleanup Phase 4 — Profile / onboarding readiness

After MP4–MP6 so Profile is built around the final Packing Profile and Trip lifecycle
model.

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

## Pre-freeze UX cleanup

Resolve small launch-facing UX issues that do not require new domain architecture.

### Trip creation / Summary

- Review Trip Summary 2×2 cards on narrow screens
- Prefer 1×4 if it improves readability on small devices
- Show number of nights where useful
- Derive nights from dates rather than storing duplicate state
- Add age-aware Important examples/placeholders
- Re-evaluate Trip Context + Accommodation step merge only if user testing justifies it

### Pack

- Consider category-aware Add Item defaults
  - e.g. adding while focused on Electronics may preselect Electronics
- Add safe recovery when the user selected Manual but wants PackingWiz generation
- Add safe recovery when the user generated a list but wants to start manually
- Never overwrite an existing list without explicit destructive confirmation
- Review all controls for understandable text/icon affordances

### Product polish

- Remove remaining **Trove** naming
- Use **PackingWiz** consistently
- Verify Good morning / afternoon / evening behavior
- Final copy consistency pass
- Final empty/loading/error-state review

### Explicitly not required for initial launch unless validated

- Item-name autocomplete
- User-configurable alphabetical sorting
- Quantity sorting
- Broad sorting preferences
- Per-item AI feedback High / Medium / Low
- Advanced Packing List search/filtering
- Automatic semantic similar-trip matching
- Packing templates

Prefer strong defaults over settings that have not demonstrated user value.

---

## Frontend freeze

After MP1–MP6 and Cleanup Phases 2–5.

This is a formal milestone before production backend integrations.

### Full product flow

Review:

Home
→ Create Trip
→ Packing Profiles
→ Important
→ Summary
→ Generate / Manual
→ PackingList picker
→ Pack
→ Switch person
→ Trip Overview
→ Edit Trip
→ Profile
→ Multiple drafts
→ Previous Trips / Archive
→ Duplicate Trip

### Quality pass

- Full UX review
- Navigation / back behavior
- Loading states
- Empty states
- Error states
- Responsive behavior
- Trip Summary narrow-screen layout
- Keyboard behavior
- Accessibility sanity check
- Clear text/icon affordances
- Web console warnings
- TypeScript
- ESLint
- Invariant suite
- iOS smoke test
- Android smoke test
- Web smoke test
- Agent/code review
- Regression cleanup

After frontend freeze, avoid major frontend/domain refactors unless a real product or
integration issue requires one.

---

# Production backend / integrations

Start after the multi-person model, Trip lifecycle, and frontend are stable unless
explicitly reprioritized.

Mock implementations remain the default until their integration phase begins.

## Backend 1 — Supabase persistence

Implement the MP6 persistence contract.

Persist:

- Trips
- Trip lifecycle/archive state
- Packing Profiles
- Packing Lists
- Packing Items
- Important Items
- preferences
- relevant user state
- drafts where required by the final lifecycle contract

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

### Forecast refresh near departure

For Trips within approximately 7 days of departure:

- allow PackingWiz to refresh the real forecast
- avoid silently changing an existing Packing List
- track refresh timing so users are not repeatedly prompted
- surface meaningful forecast changes when relevant
- prefer reviewable recommendations over automatic list mutation

Potential UX:

> Weather forecast updated.
> Rain is now expected on Tuesday.
> Review packing suggestions.

Exact cadence should be validated rather than hardcoding a daily prompt without
evidence.

## Integration 3 — OpenAI packing generation

Implement the real `PackingGenerator`.

Input context:

- shared Trip context
- destination
- dates
- weather/climate
- Packing Profile
- packing preferences

Important Items remain a deterministic profile-owned guarantee and are injected into
the resulting PackingList through the Important snapshot/merge path rather than
depending on AI to remember them.

Output:

- one Packing List per profile
- trip/list-level Insights summarizing noteworthy packing decisions:
  - weather
  - laundry
  - activities
  - destination-specific requirements
- no rationale for every obvious Packing Item

Pack stays task-focused and quiet.

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

## Integration 4 — Need to wash

Introduce **Need to wash** before launch if product testing continues to support it.

Define:

- item state
- Pack presentation
- interaction with packed state
- reset/completion semantics
- persistence contract

Avoid implementing it as an isolated UI flag without lifecycle semantics.

## Integration 5 — Images

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
- Trip editing
- adding/removing travellers from an existing Trip
- multiple drafts
- archive/restore/delete
- Duplicate Trip
- app restart
- persistence
- network failure
- API failure
- generator failure
- stale data
- changed weather
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
- Do they understand what happens when adding/removing a traveller?

### Trip lifecycle

- Can users find Edit Trip?
- Do users understand that editing Trip details does not overwrite their lists?
- Can users resume multiple drafts?
- Do Archive and Delete behave as expected?
- Is Duplicate Trip useful?
- Do users reuse previous Trip content?

### Retention

- Do users return to active trips?
- Do they reuse Packing Profiles?
- Do they maintain Important Items?
- Do they create another Trip?
- Do they duplicate or reuse previous Trips?

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

## Product / UX

- Final Trip lifecycle regression
- Final multi-person regression
- Final Important regression
- Final destructive-action review
- Accessibility sanity check
- Responsive-device pass
- Verify no remaining Trove naming
- Verify greeting behavior
- Verify Generate / Manual recovery behavior
- Verify forecast-refresh behavior
- Verify Need to wash if included in 1.0.0

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

# Post-MVP / Version 1.0.1+

Validate demand before implementing.

## Sharing / collaboration

- Share Packing Lists
- Export list data where useful
- JSON export
- XLS/XLSX export if validated
- Invite another user to PackingWiz
- Open/share a Packing List with family or another traveller

## Bags

- Personal bag notes
  - e.g. "The yellow one"

## Trip tags

- Multiple custom trip tags
- Edit/remove default tags
- AI tag suggestions when useful

## Packing Profiles

- Traveller profile pictures
- Additional saved-profile reuse polish
- Explore default traveller/group selections for people who usually travel together

## Packing List organization

- Move items between categories
- Define `Uncategorized` / `Misc` fallback if required
- Search Packing List
- Expanded filters if demanded
- Alphabetical sorting if demanded
- Quantity sorting if demanded

## Item entry intelligence

- Item-name autocomplete
- Duplicate-item detection
- Typo-aware duplicate suggestions
- Language-aware duplicate suggestions

Example:

> You already have "Lommebok" in Important.

## Historical / similar-trip reuse

Build only after explicit Duplicate Trip has been validated.

Potential behavior:

- exact destination/duration reuse suggestions
- similarity based on weather
- similarity based on trip context
- similarity based on duration
- explicit user acceptance

Example:

> This looks similar to Bergen · Aug 2026.
> Start with that packing list?

Do not rely on permanently deleted Trip data.

## Packing templates

Explore only if user behavior demonstrates that Duplicate Trip does not adequately
cover the use case.

Potential template dimensions:

- duration
- temperature
- bag type
- trip context

## Web app

Separate from the public marketing/SEO site:

- full PackingWiz web-app experience
- keyboard navigation
- web-specific accessibility
- richer responsive behavior

## Other validated-demand candidates

- Affiliate shopping / product recommendations
- Full i18n
- Subscription / premium
- Broader travel assistant
- Item → bag assignment UX
- Programmatic SEO at scale

---

# Deferred — do not implement unless scheduled

- Gender on Packing Profile
- Full i18n
- Affiliate shopping
- Subscription / premium
- Automatic semantic similar-trip reuse
- Packing templates
- Advanced configurable sorting
- Advanced Packing List search/filtering
- Per-item AI feedback level settings
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
- MP1–MP4 establish the multi-person packing model.
- MP5 establishes Trip lifecycle and management before persistence contracts are locked.
- MP6 cleans migration debt and defines the final persistence contract.
- Do not skip ahead to Supabase/OpenAI/Places/weather unless explicitly approved.
- Keep commits small and independently reviewable.
- Preserve mock/session behavior until the relevant persistence phase.
- Existing Packing Lists are authoritative user work; never silently regenerate or
  overwrite them when shared Trip context changes.
- Do not silently remove compatibility code before MP6 evaluates its migration purpose.
- Do not implement deferred features opportunistically.
- Stop after the requested phase.
- Run the repository validation commands required by `AGENTS.md`.
- When a phase completes, update this file only when explicitly requested.
