# PupPal --- AI Puppy Training App

> "Like having a dog trainer on call 24/7"

PupPal is an AI-powered puppy training app that solves new puppy parent anxiety. Not a content library --- a personalized mentor that knows your dog's breed, age, temperament, and training history. Available 24/7, costs less per year than a single training session.

## Target User

"Anxious First-Time Puppy Mom" --- Female, 25-38, millennial/older Gen Z, city/suburbs, just got or planning to get a puppy. Treats dog as family. Researches everything. Currently Googling at 2am, watching conflicting YouTube videos, feeling overwhelmed and guilty. Wants to feel confident, in control, like a good dog parent.

## Business Model

Freemium subscription via App Store/Google Play. 3-day free trial -> $39.99/year (primary) or $9.99/month. Free tier: Week 1 training, 3 Buddy messages/day, limited health tracking. Revenue target: $100K MRR by month 6.

---

## Tech Stack

### Mobile App
- **Framework**: React Native + Expo SDK 54 (managed workflow)
- **Routing**: Expo Router v6 (file-based routing)
- **Language**: TypeScript (strict mode)
- **Styling**: NativeWind v4 (Tailwind CSS for React Native)
- **State**: Zustand v5 (client state with AsyncStorage persistence) + TanStack Query v5 (server state/caching)
- **Forms**: React Hook Form + Zod validation
- **Animations**: React Native Reanimated 4 + Moti

### Backend
- **Platform**: Supabase (hosted Postgres + Auth + Storage + Edge Functions + Realtime)
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth (Apple Sign-In, Google Sign-In)
- **Storage**: Supabase Storage (dog photos, vet records, journal photos)
- **Edge Functions**: Deno/TypeScript (breed detection, future: AI proxy, plan generation, cron jobs)

### AI
- **Chat Provider**: Claude Sonnet 4.6 (`claude-sonnet-4-6-20250514`) via Supabase Edge Function
  - API key (`ANTHROPIC_API_KEY`) is a server-side Edge Function secret --- never in client code
  - Edge Function: `supabase/functions/buddy-chat/index.ts` proxies to Anthropic Messages API
  - `max_tokens: 1024`, rate limited (20 req/min/IP), content moderation built in
  - Client calls Edge Function via Supabase URL + anon key (no streaming, word-by-word rendering client-side)
- **Breed Detection**: Google Cloud Vision API via Supabase Edge Function (fallback: manual breed selector)

### Payments & Monetization
- **Subscriptions**: RevenueCat (Apple/Google IAP)
- **Paywall A/B Testing**: Superwall (dynamic paywalls, no app update needed)
- **Entitlement**: `premium` (single entitlement gates all premium features)

### Analytics & Monitoring
- **Product Analytics**: PostHog (analytics + feature flags + session replay)
- **Error Tracking**: Sentry (React Native SDK)

### Push Notifications
- **Provider**: OneSignal (segmentation, automation, in-app messaging)
- **Local backup**: Expo Notifications (offline medication/streak reminders)

### CI/CD
- **Build**: EAS Build
- **Submit**: EAS Submit
- **Updates**: EAS Update (OTA updates, no App Store review)

---

## Project Structure (Actual)

```
puppal/
+-- CLAUDE.md                          <- You are here
+-- docs/
|   +-- PupPal-Build-Playbook.md       <- Step-by-step dev guide
|   +-- PRD-01 through PRD-15          <- Feature specs (see PRD Reference)
|   +-- TECH-STACK.md                  <- Tech decisions
|   +-- DESIGN-SYSTEM.md              <- Visual design, components, wireframes
+-- app/                               <- Expo Router file-based routes
|   +-- (onboarding)/                  <- 8-screen onboarding flow
|   |   +-- _layout.tsx
|   |   +-- index.tsx                  <- Screen 1: Meet Buddy
|   |   +-- name.tsx                   <- Screen 2: Dog name
|   |   +-- photo.tsx                  <- Screen 3: Photo + breed detection
|   |   +-- age.tsx                    <- Screen 4: Dog age
|   |   +-- challenges.tsx             <- Screen 5: Challenge selection
|   |   +-- experience.tsx             <- Screen 6: Owner experience
|   |   +-- plan-preview.tsx           <- Screen 7: Personalized plan (12 weeks)
|   |   +-- paywall.tsx                <- Screen 8: Paywall
|   +-- (tabs)/                        <- Main app tab navigation
|   |   +-- _layout.tsx
|   |   +-- index.tsx                  <- Home / Today's Training
|   |   +-- chat.tsx                   <- Buddy AI Chat
|   |   +-- plan.tsx                   <- Training Plan + Tricks
|   |   +-- health.tsx                 <- Health dashboard (5 sub-tabs)
|   |   +-- profile.tsx               <- Profile, settings, achievements
|   +-- exercise/[id].tsx              <- Exercise detail + completion
|   +-- achievements/index.tsx         <- Full achievements grid
|   +-- add-dog/index.tsx              <- Multi-dog: add new dog (629 lines)
|   +-- dog/[id]/manage.tsx            <- Multi-dog: manage/edit dog (485 lines)
|   +-- breeds/
|   |   +-- index.tsx                  <- Breed encyclopedia browser
|   |   +-- [slug].tsx                 <- Breed detail page
|   +-- tricks/
|   |   +-- index.tsx                  <- Trick library browser
|   |   +-- [slug].tsx                 <- Trick pack detail
|   |   +-- detail/[id].tsx            <- Individual trick detail
|   +-- health/                        <- Health sub-screens
|   |   +-- medications.tsx
|   |   +-- milestones.tsx
|   |   +-- notes.tsx
|   |   +-- vaccinations.tsx
|   |   +-- vet-visits.tsx
|   |   +-- weight.tsx                 <- Weight tracking + breed growth chart
|   +-- journal/
|   |   +-- index.tsx                  <- Growth journal timeline
|   |   +-- add.tsx                    <- Add journal entry (photo/note)
|   +-- community/index.tsx            <- Community feed (demo posts, compose gated)
|   +-- referral/index.tsx             <- Referral code + share
|   +-- settings/
|   |   +-- data-privacy.tsx           <- Data export + account deletion
|   |   +-- edit-profile.tsx
|   |   +-- notifications.tsx
|   |   +-- preferences.tsx            <- Units, reminders, tips
|   |   +-- subscription.tsx
|   +-- paywall.tsx                    <- In-app paywall (feature gates)
|   +-- _layout.tsx                    <- Root layout + ErrorBoundary
+-- src/
|   +-- components/
|   |   +-- ui/                        <- Design system (Button, Card, Typography, etc.)
|   |   |   +-- skeletons/             <- Skeleton loaders for all 5 tabs
|   |   +-- breed/                     <- Breed cards, grid, detail
|   |   +-- chat/                      <- Chat bubbles, input, typing indicator
|   |   +-- community/                 <- Post cards, feed
|   |   +-- dog/                       <- DogSwitcher (premium-gated)
|   |   +-- gamification/              <- XP, achievements, streaks, GBS gauge
|   |   +-- health/                    <- Health cards, charts
|   |   +-- journal/                   <- Journal entries, timeline
|   |   +-- notifications/             <- Notification cards
|   |   +-- onboarding/                <- Onboarding-specific components
|   |   +-- training/                  <- Exercise cards, plan view
|   +-- hooks/
|   |   +-- useAuth.ts                 <- Supabase auth listener + route protection
|   |   +-- useChat.ts
|   |   +-- useDog.ts
|   |   +-- useFeatureGate.ts          <- Premium gate with paywall triggers
|   |   +-- useGamification.ts
|   |   +-- useHydration.ts            <- Zustand hydration status for skeletons
|   |   +-- useSubscription.ts         <- THE way to check premium status
|   +-- stores/                        <- Zustand v5 with AsyncStorage persistence
|   |   +-- authStore.ts              <- NOT persisted (plain create())
|   |   +-- chatStore.ts              <- Persisted: puppal-chat
|   |   +-- dogStore.ts               <- Persisted: puppal-dogs (+ per-dog AsyncStorage)
|   |   +-- gamificationStore.ts      <- Persisted: puppal-gamification
|   |   +-- healthStore.ts            <- Persisted: puppal-health
|   |   +-- journalStore.ts           <- Persisted: puppal-journal
|   |   +-- onboardingStore.ts        <- Persisted: puppal-onboarding
|   |   +-- referralStore.ts          <- Persisted: puppal-referral
|   |   +-- settingsStore.ts          <- Persisted: puppal-settings
|   |   +-- trainingStore.ts          <- Persisted: puppal-training
|   |   +-- trickStore.ts             <- Persisted: puppal-tricks
|   |   +-- uiStore.ts
|   +-- services/
|   |   +-- analytics.ts              <- PostHog + Sentry wrappers
|   |   +-- notifications.ts          <- OneSignal + Expo push
|   |   +-- posthogService.ts         <- PostHog events/properties
|   |   +-- supabase.ts               <- Supabase client (AsyncStorage session)
|   +-- lib/
|   |   +-- achievementChecker.ts      <- Achievement trigger evaluation
|   |   +-- aiProvider.ts             <- Claude Sonnet 4.6 via buddy-chat Edge Function
|   |   +-- breedDetect.ts            <- Client-side breed detection service
|   |   +-- buddyPrompt.ts            <- Buddy system prompt builder
|   |   +-- gateThrottle.ts           <- Paywall frequency limiter
|   |   +-- gbsCalculator.ts          <- Good Boy Score (5 dimensions)
|   |   +-- planGenerator.ts          <- 12-week training plan generation
|   |   +-- resetStores.ts            <- Centralized store reset (sign-out/re-onboard)
|   |   +-- sharing.ts                <- Share card generation
|   +-- data/
|   |   +-- breeds.json               <- 51 breed profiles with growth curves
|   |   +-- breedData.ts              <- Breed lookup helpers
|   |   +-- exercises.json            <- 164 exercises across 12 categories
|   |   +-- exerciseData.ts           <- Exercise lookup + personalization
|   |   +-- tricks.json               <- 30 tricks across 6 packs
|   |   +-- achievements.json         <- 52 achievement definitions
|   +-- types/
|   |   +-- api.ts, breed.ts, chat.ts, community.ts, database.ts
|   |   +-- gamification.ts, health.ts, journal.ts, models.ts
|   |   +-- training.ts, tricks.ts
|   +-- constants/
|   |   +-- theme.ts                  <- Design tokens
+-- supabase/
|   +-- migrations/
|   |   +-- 001_users_and_dogs.sql
|   +-- functions/
|       +-- breed-detect/index.ts      <- Google Vision breed detection
+-- assets/                            <- buddy/, icons/, achievements/, splash/
```

---

## Content Inventory

| Content | Count | Source |
|---------|-------|--------|
| Breed profiles | 51 | `src/data/breeds.json` |
| Exercises | 164 | `src/data/exercises.json` (12 categories) |
| Tricks | 30 | `src/data/tricks.json` (6 packs x 5) |
| Achievements | 52 | `src/data/achievements.json` |
| Growth curves | 51 | Embedded in breed profiles |

### Trick Packs
1. `pack-starter` (5): Shake, High Five, Spin, Touch, Take a Bow
2. `pack-classic` (5): Sit Pretty, Wave, Army Crawl, Peekaboo, Kiss
3. `pack-impressive` (5): Weave, Jump, Balance, Ring Bell, Play Dead
4. `pack-useful` (5): Find It, Clean Up, Hold, Bring Leash, Open/Close Door
5. `pack-party` (5): Dance, Moonwalk, Sneeze, Speak, Whisper
6. `pack-advanced` (5): Backflip Prep, Skateboard, Shell Game, Basketball, Paint

---

## Coding Conventions

### TypeScript
- Strict mode, no `any` types
- `interface` for objects, `type` for unions/intersections
- Supabase types generated via `supabase gen types typescript`
- Zod schemas for all external input validation

### React Native / Expo
- Functional components only
- Expo Router for ALL navigation
- NativeWind for ALL styling
- Reanimated for all animations
- Custom hooks wrap all data fetching (TanStack Query)
- Zustand stores are thin --- logic in hooks and lib/

### Naming
- Files: `kebab-case.tsx` for routes, `PascalCase.tsx` for components
- Components: `PascalCase`
- Hooks: `useCamelCase`
- Stores: `camelCaseStore`
- Types: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Database: `snake_case` tables and columns

### Data Flow
```
UI Component -> Custom Hook -> TanStack Query / Zustand -> Supabase / Edge Function
```

### Performance Rules
- FlatList for ALL lists
- Expo Image for all images
- React.memo when profiler shows need
- Skeleton loaders for all async content
- Never empty white screens

---

## Critical Patterns & Gotchas

### 1. Zustand Selector Stability (RENDER LOOP RISK)

**The #1 source of crashes in PupPal.** Zustand selectors that return new references
on every call cause infinite re-renders when combined with `useSubscription()` and
`useRouter()`.

**BAD** (creates new reference every render):
```ts
// activeDog() calls dogs.find() -> new ref each time
const dog = useDogStore((s) => s.activeDog());

// Computed selectors with filter/sort/map -> new array each time
const weights = useHealthStore((s) => s.getWeightHistory(dogId));
const milestones = useHealthStore((s) => s.getMilestonesForDog(dogId));
const progress = useTrickStore((s) => s.getPackProgress(packId));
```

**GOOD** (stable primitives + useMemo):
```ts
const activeDogId = useDogStore((s) => s.activeDogId);
const dogs = useDogStore((s) => s.dogs);
const dog = useMemo(() => dogs.find((d) => d.id === activeDogId), [dogs, activeDogId]);

// For computed values, select the raw data and derive in useMemo
const allWeights = useHealthStore((s) => s.weightEntries);
const weights = useMemo(
  () => allWeights.filter((w) => w.dogId === dogId).sort(...),
  [allWeights, dogId]
);
```

This pattern has been applied to all 20+ screens that used `activeDog()`.
Health sub-screens still use computed selectors (getMilestonesForDog, etc.)
that create unstable arrays --- not crashing yet but causing unnecessary re-renders.

### 2. Store Reset on Sign-out / Re-onboard

All 10 persisted Zustand stores must be cleared together. Use `resetAllStores()`
from `src/lib/resetStores.ts`. It's already wired into:
- `authStore.signOut()`
- Onboarding welcome "Let's Go!" button
- Data privacy account deletion

### 3. Auth Store is NOT Persisted

`authStore` uses plain `create()` (no AsyncStorage). State may be unstable
during app mount. Don't rely on `useAuthStore` being populated before
`onAuthStateChange` fires.

### 4. AI Chat via Edge Function

Chat uses Claude Sonnet 4.6 via the `buddy-chat` Supabase Edge Function.
The client (`src/lib/aiProvider.ts`) calls the Edge Function — never Anthropic directly.
`ANTHROPIC_API_KEY` is a server-side secret only.

### 5. `trickStore.packProgress` is a Record, Not Array

```ts
// It's Record<string, PackProgress>, not PackProgress[]
const packProgress = useTrickStore((s) => s.packProgress);
const progress = useMemo(() => packProgress[packId], [packProgress, packId]);
```

### 6. Per-Dog AsyncStorage Data

`dogStore` saves per-dog data to separate AsyncStorage keys. When resetting,
`resetDogs()` cleans up these keys. When deleting a dog, `deletePerDogData()`
is called. See `dogStore.ts` helper functions.

### 7. Premium Gating

`useSubscription()` in `src/hooks/useSubscription.ts` is the ONLY way to check premium.
- Reads `useAuthStore((s) => s.user)`, derives `isPremium`/`isTrial`
- `isPremium = isActive || isTrial`
- DB column: `public.users.subscription_status` (enum: `free`, `trial`, `active`, `expired`, `cancelled`)
- To test premium locally: update `subscription_status` to `'active'` in Supabase Dashboard

### 8. Button.tsx Text Nodes

The Button component uses `array.join(' ')` for className assembly (not template literals).
Template literals leak whitespace as text nodes, causing "Text strings must be rendered
within a <Text> component" crashes. `leftIcon`/`rightIcon` props are guarded with `?? null`.

### 9. URL References

All URLs use `puppal.dog` (not `puppal.app`). Terms, privacy, support: `https://puppal.dog/{page}`.
Support email: `support@puppal.dog`.

---

## Design System Quick Reference

Full spec in `docs/DESIGN-SYSTEM.md`.

### Brand Colors
- Primary (Coral): `#FF6B5C` / Dark: `#E8554A` / Light: `#FFF0EE`
- Secondary (Deep Navy): `#1B2333`
- Accent (Warm Gold): `#FFB547`
- Success: `#5CB882`
- Warning: `#F5A623`
- Error: `#EF6461`
- Background: `#FFFAF7` (warm off-white)
- Surface: `#FFFFFF`
- Border: `#F0EBE6`

### Typography: Plus Jakarta Sans
Display: 36/ExtraBold, h1: 30/Bold, h2: 24/Bold, h3: 20/SemiBold, body: 16/Regular, sm: 14/Regular, caption: 12/Medium

### Spacing: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
### Radius: sm(8), md(12), lg(16), xl(24), full(9999)

---

## PRD Reference Guide

**Always read the relevant PRD before building a feature.**

### Core Experience (v1 Launch)
| # | Feature | PRD | Key Deliverables |
|---|---------|-----|-----------------|
| 01 | Onboarding | PRD-01 | 8 screens, breed detection, Apple Sign-In |
| 02 | AI Chat (Buddy) | PRD-02 | Streaming chat, context injection, memory, safety |
| 03 | Training Plan + Tricks | PRD-03 | Plan generation, 164 exercises, 6 trick packs, adaptation engine |
| 04 | Gamification | PRD-04 | XP, streaks, GBS, 52 achievements, 10 levels, challenges |
| 05 | Health Tracker | PRD-05 | Vaccinations, medications, weight/growth, vet visits, milestones |

### Monetization & Infrastructure (v1 Launch)
| # | Feature | PRD | Key Deliverables |
|---|---------|-----|-----------------|
| 06 | Paywall & Subscriptions | PRD-06 | RevenueCat + Superwall, 3 products, trial management, win-back |
| 07 | Free/Premium Gating | PRD-07 | PremiumGate component, per-feature matrix, Buddy upsells |
| 08 | Referral & Growth | PRD-08 | Referral codes, influencer attribution, share cards |
| 09 | Push Notifications | PRD-09 | 9 sequences, OneSignal, permission strategy, daily caps |
| 13 | Analytics | PRD-13 | PostHog events, 6 dashboards, feature flags, session replay |
| 14 | Settings | PRD-14 | Account, dogs, preferences, data export, deletion |

### Secondary Features (v1.1+)
| # | Feature | PRD | Key Deliverables |
|---|---------|-----|-----------------|
| 10 | Growth Journal | PRD-10 | Photo timeline, backdating, auto milestones, monthly recaps |
| 11 | Multi-Dog | PRD-11 | Dog switcher, mini-onboarding, per-dog isolation |
| 12 | Breed Encyclopedia | PRD-12 | 51 breed profiles, browser, content linking |
| 15 | Community | PRD-15 | Feed, posts, comments, moderation (post-launch) |

---

## Feature Status

### Built & Working (Free Tier)
- Onboarding flow (8 screens with breed detection via Google Vision)
- Home screen with today's training plan
- Exercise detail + completion with XP/animations
- Buddy AI Chat (Kimi K2.5 streaming, 3 msg/day free limit)
- Training Plan view (Week 1 free, Week 2-12 gated)
- Gamification (XP, streaks, levels, 52 achievements, GBS gauge)
- Health dashboard with 5 sub-screens (vaccinations, weight, medications, milestones, vet visits, notes)
- Breed Encyclopedia (51 breeds with growth curves)
- Growth Journal (timeline, photo/note entries, backdating)
- Community (read-only feed with demo posts)
- Profile + all settings screens
- Skeleton loaders on all 5 tabs
- ErrorBoundary at app root

### Built & Premium-Gated
- Full training (Weeks 2-12)
- Unlimited chat
- Full health features
- Full tricks library (6 packs, 30 tricks, 3-level progression)
- Multi-dog (DogSwitcher, add-dog, manage --- fully built)
- Full journal (photos, notes, backdating)
- Community posting (compose button gated)
- Full gamification (streak freezes, weekly challenges)
- Weight chart unlock
- Exercise detail access (beyond Week 1)

### Not Built Yet
- Language/i18n --- no i18n framework, English only
- Adaptive training engine --- plan is generated once, no adaptation logic
- Breed comparison (breed vs breed) --- no comparison UI
- Health PDF export --- no PDF generation
- Real-time community backend --- currently hardcoded demo posts
- Push notification delivery --- OneSignal not connected to actual delivery
- RevenueCat IAP --- subscription management is placeholder
- Deep linking / share cards --- sharing service exists but not wired
- Supabase backend integration --- most data is local-only via Zustand persistence.
  Supabase client exists but only auth + breed detection Edge Function are live.

---

## Free vs Premium Feature Matrix

```
FREE_FEATURES:
  onboarding, week1_training, basic_chat (3/day),
  basic_health, profile, basic_gamification,
  free_trick_shake, community_read, basic_journal

PREMIUM_FEATURES:
  full_training, unlimited_chat, full_health,
  full_tricks, multi_dog, full_journal,
  community_post, full_gamification,
  plan_adaptation, breed_comparison, health_pdf_export
```

---

## Build Order

### Phase 1-5: COMPLETE
Foundation, onboarding, training plan engine, AI chat, gamification,
health tracker, settings, premium gating, analytics stubs, notifications stubs.
All core UI and data stores built. See git history for details.

### Phase 6: In Progress (Post-Launch Features)
- [x] Growth Journal (PRD-10)
- [x] Trick Library (PRD-03 Section 6) --- 30 tricks, 6 packs
- [x] Multi-Dog (PRD-11) --- full UI, premium-gated
- [x] Breed Encyclopedia (PRD-12) --- 51 breeds with growth curves
- [x] Referral system (PRD-08) --- UI built, sharing service stub
- [x] Community feed (PRD-15) --- read-only with demo data
- [x] Breed detection (Edge Function + client service)
- [x] Store reset on sign-out/re-onboard

### Remaining Work (Pre-Launch)
- [ ] Connect RevenueCat for real IAP
- [ ] Connect OneSignal for real push delivery
- [ ] Wire remaining Supabase Edge Functions (chat proxy, plan generation, etc.)
- [ ] Connect community to Supabase Realtime
- [ ] Add plan adaptation engine
- [ ] Add health PDF export
- [ ] Add i18n framework
- [ ] Add breed comparison feature
- [ ] Full end-to-end testing on device
- [ ] EAS Build + TestFlight submission

---

## Current Sprint

> **Pre-TestFlight QA + Device Testing**

**Status**: QA audit complete, 4 PRs merged, breed detection + store reset built
**Active branch**: `fix/device-test-blockers` (PR #4 open)
**Next**: Commit breed detection + store reset + doc updates, then TestFlight

---

## Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # Edge Functions only
KIMI_API_KEY=                       # Edge Functions only (aiProvider.ts)
REVENUECAT_APPLE_API_KEY=
REVENUECAT_GOOGLE_API_KEY=
SUPERWALL_API_KEY=
ONESIGNAL_APP_ID=
EXPO_PUBLIC_POSTHOG_API_KEY=
EXPO_PUBLIC_POSTHOG_HOST=
GOOGLE_CLOUD_VISION_KEY=            # Edge Functions only (breed-detect)
SENTRY_DSN=
```

---

## Key Decisions Log

| Decision | Choice | Why |
|----------|--------|-----|
| Mobile framework | React Native + Expo | TS/React ecosystem, Expo SDK 54 mature |
| Backend | Supabase | Auth, DB, storage, edge functions, realtime on Day 1 |
| State | Zustand + TanStack Query | Client vs server state separation, offline persistence |
| Styling | NativeWind v4 | Tailwind for RN |
| AI chat | Vercel AI SDK + Kimi K2.5 | Provider-agnostic streaming, cost efficient |
| Analytics | PostHog | Feature flags built-in, session replay |
| Routing | Expo Router v6 | File-based, type-safe, deep links built-in |
| Push | OneSignal | Segmentation, automation, in-app messaging |
| Animations | Reanimated 4 | Native thread 60fps, declarative API |
| Payments | RevenueCat + Superwall | IAP abstraction + remote paywall A/B testing |
| Breed detection | Google Cloud Vision | LABEL_DETECTION + WEB_DETECTION, 3s timeout, silent fallback |

---

## Important Notes

1. **Always read the relevant PRD** before building a feature.
2. **Design system is in DESIGN-SYSTEM.md** --- follow it for all UI.
3. **Supabase types are generated** --- run `supabase gen types typescript` after migrations.
4. **Never hardcode strings** --- all user-facing text in constants.
5. **Buddy's personality** defined in PRD-02. System prompt template in PRD-02 Section 4.
6. **Free vs Premium gating** defined per-feature in PRD-07. `useSubscription()` is the ONLY way to check.
7. **All data is per-dog** --- every query filters by `dog_id`.
8. **Offline first** --- TanStack Query persistence. Queue mutations offline.
9. **Animations matter** --- specified in PRDs and DESIGN-SYSTEM.md. Don't skip them.
10. **Every XP-earning action** goes through gamification service for achievement checks.
11. **Analytics events** defined in PRD-13. Instrument as you build each feature.
12. **Push notifications** --- permission asked after first exercise, not on launch (PRD-09).
13. **Paywall triggers** --- 9 trigger events defined in PRD-06. Wire Superwall at each gate point.
14. **Share cards** include referral link (PRD-08). Every shareable moment is marketing.
15. **Community (PRD-15) is post-launch** --- do not build until user base supports it. Feature-flagged.
16. **Zustand selectors must return stable references** --- see Critical Patterns #1 above.
17. **Kimi K2.5 temperature must be 1** --- see Critical Patterns #4 above.
18. **Use resetAllStores() for any sign-out or fresh start** --- never reset stores individually.
19. **URLs are puppal.dog** --- not puppal.app. Support: support@puppal.dog.
