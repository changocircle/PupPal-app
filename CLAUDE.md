# PupPal — AI Puppy Training App

> "Like having a dog trainer on call 24/7"

PupPal is an AI-powered puppy training app that solves new puppy parent anxiety. Not a content library — a personalized mentor that knows your dog's breed, age, temperament, and training history. Available 24/7, costs less per year than a single training session.

## Target User

"Anxious First-Time Puppy Mom" — Female, 25-38, millennial/older Gen Z, city/suburbs, just got or planning to get a puppy. Treats dog as family. Researches everything. Currently Googling at 2am, watching conflicting YouTube videos, feeling overwhelmed and guilty. Wants to feel confident, in control, like a good dog parent.

## Business Model

Freemium subscription via App Store/Google Play. 3-day free trial → $39.99/year (primary) or $9.99/month. Free tier: Week 1 training, 3 Buddy messages/day, limited health tracking. Revenue target: $100K MRR by month 6.

---

## Tech Stack

### Mobile App
- **Framework**: React Native + Expo SDK 52+ (managed workflow)
- **Routing**: Expo Router v4 (file-based routing)
- **Language**: TypeScript (strict mode)
- **Styling**: NativeWind v4 (Tailwind CSS for React Native)
- **State**: Zustand (client state) + TanStack Query v5 (server state/caching)
- **Forms**: React Hook Form + Zod validation
- **Animations**: React Native Reanimated 3 + Moti

### Backend
- **Platform**: Supabase (hosted Postgres + Auth + Storage + Edge Functions + Realtime)
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth (Apple Sign-In, Google Sign-In)
- **Storage**: Supabase Storage (dog photos, vet records, journal photos)
- **Edge Functions**: Deno/TypeScript (AI proxy, plan generation, scheduled jobs, share card generation)

### AI
- **Chat Provider**: Kimi K2.5 (primary — cost efficiency)
- **Streaming**: Vercel AI SDK (provider-agnostic, swap with config change)
- **Breed Detection**: Google Cloud Vision API (fallback: manual breed selector)

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

## Project Structure

```
puppal/
├── CLAUDE.md                          ← You are here
├── docs/
│   ├── PRD-01-Onboarding.md          ← Onboarding flow (8 screens)
│   ├── PRD-02-AI-Chat.md             ← Buddy AI mentor chat
│   ├── PRD-03-Training-Plan.md       ← Training plan + Trick Library
│   ├── PRD-04-Gamification.md        ← XP, streaks, GBS, achievements
│   ├── PRD-05-Health-Tracker.md      ← Health & vaccination tracker
│   ├── PRD-06-Paywall.md             ← Paywall & subscription system
│   ├── PRD-07-Gating.md              ← Free vs premium gating logic
│   ├── PRD-08-Referral.md            ← Referral & viral growth
│   ├── PRD-09-Notifications.md       ← Push notification sequences
│   ├── PRD-10-Growth-Journal.md      ← Growth journal & timeline
│   ├── PRD-11-Multi-Dog.md           ← Multi-dog management
│   ├── PRD-12-Breed-Encyclopedia.md  ← Breed content library
│   ├── PRD-13-Analytics.md           ← Analytics & A/B testing
│   ├── PRD-14-Settings.md            ← Settings & preferences
│   ├── PRD-15-Community.md           ← Community feed (post-launch)
│   ├── TECH-STACK.md                 ← Detailed tech decisions
│   └── DESIGN-SYSTEM.md             ← Visual design, components, wireframes
├── app/                               ← Expo Router file-based routes
│   ├── (onboarding)/                  ← Onboarding flow screens
│   │   ├── index.tsx                  ← Screen 1: Meet Buddy
│   │   ├── name.tsx                   ← Screen 2: Dog name
│   │   ├── photo.tsx                  ← Screen 3: Photo + breed detection
│   │   ├── age.tsx                    ← Screen 4: Dog age
│   │   ├── challenges.tsx             ← Screen 5: Challenge selection
│   │   ├── experience.tsx             ← Screen 6: Owner experience
│   │   ├── plan-preview.tsx           ← Screen 7: Personalized plan
│   │   └── paywall.tsx                ← Screen 8: Paywall
│   ├── (tabs)/                        ← Main app tab navigation
│   │   ├── index.tsx                  ← Home / Today's Training
│   │   ├── chat.tsx                   ← Buddy AI Chat
│   │   ├── plan.tsx                   ← Training Plan + Tricks
│   │   ├── health.tsx                 ← Health dashboard
│   │   └── profile.tsx                ← Profile, settings, achievements
│   ├── exercise/[id].tsx              ← Exercise / trick detail
│   ├── achievement/[id].tsx           ← Achievement detail
│   ├── journal/                       ← Growth journal screens
│   ├── breed/[slug].tsx               ← Breed encyclopedia detail
│   ├── community/                     ← Community feed (post-launch)
│   └── _layout.tsx                    ← Root layout
├── src/
│   ├── components/
│   │   ├── ui/                        ← Design system primitives
│   │   ├── onboarding/                ← Onboarding components
│   │   ├── chat/                      ← Chat UI components
│   │   ├── training/                  ← Training plan components
│   │   ├── health/                    ← Health tracker components
│   │   ├── gamification/              ← XP, achievements, streaks
│   │   ├── journal/                   ← Growth journal components
│   │   └── community/                 ← Community feed components
│   ├── hooks/                         ← Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useDog.ts
│   │   ├── useSubscription.ts
│   │   ├── usePlan.ts
│   │   ├── useChat.ts
│   │   ├── useGamification.ts
│   │   ├── useHealth.ts
│   │   ├── useJournal.ts
│   │   └── useFeatureGate.ts
│   ├── stores/                        ← Zustand stores
│   │   ├── authStore.ts
│   │   ├── dogStore.ts
│   │   ├── onboardingStore.ts
│   │   ├── chatStore.ts
│   │   └── uiStore.ts
│   ├── services/                      ← API clients & external services
│   │   ├── supabase.ts
│   │   ├── ai.ts
│   │   ├── revenueCat.ts
│   │   ├── superwall.ts
│   │   ├── oneSignal.ts
│   │   ├── posthog.ts
│   │   └── breedDetection.ts
│   ├── lib/                           ← Utility functions
│   │   ├── planGenerator.ts
│   │   ├── scoreCalculator.ts
│   │   ├── streakManager.ts
│   │   ├── achievementChecker.ts
│   │   ├── breedProfiles.ts
│   │   ├── exerciseLibrary.ts
│   │   ├── vaccinationSchedule.ts
│   │   └── gateThrottle.ts
│   ├── types/
│   │   ├── database.ts               ← Supabase generated types
│   │   ├── models.ts
│   │   └── api.ts
│   └── constants/
│       ├── theme.ts                   ← Design tokens
│       ├── achievements.ts
│       ├── exercises.ts
│       └── breeds.ts
├── supabase/
│   ├── migrations/                    ← Database migrations (sequential)
│   ├── functions/                     ← Edge Functions
│   │   ├── chat/
│   │   ├── generate-plan/
│   │   ├── calculate-score/
│   │   ├── check-achievements/
│   │   ├── breed-detect/
│   │   ├── generate-summary/
│   │   ├── streak-cron/
│   │   ├── export-health/
│   │   ├── generate-recap/
│   │   ├── generate-share-card/
│   │   ├── revenuecat-webhook/
│   │   ├── send-notification/
│   │   └── moderate-content/
│   └── seed/
│       ├── breeds.sql
│       ├── exercises.sql
│       ├── achievements.sql
│       ├── milestones.sql
│       ├── vaccinations.sql
│       └── trick-packs.sql
└── assets/
    ├── buddy/
    ├── icons/
    ├── achievements/
    ├── onboarding/
    └── splash/
```

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
- Zustand stores are thin — logic in hooks and lib/

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
UI Component → Custom Hook → TanStack Query / Zustand → Supabase / Edge Function
```

### Performance Rules
- FlatList for ALL lists
- Expo Image for all images
- React.memo when profiler shows need
- Skeleton loaders for all async content
- Never empty white screens

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
| 03 | Training Plan + Tricks | PRD-03 | Plan generation, 160+ exercises, 6 trick packs, adaptation engine |
| 04 | Gamification | PRD-04 | XP, streaks, GBS, ~45 achievements, 10 levels, challenges |
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
| 12 | Breed Encyclopedia | PRD-12 | 50 breed profiles, browser, content linking |
| 15 | Community | PRD-15 | Feed, posts, comments, moderation (post-launch) |

---

## Build Order

### Phase 1: Foundation (Week 1-2)
1. Expo project scaffold with all dependencies
2. Supabase project + initial migrations (users, dogs)
3. Design system primitives (Button, Card, Typography, theme)
4. Onboarding flow (PRD-01)
5. Apple Sign-In via Supabase Auth
6. RevenueCat + Superwall integration (PRD-06)
7. Basic home screen shell

### Phase 2: Training Core (Week 3-4)
1. Database: exercises, plans, breed profiles + seed data
2. Plan generation algorithm (PRD-03)
3. Today's Training home screen
4. Exercise detail + completion flow
5. Free/premium gating foundation (PRD-07)
6. Seed 60-80 core exercises

### Phase 3: AI Chat (Week 5-6)
1. Chat UI with streaming (PRD-02)
2. Edge Function: AI proxy + context injection
3. Conversation memory
4. Free/premium message gating
5. Safety escalation

### Phase 4: Gamification (Week 7-8)
1. XP system wired to completions (PRD-04)
2. Streak tracking with midnight cron
3. Good Boy Score calculation
4. Achievement system (20-25 initial)
5. Home screen integration

### Phase 5: Health + Polish (Week 9-10)
1. Vaccination schedule + timeline (PRD-05)
2. Weight tracking + breed growth chart
3. Medication tracking with reminders
4. Push notifications (PRD-09) + OneSignal
5. PostHog analytics instrumentation (PRD-13)
6. Settings screen (PRD-14)
7. Performance + bug fixes
8. TestFlight submission

### Phase 6: Post-Launch (Week 11+)
1. Growth Journal (PRD-10)
2. Trick Library full build (PRD-03 Section 6)
3. Multi-Dog (PRD-11)
4. Breed Encyclopedia (PRD-12)
5. Referral system (PRD-08)
6. Community feed (PRD-15) — when user base supports it

---

## Current Sprint

> **Update this section as you progress.**

**Building**: Project Scaffold + Design System
**PRD Reference**: DESIGN-SYSTEM.md, PRD-01
**Status**: Not started
**Next**: Expo init, Supabase setup, design tokens, first onboarding screen

---

## Key Decisions Log

| Decision | Choice | Why |
|----------|--------|-----|
| Mobile framework | React Native + Expo | Claude Code best at TS/React, Expo SDK 52 mature, all SDKs supported |
| Backend | Supabase | Auth, DB, storage, edge functions, realtime on Day 1 |
| State | Zustand + TanStack Query | Client vs server state separation, offline persistence |
| Styling | NativeWind v4 | Tailwind for RN, Claude Code knows it deeply |
| AI chat | Vercel AI SDK + Kimi K2.5 | Provider-agnostic streaming, cost efficient |
| Analytics | PostHog | Feature flags built-in, session replay, modern |
| Routing | Expo Router v4 | File-based, type-safe, deep links built-in |
| Push | OneSignal | Segmentation, automation, in-app messaging |
| Animations | Reanimated 3 + Moti | Native thread 60fps, declarative API |
| Payments | RevenueCat + Superwall | IAP abstraction + remote paywall A/B testing |

---

## Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # Edge Functions only
KIMI_API_KEY=                       # Edge Functions only
REVENUECAT_APPLE_API_KEY=
REVENUECAT_GOOGLE_API_KEY=
SUPERWALL_API_KEY=
ONESIGNAL_APP_ID=
EXPO_PUBLIC_POSTHOG_API_KEY=
EXPO_PUBLIC_POSTHOG_HOST=
GOOGLE_CLOUD_VISION_KEY=            # Edge Functions only
SENTRY_DSN=
```

---

## Important Notes for Claude Code

1. **Always read the relevant PRD** before building a feature.
2. **Design system is in DESIGN-SYSTEM.md** — follow it for all UI.
3. **Supabase types are generated** — run `supabase gen types typescript` after migrations.
4. **Never hardcode strings** — all user-facing text in constants.
5. **Buddy's personality** defined in PRD-02. System prompt template in PRD-02 Section 4.
6. **Free vs Premium gating** defined per-feature in PRD-07. `useSubscription()` is the ONLY way to check.
7. **All data is per-dog** — every query filters by `dog_id`.
8. **Offline first** — TanStack Query persistence. Queue mutations offline.
9. **Animations matter** — specified in PRDs and DESIGN-SYSTEM.md. Don't skip them.
10. **Every XP-earning action** goes through gamification service for achievement checks.
11. **Analytics events** defined in PRD-13. Instrument as you build each feature.
12. **Push notifications** — permission asked after first exercise, not on launch (PRD-09).
13. **Paywall triggers** — 9 trigger events defined in PRD-06. Wire Superwall at each gate point.
14. **Share cards** include referral link (PRD-08). Every shareable moment is marketing.
15. **Community (PRD-15) is post-launch** — do not build until user base supports it. Feature-flagged.
