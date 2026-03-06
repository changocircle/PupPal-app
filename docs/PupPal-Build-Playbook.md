# PupPal --- Build Playbook

## Step-by-Step Development Guide

**This document tells you exactly what to build, in what order, and what to say to Claude Code at each step.** Follow it sequentially. Each step builds on the last.

> **Status**: Phases 1-5 complete. Phase 6 mostly done. Pre-TestFlight QA in progress.

---

## Before You Start (Week 0 Checklist)

### Accounts to Create
- [x] **Apple Developer Account** ($99/year)
- [x] **Supabase** --- project created (free tier)
- [x] **RevenueCat** --- account created (not fully wired)
- [ ] **Superwall** --- account needed for paywall A/B testing
- [x] **PostHog** --- analytics instrumented
- [x] **OneSignal** --- SDK integrated (delivery not connected)
- [x] **Kimi/Moonshot** --- API key for AI chat (**temperature must be 1**)
- [x] **Google Cloud** --- Vision API for breed detection
- [x] **Expo** --- EAS account for builds
- [x] **Sentry** --- error tracking set up

### Content Status
- [x] 164 exercises written across 12 categories (`src/data/exercises.json`)
- [x] 30 tricks across 6 packs (`src/data/tricks.json`)
- [x] 51 breed profiles with growth curves (`src/data/breeds.json`)
- [x] 52 achievement definitions (`src/data/achievements.json`)
- [x] Buddy system prompt (`src/lib/buddyPrompt.ts`)

---

## Phase 1: Foundation + Onboarding (COMPLETE)

### What Was Built
- Expo SDK 54 project with TypeScript, Expo Router v6, NativeWind v4
- Design system primitives: Button, Card, Typography, Badge, ProgressBar, Input, Skeleton, ErrorBoundary, PremiumGate
- Supabase client with AsyncStorage session persistence
- Auth via Supabase `onAuthStateChange` + route protection
- 8-screen onboarding flow with animated transitions
- Plan preview showing 12-week personalized plan
- Paywall screen with RevenueCat integration
- Onboarding data persisted in Zustand store

### Key Files
- `src/components/ui/` --- all design system components
- `src/services/supabase.ts` --- Supabase client
- `src/hooks/useAuth.ts` --- auth state + route guard
- `app/(onboarding)/` --- all 8 screens
- `src/stores/onboardingStore.ts` --- onboarding state

---

## Phase 2: Training Plan Engine (COMPLETE)

### What Was Built
- 164 exercises across 12 categories (JSON data, not Supabase)
- Plan generation algorithm in `src/lib/planGenerator.ts`
- Home screen with today's training, gamification row, exercise list
- Exercise detail + completion flow with XP and animations
- PremiumGate on Week 2+ content
- Gate frequency throttling (1 paywall/session, 4-hour cooldown)

### Key Files
- `src/data/exercises.json` --- exercise content
- `src/data/exerciseData.ts` --- lookup helpers + personalization
- `src/lib/planGenerator.ts` --- 12-week plan algorithm
- `app/(tabs)/index.tsx` --- home screen
- `app/exercise/[id].tsx` --- exercise detail
- `src/hooks/useFeatureGate.ts` --- premium gate hook
- `src/lib/gateThrottle.ts` --- paywall frequency limiter

---

## Phase 3: AI Mentor Chat (COMPLETE)

### What Was Built
- Chat UI with streaming, Buddy avatars, typing indicator
- Kimi K2.5 integration via Vercel AI SDK
- Context injection (dog profile, plan, completions)
- 3 messages/day free limit with counter
- Buddy personality system prompt

### Key Files
- `app/(tabs)/chat.tsx` --- chat screen
- `src/lib/aiProvider.ts` --- Kimi K2.5 client (**temperature: 1 only**)
- `src/lib/buddyPrompt.ts` --- system prompt builder
- `src/stores/chatStore.ts` --- conversation state
- `src/hooks/useChat.ts` --- chat hook

### Gotcha
Kimi K2.5 only accepts `temperature: 1`. Any other value returns HTTP 400.
This is set in `aiProvider.ts:47`.

---

## Phase 4: Gamification (COMPLETE)

### What Was Built
- XP system wired to exercise completions
- Streak tracking with flame component
- Good Boy Score (5-dimension composite 0-100)
- 52 achievements with trigger conditions
- Achievement unlock overlay with confetti
- Achievements grid screen (unlocked/locked)
- Home screen integration with live data

### Key Files
- `src/stores/gamificationStore.ts` --- XP, streaks, achievements
- `src/lib/gbsCalculator.ts` --- Good Boy Score algorithm
- `src/lib/achievementChecker.ts` --- achievement trigger evaluation
- `src/data/achievements.json` --- 52 achievement definitions
- `src/components/gamification/` --- XP bar, streak flame, GBS gauge
- `app/achievements/index.tsx` --- full achievements screen

---

## Phase 5: Health + Polish (COMPLETE)

### What Was Built
- Health dashboard with 5 sub-tabs (vaccinations, weight, medications, milestones, vet visits + notes)
- Weight tracking with breed growth curves (51 breeds)
- Vaccination timeline with completed/upcoming/overdue
- Medication tracking with reminders
- Push notification SDK integration (OneSignal + Expo)
- PostHog analytics instrumentation
- Settings screens (edit profile, preferences, subscription, notifications, data privacy)
- Skeleton loaders on all 5 tabs via `useHydration()` hook
- ErrorBoundary at app root
- Account deletion with full store reset

### Key Files
- `app/(tabs)/health.tsx` --- health dashboard
- `app/health/` --- 6 sub-screens
- `src/stores/healthStore.ts` --- health data + reset method
- `src/hooks/useHydration.ts` --- skeleton/hydration hook
- `src/components/ui/skeletons/` --- per-tab skeleton components
- `src/components/ui/ErrorBoundary.tsx` --- crash protection
- `app/settings/` --- 5 settings screens

---

## Phase 6: Post-Launch Features (MOSTLY COMPLETE)

### What Was Built

#### Growth Journal (PRD-10)
- Timeline screen with chronological entries
- Photo + note entry creation with backdating
- Filter tabs
- `app/journal/index.tsx`, `app/journal/add.tsx`
- `src/stores/journalStore.ts`

#### Trick Library (PRD-03 Section 6)
- 30 tricks across 6 packs (5 each)
- Pack browser, pack detail, individual trick detail
- 3-level progression (Learning/Fluent/Mastered)
- `app/tricks/index.tsx`, `app/tricks/[slug].tsx`, `app/tricks/detail/[id].tsx`
- `src/stores/trickStore.ts` (`packProgress` is `Record<string, PackProgress>`, not array)

#### Multi-Dog (PRD-11)
- Dog switcher bottom sheet (premium-gated via `feature_gate_multi_dog`)
- Add-dog mini-onboarding (629 lines)
- Dog manage/edit screen (485 lines)
- Per-dog data isolation (all queries filter by dog_id)
- `app/add-dog/index.tsx`, `app/dog/[id]/manage.tsx`
- `src/components/dog/DogSwitcher.tsx`

#### Breed Encyclopedia (PRD-12)
- 51 breed profiles with growth curves, care tips, training notes
- Breed browser with search
- Breed detail pages
- `app/breeds/index.tsx`, `app/breeds/[slug].tsx`
- `src/data/breeds.json`, `src/data/breedData.ts`

#### Referral System (PRD-08)
- Referral code generation + display
- Share link + stats UI
- `app/referral/index.tsx`
- `src/stores/referralStore.ts`

#### Community (PRD-15)
- Read-only feed with demo posts
- Compose button (premium-gated, not yet functional)
- Post cards with engagement UI
- `app/community/index.tsx`
- Needs: Supabase Realtime backend, moderation Edge Function

#### Breed Detection
- Google Cloud Vision Edge Function (`supabase/functions/breed-detect/index.ts`)
- Client service with 3s timeout, silent fallback (`src/lib/breedDetect.ts`)
- Wired into `app/(onboarding)/photo.tsx`
- PRD-01 confidence logic: >70% auto-fill, 40-70% suggest, <40% options, fail -> manual

#### Store Reset
- Centralized `resetAllStores()` in `src/lib/resetStores.ts`
- Missing reset methods added to dogStore, healthStore, referralStore, settingsStore
- Wired into: signOut, onboarding start, account deletion

---

## Phase 7: Backend Wiring (NOT STARTED)

These features have UI built but need real backend connections:

### Step 7.1: Supabase Schema + Migrations

**Tell Claude Code:**
> "Read CLAUDE.md and all PRD data models. We have migration 001_users_and_dogs.sql.
> Create migrations for: exercises, training_plans, plan_days, exercise_completions,
> chat_sessions, chat_messages, user_gamification, user_streaks, xp_events,
> user_achievements, scheduled_vaccinations, weight_entries, medications,
> vet_visits, journal_entries, referral_codes, community_posts.
> Add RLS policies. Generate types."

### Step 7.2: Edge Functions

**Tell Claude Code:**
> "Build remaining Edge Functions in supabase/functions/:
> - chat/ --- AI proxy with context injection (currently direct from client)
> - generate-plan/ --- server-side plan generation
> - streak-cron/ --- daily streak evaluation via pg_cron
> - calculate-score/ --- GBS calculation
> - check-achievements/ --- achievement trigger evaluation
> - export-health/ --- PDF generation for health records
> - revenuecat-webhook/ --- subscription lifecycle events
> - send-notification/ --- OneSignal delivery with templates"

### Step 7.3: RevenueCat IAP

**Tell Claude Code:**
> "Wire RevenueCat for real in-app purchases. Configure products in
> App Store Connect (annual $39.99, monthly $9.99). Set up offerings
> in RevenueCat dashboard. Wire purchase flow to update
> users.subscription_status in Supabase. Build revenuecat-webhook
> Edge Function for server-side subscription events."

### Step 7.4: OneSignal Push Delivery

**Tell Claude Code:**
> "Connect OneSignal for real push notification delivery.
> Set up segments (active_free, active_premium, churned, etc).
> Wire training morning reminder, streak risk alerts, health reminders.
> Build send-notification Edge Function with template resolution
> and daily cap enforcement per PRD-09."

### Step 7.5: Data Sync (Local -> Supabase)

**Tell Claude Code:**
> "Currently all data is local via Zustand AsyncStorage persistence.
> Add Supabase sync for critical data: dogs, exercise completions,
> health records, gamification state, journal entries.
> Keep offline-first pattern --- queue mutations when offline,
> sync when connected. TanStack Query handles server state caching."

---

## Phase 8: Pre-Launch Polish (IN PROGRESS)

### Step 8.1: QA Audit (DONE --- 4 PRs Merged)

**PR #1** (`fix/all-7-bugs`): nanoid crypto, PostHog init, community routes, profile render loop, achievement tabs, Phase 6 placeholders, plan preview 8->12 weeks

**PR #2** (`feat/growth-curves-skeletons`): 51 breed growth curves, skeleton loaders for all 5 tabs, useHydration() hook, ErrorBoundary wrapping

**PR #3** (`fix/qa-audit-round2`): onboarding persistence, duplicate exercise guard, puppal.app->puppal.dog URLs, sign-in coming soon, exercise_access gate, age screen restore, chat limit banner, dev-guard console.error, empty dir cleanup

**PR #4** (`fix/device-test-blockers`): Kimi temperature=1, weight screen render loop, trick pack render loop, Button.tsx text node fix, activeDog() sweep across 20 screens

### Step 8.2: Device Testing Checklist

- [ ] Complete onboarding flow (all 8 screens) on physical device
- [ ] Breed detection from photo works (or falls back gracefully)
- [ ] Plan generates correctly for 3+ different breed/age/challenge combos
- [ ] Today's Training shows and exercises complete with XP/animations
- [ ] Buddy chat works with streaming responses
- [ ] Free user hits gates at all correct points
- [ ] Premium user sees no gates (toggle via Supabase: `subscription_status = 'active'`)
- [ ] Streak tracks correctly across days
- [ ] Achievements unlock at correct triggers
- [ ] Health dashboard shows upcoming events
- [ ] Weight screen loads without render loop
- [ ] Trick pack detail loads without render loop
- [ ] All 5 tabs show skeleton -> content (no white screens)
- [ ] Sign out clears all data (re-onboard shows clean state)
- [ ] Re-onboarding doesn't show previous dog's data
- [ ] No crashes on rapid navigation
- [ ] Animations smooth at 60fps
- [ ] `mailto:support@puppal.dog` works in production build

### Step 8.3: EAS Build + TestFlight

**Tell Claude Code:**
> "Configure EAS Build for iOS. Create/update app.json with correct
> bundle identifier, version, and all required Expo config plugins
> (RevenueCat, OneSignal, Sentry). Run eas build --platform ios.
> Once built, run eas submit --platform ios to upload to TestFlight."

---

## Known Technical Debt

### High Priority (Fix Before Launch)
1. **Health computed selectors** --- `getMilestonesForDog()`, `getVaccinationsForDog()`, etc. create unstable arrays in Zustand selectors. Not crashing yet but causing unnecessary re-renders. Apply same `useMemo` pattern as `activeDog()` fix.
2. **Community is hardcoded** --- demo posts only, no backend. Needs Supabase Realtime or can be feature-flagged off for v1.
3. **No real IAP** --- RevenueCat SDK is integrated but not connected to App Store products.
4. **No real push delivery** --- OneSignal SDK integrated but notifications don't actually send.

### Medium Priority (Fix Post-Launch)
5. **Auth store not persisted** --- Using plain `create()`, may cause flash on app mount.
6. **No conversation memory** --- Chat doesn't summarize or persist cross-session context.
7. **No plan adaptation** --- Plan is generated once at onboarding, never adjusts.
8. **No deep linking** --- Share cards and referral links don't resolve to app screens.

### Low Priority (v1.1+)
9. **No i18n** --- English only, no translation framework.
10. **No health PDF export** --- Listed as premium feature but not built.
11. **No breed comparison** --- Listed as premium feature but not built.

---

## Content Production (Remaining)

All core content is written. Remaining for post-launch:
- Community guidelines and moderation rules
- Additional exercise variations (currently 164, goal 200+)
- Trick pack 7+ content (currently 6 packs)
- Monthly recap email templates
- Notification copy for all 9 sequences (PRD-09)

---

## Testing Premium Features

To test premium features without real IAP:

1. Open **Supabase Dashboard** -> Table Editor -> `users` table
2. Find your user row (match by email or auth ID)
3. Change `subscription_status` from `free` to `active`
4. The app reads this via `useAuthStore` -> `useSubscription()` -> `isPremium`
5. All premium gates should unlock immediately

The `useSubscription()` hook derives:
```
isPremium = subscription_status === 'active' || subscription_status === 'trial'
```

---

## Key Reminders

1. **One feature at a time.** Sequential steps, test after each.
2. **Test after each step.** Run in Expo Go after every change. Fix before moving on.
3. **Update CLAUDE.md Current Sprint.** Keep context focused.
4. **Point to specific PRDs.** "Read docs/PRD-03 and build X." Don't dump all PRDs.
5. **Commit after each working feature.** Descriptive messages. You can always roll back.
6. **Zustand selectors MUST return stable references.** See CLAUDE.md Critical Patterns #1.
7. **Kimi K2.5 temperature MUST be 1.** See CLAUDE.md Critical Patterns #4.
8. **Use resetAllStores() for any sign-out.** Never reset stores individually.
9. **URLs are puppal.dog.** Not puppal.app.
10. **Animations are not optional.** They make PupPal feel premium.
11. **Free user experience must be great.** Week 1 should be genuinely valuable.
12. **Buddy is the product.** The AI chat is what makes PupPal different. Invest in prompt quality.
13. **Ship imperfect, iterate fast.** Core features + gating + analytics = launchable. Everything else is v1.1+.
