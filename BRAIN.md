# PupPal Brain Dump v10
**Date:** March 9, 2026 (after overnight session) | **For:** Ashley Kemp | **By:** Viktor

> Upload this document to a new Viktor or Claude Code instance to restore full project context.
> Also upload the companion tar.gz which contains all PRDs, design system docs, and all reference files.

---

## 1. About Ashley

- **Name:** Ashley Kemp
- **Email:** hello@ashkemp.com (primary), mrashleykemp@gmail.com (Slack)
- **Role:** Solo founder and developer
- **Age:** 32 (born 24 June 1993)
- **Gender:** Male
- **Location:** Bangkok, Thailand (UTC+7). Uses Dallas, Texas as public business location.
- **GitHub org:** changocircle (display name: whitestoneglobal on Vercel)
- **Dad** helps with marketing execution

### Communication Preferences
- Direct, casual tone. No corporate language.
- **No em dashes ever.** Use commas, periods, or "and" instead.
- Wants updates as work progresses, not big walls of text.
- Prefers step-by-step guidance with terminal commands he can copy-paste.
- When he says "world class" he means it. Quality bar is very high.
- Likes downloadable checklists and PDFs.
- Prefers Opus for conversations (complex planning/debugging), Sonnet for build tasks.
- If he says "use Sonnet for this", use Sonnet. He decides model per task.

### Technical Level
Ashley is a developer who works with React Native, Expo, Supabase, Vercel, and GitHub. He is comfortable running terminal commands, deploying edge functions, and debugging code. He has deployed Supabase Edge Functions directly, fixed production issues independently.

### Sensitive About
**CRITICAL:** Ashley was upset when Viktor miscounted PRDs (said "only 7 of 21 built" when 17 were actually done). Always re-read full history before making status claims. Never guess build status. Verify everything.

### Working Style
- Works in intense bursts, 6+ hour sessions with rapid test/feedback/fix cycles
- Active during Bangkok daytime (roughly 3am-12pm UTC)
- Saturday and Sunday are working days
- Goes offline at night and expects Viktor to keep building overnight
- Uploads screenshots and terminal output to Slack when debugging
- Expects immediate acknowledgment when he asks if you're working on something
- Speed matters. Give realistic time estimates, don't say "few more minutes" repeatedly.

---

## 2. PupPal: The Product

**"Like having a dog trainer on call 24/7."**

AI-powered puppy training mobile app for first-time puppy parents. Combines personalized 12-week training plans, AI chat mentor (Buddy), health and vaccination tracking, gamification, growth journal, breed encyclopedia, and community features.

### Target Audience
- **Primary:** First-time puppy parents, female, age 25-38, millennial and Gen Z
- **Pain point:** Overwhelmed by conflicting advice online. New puppy chaos.
- **Emotional hook:** "Your puppy just chewed through your favorite shoes. Again."

### Business Model
- **Freemium** with subscription unlock
- **Annual:** $39.99/year ($3.33/month) with 3-day free trial
- **Monthly:** $9.99/month
- Annual plan is default and emphasized everywhere
- Free tier: Week 1 training, 3 AI chat messages/day, limited health (2 events), limited tricks (Shake only), community read-only, basic journal (view-only)
- Premium: All 12 weeks, unlimited chat, full health suite, all tricks, community posting, multi-dog, full journal, streak freeze, weekly challenges, breed comparison, health PDF export

### Pricing Context
41% below market average ($68/year). Competitors: Dogo $60-80/yr, Puppr $99.99/yr, Woofz ~$60/yr, Zigzag $49.99/yr, GoodPup $34/week, Pupford $9.99/month.

---

## 3. Brand and Design System

### Colors
| Name | Hex | Usage |
|------|-----|-------|
| Navy (Primary) | #1B2333 | Sidebar, headings, trust |
| Coral (Accent) | #FF6B5C | CTAs, accents, energy |
| Warm Cream (Bg) | #FFFAF7 | App backgrounds |
| Sage (Success) | #7BAE7F | Success states, health |

### Typography
- **Font:** Plus Jakarta Sans (weights 400-800)
- **Monospace:** JetBrains Mono (code, data fields)

### Mascot
**Buddy** is the AI mentor. Golden retriever, friendly, supportive. Positive reinforcement only. Powered by Claude Sonnet 4.6 via buddy-chat Supabase Edge Function. 8 expression variants: main, waving, thinking, empathetic, celebrating, proud, sleeping, teaching.

**Two-tier Buddy asset system (as of PR #50):**
- `BuddyIcon` (SVG component, `src/components/chat/BuddyIcon.tsx`) for small sizes (32-48px) in chat bubbles, typing indicators, banners
- `BuddyAvatar` (PNG images, `src/components/chat/BuddyAvatar.tsx`) for large sizes (80px+) in hero positions
- PNG files in `assets/buddy/`: buddy-main.png, buddy-waving.png, buddy-thinking.png, buddy-empathetic.png, buddy-celebrating.png, buddy-proud.png, buddy-sleeping.png, buddy-teaching.png
- All PNGs have transparent backgrounds

### Brand Voice
Playful, supportive, expert but approachable. No jargon. Uses the dog's name in all personalized content.

### Brand Guidelines v2 (Delivered)
Full PDF with logo assets, Buddy 8 expressions, complete color/type/spacing system.

---

## 4. Tech Stack and Architecture

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Mobile | React Native 0.81.5 + Expo SDK 54 | iOS and Android app |
| Routing | Expo Router v6 (file-based) | Navigation, deep links |
| Language | TypeScript 5.3 (strict mode) | Type safety |
| React | 19.1.0 | UI framework |
| Styling | NativeWind v4 (Tailwind CSS for RN) | Styling |
| Client State | Zustand v5 + AsyncStorage persistence | Local state + offline |
| Server State | TanStack Query v5 | Server data + caching |
| Forms | React Hook Form + Zod | Validated forms |
| Animations | React Native Reanimated 4 | Native-thread 60fps |
| Backend | Supabase (Postgres + Auth + Storage + Edge) | All backend |
| AI | Anthropic Claude Sonnet 4.6 via Edge Functions | Chat + vision |
| Payments | RevenueCat + Superwall | IAP + paywall A/B |
| Analytics | PostHog + Sentry | Events + errors |
| Push | OneSignal + Expo Notifications | Push delivery |
| CI/CD | EAS Build + EAS Submit + EAS Update | Builds + OTA |

### AI Configuration (current, after overnight PRs)
- **buddy-chat edge function:** `claude-sonnet-4-6`, `DEFAULT_MAX_TOKENS = 120`, rate limit 20/min/IP, JWT verified
- **breed-detect edge function:** `claude-sonnet-4-6` vision, rate limit 10/min/IP, no JWT (anon key not verifiable as user token)
- **breed-classify edge function (PR #55, deployed):** HuggingFace ViT classifier, rate limit 10/min/IP, no JWT (anon key not verifiable as user token)
- **vaccine-extract edge function:** `claude-sonnet-4-6` vision
- Model string: `claude-sonnet-4-6` (NOT `claude-sonnet-4-6-20250514`)
- All AI calls go server-side through Edge Functions, ANTHROPIC_API_KEY never in client

### Architecture Patterns
See CLAUDE.md Critical Patterns section for detailed notes on:
1. Zustand selectors must return stable references (memoize arrays/objects)
2. `resetAllStores()` is the only correct way to clear state on sign-out
3. Auth Store is NOT persisted (use `onAuthStateChange` for auth state)
4. All AI uses Claude Sonnet 4.6 via Edge Functions (Kimi K2.5 fully removed)
5. `useSubscription()` is the ONLY way to check premium status
6. All data is per-dog (every query filters by `dog_id`)

---

## 5. Codebase Structure (as of PR #61, overnight session)

### Stats
- **App screens:** 45 files in `/app/`
- **Source components:** `src/components/` (breed, chat, dog, gamification, health, journal, notifications, onboarding, training, ui)
- **Stores:** 12 Zustand stores in `src/stores/`
- **Total PRs merged:** 53 (app) + 3 (lander) = 56
- **Total PRs merged:** 64 (app) + 6 (lander) = 70

### Screen Map (45 screens)

**Onboarding (8 screens)**
1. `app/(onboarding)/index.tsx` - Screen 1: Meet Buddy (welcome, BuddyAvatar waving)
2. `app/(onboarding)/name.tsx` - Screen 2: Dog name input
3. `app/(onboarding)/photo.tsx` - Screen 3: Photo upload + breed detection (two-tier Buddy: thinking/excited, hybrid detection stages)
4. `app/(onboarding)/age.tsx` - Screen 4: Dog age/DOB picker
5. `app/(onboarding)/challenges.tsx` - Screen 5: Challenge selection (multi-select)
6. `app/(onboarding)/experience.tsx` - Screen 6: Owner experience level
7. `app/(onboarding)/plan-preview.tsx` - Screen 7: Personalized plan preview (12-week teaser)
8. `app/(onboarding)/paywall.tsx` - Screen 8: Paywall (Superwall)

**Main Tabs (5 tabs)**
9. `app/(tabs)/index.tsx` - Home / Today's Training (GBS gauge with null delta guard, daily exercises, streaks)
10. `app/(tabs)/chat.tsx` - Buddy AI Chat (BuddyAvatar happy/waving, overflow menu, hydration guard for counter)
11. `app/(tabs)/plan.tsx` - Training Plan + Tricks (week nav, exercises, trick packs)
12. `app/(tabs)/health.tsx` - Health Dashboard (5 sub-tabs)
13. `app/(tabs)/profile.tsx` - Profile, settings shortcuts, achievements

**Community (1 screen)**
14. `app/(tabs)/community.tsx` - Community feed (read-only, demo data)

**Detail Screens (6)**
15. `app/exercise/[id].tsx` - Exercise detail + completion (step-by-step, video, star rating)
16. `app/achievements/index.tsx` - Full achievements grid (52 achievements, category filter)
17. `app/paywall.tsx` - Mid-app paywall (premium gate)
18. `app/referral/index.tsx` - Referral program screen
19. `app/add-dog/index.tsx` - Multi-dog: add new dog (629 lines)
20. `app/manage-dogs/index.tsx` - Multi-dog: manage all dogs

**Dog Management (1)**
21. `app/dog/[id]/manage.tsx` - Edit dog profile (485 lines)

**Breed Encyclopedia (2)**
22. `app/breeds/index.tsx` - Breed browser (51 breeds, search, size filter)
23. `app/breeds/[slug].tsx` - Breed detail (growth curves, training insights)

**Health Sub-Screens (10)**
24. `app/health/vaccinations.tsx` - Vaccination schedule + status
25. `app/health/vaccination-setup.tsx` - First-time vaccination setup (3 paths)
26. `app/health/vaccine-upload.tsx` - AI photo upload for vaccine records
27. `app/health/vaccine-manual.tsx` - Manual vaccine entry
28. `app/health/weight.tsx` - Weight tracker + SVG growth chart (real breed range comparison added in PR #59)
29. `app/health/medications.tsx` - Medication management (6 categories, 7 frequencies)
30. `app/health/vet-visits.tsx` - Vet visit log (6 visit types, full CRUD)
31. `app/health/milestones.tsx` - Developmental milestones (per-dog, auto-init by age)
32. `app/health/notes.tsx` - Health notes (4 severity levels, 5 categories)

**Tricks (3)**
33. `app/tricks/index.tsx` - Trick library overview (6 packs, free: Shake)
34. `app/tricks/[slug].tsx` - Trick pack detail
35. `app/tricks/detail/[id].tsx` - Individual trick detail + learning steps

**Growth Journal (2)**
36. `app/journal/index.tsx` - Journal timeline (month grouping, filter tabs) - renamed "Puppy Time Hop"
37. `app/journal/add.tsx` - Add journal entry (photos, notes, backdating)

**Settings (5)**
38. `app/settings/edit-profile.tsx` - Edit dog + owner profile
39. `app/settings/notifications.tsx` - Notification preferences
40. `app/settings/preferences.tsx` - App preferences (units, theme, etc.)
41. `app/settings/subscription.tsx` - Subscription management
42. `app/settings/data-privacy.tsx` - Data export + account deletion (supabase.auth.signOut after resetAllStores)

**Layout Files (3)**
43. `app/_layout.tsx` - Root layout (fonts, auth, analytics init, ErrorBoundary, deep link handler)
44. `app/(onboarding)/_layout.tsx` - Onboarding stack layout
45. `app/(tabs)/_layout.tsx` - Tab bar layout

### Key Source Files
- `src/lib/aiProvider.ts` - Buddy chat client (calls buddy-chat Edge Function)
- `src/lib/breedDetect.ts` - Breed detection client (hybrid two-step: breed-classify + breed-detect)
- `src/lib/deepLinks.ts` - Deep link parser and handler (new in PR #61)
- `src/lib/resetStores.ts` - `resetAllStores()` for sign-out/re-onboard
- `src/services/analytics.ts` - PostHog + Sentry stub (Sentry DSN wired via env var, @sentry/react-native installed, plugin added to app.config.js — commit bc3cf7a)
- `src/hooks/useSubscription.ts` - THE ONLY way to check premium status
- `src/components/chat/BuddyIcon.tsx` - SVG Buddy for small sizes (fixed: no JSX comments)
- `src/components/chat/BuddyAvatar.tsx` - PNG Buddy for large sizes
- `src/components/onboarding/BreedScanAnimation.tsx` - Scan animation with hybrid detection stages

---

## 6. Supabase Configuration

- **Project ID:** klttrrdyplsemqiudfvf
- **Region:** (check Supabase dashboard)
- **Deploy command:** `supabase functions deploy <name> --project-ref klttrrdyplsemqiudfvf`

### Edge Functions (4, all deployed)
| Function | Purpose | Max Tokens | Rate Limit | JWT |
|----------|---------|------------|------------|-----|
| buddy-chat | AI chat + summarization | 120 (DEFAULT_MAX_TOKENS) | 20/min/IP | Yes (PR #52) |
| breed-detect | Vision breed identification | 800 | 10/min/IP | None — rate limit only |
| breed-classify | HuggingFace ViT classifier (hybrid step 1) | N/A | 10/min/IP | None — rate limit only |
| vaccine-extract | Vaccine record parsing | N/A | 10/min/IP | No |

### JWT Verification Status
- **buddy-chat:** mandatory JWT (post-auth only, PR #52)
- **breed-detect:** no JWT verification — rate limiting only (Supabase client sends anon key not user token)
- **breed-classify:** no JWT verification — rate limiting only (Supabase client sends anon key not user token)
- **vaccine-extract:** no JWT

### Supabase Secrets (set in Dashboard)
```
ANTHROPIC_API_KEY           # Powers all 4 edge functions
HUGGINGFACE_API_KEY         # Optional - breed-classify works on HF free tier without it
SUPABASE_URL                # Auto-set
SUPABASE_ANON_KEY           # Auto-set
SUPABASE_SERVICE_ROLE_KEY   # Auto-set
```

### Migrations
3 SQL migration files in repo. Production DB has 15+ migrations. Always run `supabase gen types typescript --project-id klttrrdyplsemqiudfvf` after schema changes.

---

## 7. Supabase Sync Architecture (All 5 Phases Complete)

### Phase 1: Dog Profiles (PR #25, DONE)
Bidirectional sync with `public.dogs` table. Real-time subscriptions on profile changes.

### Phase 2: Training Plans + Exercise Completions (PR #32, DONE)
Plans and completions sync to `training_plans` and `exercise_completions` tables.

### Phase 3: Chat History + Sessions (PR #33, DONE)
Chat messages and sessions sync to `chat_messages` and `chat_sessions` tables.

### Phase 4: Health Records (PR #35, DONE)
Vaccinations, weight, medications, vet visits, milestones, notes all sync.

### Phase 5: Gamification (PR #34, DONE)
XP, streaks, GBS, achievements all sync to Supabase.

**All 5 sync phases complete as of PRs #33-#35.**

---

## 8. GitHub and PR History

### PupPal-app PRs (61 total: 53 merged, 8 open)

| # | Status | Description |
|---|--------|-------------|
| #1 | MERGED | fix: resolve all 7 pre-TestFlight bugs |
| #2 | MERGED | feat: breed growth curves + skeleton loaders + error boundaries |
| #3 | MERGED | fix: QA audit round 2 - 10 pre-TestFlight fixes |
| #4 | MERGED | fix: 4 device-testing blockers - chat crash, render loops, Button text leak |
| #5 | MERGED | feat: breed detection, store reset, doc updates |
| #6 | MERGED | fix: complete activeDog() selector sweep (27 files) + chat streaming fix |
| #7 | MERGED | fix: round-2 blockers - useMemo imports, premium toggle, health gates, weight chart |
| #8 | MERGED | fix: round-3 deep fixes - chat error handling, premium day locks, breed logging, photo preview |
| #9 | MERGED | fix: 10-item cleanup, breed detection, chat quality, markdown, em dash purge |
| #10 | MERGED | fix: round 3 testing feedback - all 10 items |
| #11 | MERGED | fix: remove duplicate community/index route (crash on launch) |
| #12 | MERGED | feat: inline breed selector on photo screen (PRD-01) |
| #13 | MERGED | fix: three blockers - community route, trial crash, breed selector UX |
| #14 | CLOSED | (superseded by #15) |
| #15 | MERGED | feat: switch chat from Kimi to Claude Sonnet 4.6 via Edge Function |
| #16 | MERGED | feat: vaccination setup rethink - welcome flow, AI record upload, manual entry |
| #17 | MERGED | fix: testing round fixes - all 11 issues |
| #18 | MERGED | fix: Testing Round 2 - All 6 Issues |
| #19 | MERGED | feat: multi-photo breed detection + round 2b fixes |
| #20 | MERGED | fix: testing round 3 - per-dog plans, milestones, multi-dog chat, animations |
| #21 | MERGED | fix: training plan UX - star ratings, re-practice, week unlock tiers |
| #22 | MERGED | fix: testing round 4 - DOB picker, low rating UX, week unlock, Paw Points rename |
| #23 | MERGED | feat: multi-photo same-dog validation + photo storage |
| #24 | MERGED | fix: dynamic age display from DOB + rename Age at signup to Age |
| #25 | MERGED | feat: bidirectional dog profile sync with Supabase |
| #26 | MERGED | feat: Breed scan animation overlay for onboarding photo screen |
| #27 | MERGED | fix: Buddy chat quality - remove truncation, inject training context |
| #28 | MERGED | chore: remove stale GOOGLE_CLOUD_VISION_KEY from .env.example |
| #29 | MERGED | fix: Resolve exercise names from library + dynamic suggested prompts |
| #30 | MERGED | docs: full documentation audit - remove stale Kimi/GCV references |
| #31 | MERGED | docs: add PRDs 16-22 and update CLAUDE.md for all 22 PRDs |
| #32 | MERGED | feat: Supabase sync phase 2 - training plans + exercise completions |
| #33 | MERGED | feat: Supabase sync phase 3 - chat history + session summaries |
| #34 | MERGED | feat: gamification sync (phase 5) |
| #35 | MERGED | feat: Supabase sync phase 4 - health records |
| #36 | MERGED | feat: conversation memory (PRD-02 §4) |
| #37 | MERGED | feat: plan adaptation engine (PRD-03 §8) |
| #38 | MERGED | feat: overhaul breed detection screen UX |
| #39 | MERGED | fix: Buddy chat - response length + session-aware welcome |
| #40 | MERGED | feat: breed-detect prompt rewrite - size-first, single-photo confidence cap, mixed breed |
| #41 | MERGED | feat: photo screen premium UI - Buddy expressions, result card elevation, confidence badges, button hierarchy |
| #42 | MERGED | fix: hard token cap (175) + free tier message limit (3/day) |
| #43 | MERGED | fix: edge function DEFAULT_MAX_TOKENS 2048 to 175 |
| #44 | MERGED | fix: max-tokens edge fn + counter rehydration + new conversation overflow menu |
| #45 | MERGED | fix: token cap 120, log spam, new convo summarizer, free counter countdown |
| #46 | MERGED | fix: free counter, onboarding avatar, overflow menu, week nav, tricks access, rename Growth Journal |
| #47 | MERGED | fix: aggressive response rules + markdown stripping |
| #48 | MERGED | feat: rate limiting on breed-detect |
| #49 | MERGED | fix: counter rehydration, chat history reset, Buddy PNGs added, image compression, splash icon |
| #50 | MERGED | fix: two-tier Buddy system, transparent assets, fix duplicate Buddy + keys |
| #51 | MERGED | fix: remove JSX comments from BuddyIcon - fixes Text string crash |
| #52 | MERGED | feat: add Supabase JWT verification to buddy-chat and breed-detect |
| #53 | MERGED | feat: configure Sentry DSN via EXPO_PUBLIC_SENTRY_DSN env var |
| #54 | MERGED | feat: App Store submission prep (eas.json, app.json, metadata, checklist, screenshot spec) |
| #55 | MERGED | feat: hybrid breed detection - HuggingFace ViT classifier + Sonnet reasoning |
| #56 | MERGED | fix: QA onboarding/home/plan bugs (OB-01 to OB-03, HOME-01, PLAN-01 to PLAN-03) |
| #57 | MERGED | fix: QA chat bugs (CHAT-01 to CHAT-05) |
| #58 | MERGED | fix: QA visual and edge-case bugs (VIS-01 to VIS-04, EDGE-01 to EDGE-03) |
| #59 | MERGED | fix: QA health/tricks/profile bugs (HEALTH-01 to PROFILE-02) |
| #60 | MERGED | fix: QA settings/community bugs (COMM-01 to SET-03) |
| #61 | MERGED | feat: Universal Links + Android App Links + deep link handler |

### PupPal-Lander PRs (6 total: 3 merged, 3 open)

| # | Status | Description |
|---|--------|-------------|
| L#1 | MERGED | Copy audit improvements across all 12 sections |
| L#2 | MERGED | feat: update noscript copy + add OG image (1200x630) |
| L#3 | MERGED | feat: add static pre-rendering for SEO (vite-plugin-prerender) |
| L#4 | MERGED | feat: SEO Foundation - llms.txt, Blog (10 articles), Sitemap (67 URLs), Robots.txt |
| L#5 | MERGED | feat: 3-email waitlist welcome sequence via Convex scheduler + Resend |
| L#6 | MERGED | feat: Apple Universal Links + Android App Links well-known files |

### PR Links (Overnight Open PRs)
- https://github.com/changocircle/PupPal-app/pull/54 (App Store prep)
- https://github.com/changocircle/PupPal-app/pull/55 (Hybrid breed detection)
- https://github.com/changocircle/PupPal-app/pull/56 (QA onboarding/home/plan)
- https://github.com/changocircle/PupPal-app/pull/57 (QA chat)
- https://github.com/changocircle/PupPal-app/pull/58 (QA visual/edge-case)
- https://github.com/changocircle/PupPal-app/pull/59 (QA health/tricks/profile)
- https://github.com/changocircle/PupPal-app/pull/60 (QA settings/community)
- https://github.com/changocircle/PupPal-app/pull/61 (Deep links)
- https://github.com/changocircle/PupPal-Lander/pull/4 (SEO Foundation)
- https://github.com/changocircle/PupPal-Lander/pull/5 (Welcome emails)
- https://github.com/changocircle/PupPal-Lander/pull/6 (Deep link well-known files)

---

## 9. Key Changes Since v9 (Overnight March 8-9, 2026)

### QA Bug Fixes (PRs #56 to #60 - 5 PRs covering 26 items)

**Onboarding / Home / Plan (PR #56)**
- OB-01: BreedScanAnimation SCAN state verified uses BuddyExpression "thinking" PNG correctly
- OB-02: Plan-preview CTA verified wired to paywall
- OB-03: Paywall.tsx graceful Alert fallback verified
- HOME-01: GamificationRow `gbsDelta` prop null guard added - shows "--" when no prior session
- HOME-02: dogStore.switchDog + trainingStore verified correct per-dog filtering
- PLAN-01: Week nav lock/unlock premium logic verified correct after PR #46
- PLAN-02: `console.log` added to `rateExercise()` so adaptation can be verified in dev logs
- PLAN-03: ChatInput camera icon not present in exercise detail - verified correct

**Chat Bugs (PR #57)**
- CHAT-01: `useChatStore` added to `useHydration()` in chat.tsx - stale-limit fix now completes before counter renders
- CHAT-02: `userId` stamped on `ChatSession` at `startSession()` time. `getUserSessions()` helper filters by current user - prevents cross-account chat history collision
- CHAT-03: Camera icon in ChatInput verified as JS comment only, no JSX comment crash risk
- CHAT-04: `console.log("[buddy-chat/summarize] Summarize action received")` added at dispatch point in Edge Function
- CHAT-05: `BuddyAvatar` waving PNG wrapped in React.memo to prevent flash on empty state render

**Visual + Edge Case Bugs (PR #58)**
- VIS-01: `assets/splash-icon.png` verified (226179 bytes, 1242x2688 Buddy illustration)
- VIS-02: BuddyIcon.tsx verified no JSX comments inside SVG (PR #51 fix intact)
- VIS-03: App icon replaced - proper PupPal brand icon (1024x1024, coral #FF6B5C background, navy #1B2333 paw print, rounded corners)
- VIS-04: Welcome screen verified uses Reanimated 4 ZoomIn/FadeInDown - no Moti
- EDGE-01: Zero-dog guard at `app/(tabs)/index.tsx` verified
- EDGE-02: Breed fallbacks verified - "Mixed breed" default in buddyPrompt.ts
- EDGE-03: buddy-chat Edge Function returns 503 on Anthropic down, client error state verified

**Health / Tricks / Profile (PR #59)**
- HEALTH-01: Real breed range comparison added to `withinBreedRange` - no longer hardcoded "normal"
- HEALTH-02: Better vaccine upload empty result handling - shows "no vaccines detected" prompt with retry
- HEALTH-03: `console.log` added for DOB milestone calculation verification
- TRICKS-01/02/03: All trick pack logic verified correct
- PROFILE-01: Alert fallback added for dog photo upload TODO
- PROFILE-02: `isAuthLoading` guard added in subscription screen

**Settings / Community (PR #60)**
- COMM-01/02: Demo posts verified correct behavior
- SET-01: `supabase.auth.signOut()` now fires after `resetAllStores()` on account deletion
- SET-02: Comment added to notifications screen: "OneSignal not connected yet"
- SET-03: Language "coming soon" toast verified in place

### Hybrid Breed Detection (PR #55)

New two-step pipeline:
```
Photo -> breed-classify (HuggingFace ViT, ~2s)
              |
     Top 3 breed candidates
              |
        breed-detect (Claude Sonnet)
              |
  Validated breed result + reasoning
```

- **New:** `supabase/functions/breed-classify/index.ts` - HuggingFace `nickmuchi/vit-finetuned-dog-classifier` (ViT, 120 Stanford Dogs breeds). Fallback: `Falconsai/dog-breed-identification`. Returns top 3 predictions with confidence scores. JWT verified, 10/min/IP.
- **Updated:** `supabase/functions/breed-detect/index.ts` - Accepts optional `classifierPredictions` in request body. `buildHybridPromptSingle` (65% max confidence) and `buildHybridPromptMulti` (85% max confidence) with classifier hints. Backward compatible: no predictions = standard Sonnet-only analysis.
- **Updated:** `src/lib/breedDetect.ts` - Two-step `detectBreed()` with `onProgress(stage)` callback. `runClassifier()` calls breed-classify (15s timeout, graceful fallback). `runSonnetDetect()` calls breed-detect with optional predictions.
- **Updated:** `src/components/onboarding/BreedScanAnimation.tsx` - Stage-aware messages: "classifying" shows "Scanning across 120 breeds..." and "confirming" shows "Cross-referencing with AI..."
- **Why Option B (HuggingFace) not Option A (TFLite):** `react-native-fast-tflite` requires bare workflow with native `android/` and `ios/` dirs. PupPal is Expo managed workflow - incompatible.
- **HUGGINGFACE_API_KEY:** Optional. Free tier works without a key.

### App Store Submission Prep (PR #54)

Everything needed to submit the moment Apple Developer approval comes through.

- **`eas.json`** (new): Development, preview, and production build profiles. Run `eas build --platform ios --profile production` to start.
- **`app.json`** updated: App name is now "PupPal - AI Puppy Training", owner: changocircle, `ios.buildNumber: "1"`, `android.versionCode: 1`, iOS privacy manifests (iOS 17+ required).
- **`docs/app-store-metadata.md`** (new): Full App Store Connect metadata. App description (~2800 chars), promotional text (158 chars), keywords (99 chars), What's New text for v1.0, reviewer contact info, reviewer notes.
- **`docs/screenshot-spec.md`** (new): Exact spec for 10 screenshots across 3 device sizes (6.5", 5.5", iPad Pro 12.9").
- **`docs/submission-checklist.md`** (new): End-to-end checklist from Apple Developer approval to live on App Store.
- **`scripts/generate-mockups.js`** (new): Sharp-based mockup compositor (placeholder until screenshots are ready).

### SEO Foundation for Landing Page (Lander PR #4)

- **`public/llms.txt`** (new): AI crawler description per llmstxt.org spec. Key differentiators, competitor comparison, waitlist CTA for AI like ChatGPT/Claude/Perplexity.
- **`public/robots.txt`** updated: Clean format, no extraneous /api/ disallow.
- **`public/sitemap.xml`** generated: 67 URLs total (static pages + 51 breed slugs + 10 blog articles).
- **`scripts/generate-sitemap.js`** (new): Dynamic sitemap generator, runs as pre-build step.
- **`src/data/blog-posts.ts`** (new): 10 SEO articles (800-1200 words each).
- **`src/pages/blog/index.tsx`** (new): Blog index page with card grid.
- **`src/pages/blog/[slug].tsx`** (new): Article page with breadcrumb, JSON-LD, related posts, and download CTAs.
- **`src/App.tsx` + `AppSSR.tsx`** updated: Blog routing added.
- **`scripts/prerender.ts`** updated: Blog routes added for SSG pre-rendering.

**10 blog articles targeting high-traffic puppy queries:**
1. When Do Puppies Stop Biting?
2. Puppy Potty Training Schedule by Age
3. How to Crate Train a Puppy
4. First Week with a New Puppy Checklist
5. How to Stop a Puppy from Jumping
6. Puppy Socialization Timeline
7. How Much Sleep Does a Puppy Need?
8. Best Training Treats for Puppies
9. How to Stop Puppy Whining at Night
10. Puppy Teething Timeline

### Welcome Email Sequence (Lander PR #5)

3-email drip via Convex scheduler + Resend. Triggers on new waitlist signup (not existing signups).

| Email | When | From | Subject |
|-------|------|------|---------|
| Email 1 | Immediate | buddy@puppal.dog | "Welcome to PupPal, [name]!" |
| Email 2 | 2 days later | hello@puppal.dog | "The #1 mistake new puppy parents make..." |
| Email 3 | 5 days later | hello@puppal.dog | "PupPal is almost ready for you..." |

- **`convex/emails.ts`** (new): `scheduleWelcomeSequence` mutation + `sendWelcomeEmail` action using `ctx.scheduler.runAfter()`.
- **`convex/emailTemplates.ts`** (new): Branded HTML templates for all 3 emails. Navy header, Coral CTAs, mobile-first layout. Plain text fallbacks included.
- **`convex/waitlist.ts`** updated: Calls `scheduleWelcomeSequence` on new signups. Passes `name` arg for personalization.

### Deep Link Configuration (App PR #61 + Lander PR #6)

**App (PR #61):**
- `app.json` iOS: `associatedDomains: ["applinks:puppal.dog"]` for Universal Links
- `app.json` Android: `intentFilters` with `autoVerify: true` for 5 paths: `/referral`, `/share`, `/invite`, `/reset-password`, `/open`
- `src/lib/deepLinks.ts` (new): `DEEP_LINK_PATHS` constants, `parseDeepLink(url)` for both https and puppal:// schemes, `handleDeepLink(url, router)` routes to correct Expo Router screen, `getInitialDeepLink()` for cold-start handling
- `app/_layout.tsx` updated: useEffect for cold-start deep links (100ms delay for nav readiness)

**Lander (PR #6):**
- `public/.well-known/apple-app-site-association` (new): App ID `5J4UG739H5.com.puppal.app`, paths `/referral/*`, `/share/*`, `/reset-password`, `/invite/*`, `/open`, webcredentials for password autofill
- `public/.well-known/assetlinks.json` (new): Package `com.puppal.app`, SHA256 fingerprint placeholder (update when Android keystore created)
- Both served via Vercel static hosting, no server config needed

---

## 10. Feature Audit (as of overnight PRs, March 9, 2026)

### Working and Stable
1. **Onboarding** (8 screens) - full flow, Buddy PNGs throughout, hybrid detection stages (classifying/confirming)
2. **Breed Detection** (multi-photo AI) - hybrid pipeline (HuggingFace ViT + Sonnet), size-first, confidence caps, image compression, rate limiting, JWT verified
3. **Training Plan** (12-week) - syncs to Supabase, week 2+ accessible on premium
4. **Exercise Detail + Completion** - star ratings, XP, reschedule on low rating, syncs to Supabase
5. **Buddy Chat** - 120 max_tokens, no markdown, 3-4 sentences, conversation memory, dynamic suggestions, overflow menu, per-user session isolation
6. **Chat Counter** - free tier 3/day, countdown display, hydration guard fix applied
7. **Health Dashboard** - 5 sub-screens (vaccinations, weight, medications, milestones, vet visits, notes), real breed range comparison for weight
8. **Vaccination Setup** (3-path) - upload/manual/fresh
9. **Vaccine AI Extraction** - multi-photo (5 max), fuzzy matching, empty result handling
10. **Weight Tracker + Chart** - lbs/kg toggle, SVG line chart, real breed range comparison
11. **Medications** - add/log/deactivate, 6 categories, 7 frequencies
12. **Vet Visits** - full CRUD, 6 visit types
13. **Health Notes** - CRUD, severity levels, categories
14. **Developmental Milestones** - per-dog, auto-init by age
15. **Achievements Grid** - 52 achievements, category filters, progress bars
16. **Streak System** - streak data, freeze support, milestones
17. **Good Boy Score (GBS)** - 5-dimension calc, weighted composite, null delta guard
18. **Weekly Challenges** - card component, progress tracking, XP rewards
19. **Trick Library** - 30 tricks, 6 packs, 3-level progression (Week 2+ accessible on premium)
20. **Puppy Time Hop** (formerly Growth Journal) - timeline, month grouping, filter tabs
21. **Multi-Dog Management** - per-dog data isolation, switcher
22. **Breed Encyclopedia** - 51 breeds, search, size filter
23. **Premium Gating** - useSubscription hook, dev override
24. **Settings** - all screens built, account deletion calls supabase.auth.signOut
25. **Share Cards** - 8 types, branded messages
26. **App Store Docs** - eas.json, metadata, screenshot spec, submission checklist (PR #54)
27. **Deep Links** - Universal Links (iOS) + App Links (Android) configured (PR #61)

### Partially Working
- **Chat Memory** - sessions/summaries persist but auto-summarization trigger needs verification on device (console.log added for debugging)
- **Community Feed** - UI scaffold only, hardcoded demo data, no backend
- **Referral System** - client-side code gen + share, no server validation
- **Push Notifications** - local scheduling (Expo) works, OneSignal not connected
- **Paywall / RevenueCat** - beautiful UI, no actual IAP wired
- **Sentry** - DSN configured via env var (PR #53), `@sentry/react-native` SDK installed, plugin added to app.config.js (commit bc3cf7a)
- **Hybrid Breed Detection** - PR #55 merged, breed-classify Supabase Function deployed

### Not Built
- **Apple Sign-In** - v1 BLOCKER. Needs `expo-apple-authentication` + Supabase Apple OAuth.
- **RevenueCat IAP** - v1 BLOCKER. Needs `react-native-purchases` + RevenueCat dashboard + App Store Connect products.
- **Breed Pages on Lander** - sitemap has 51 breed URLs but no `src/pages/breeds/` components exist yet. Blog built, breeds not yet.

---

## 11. v1 Launch Blockers

1. **Apple Sign-In** - Required by Apple for App Store. Needs `expo-apple-authentication` + Supabase Apple OAuth.
2. **RevenueCat / IAP** - Can't monetize without it. Needs `react-native-purchases` + RevenueCat dashboard + App Store Connect products.

**Remaining before TestFlight (merge overnight PRs first):**
- Merge PR #52 already done (JWT). Merge PRs #54-#61 (overnight work).
- Sentry SDK installed (`@sentry/react-native`), plugin added to app.config.js (bc3cf7a)
- breed-classify Supabase function deployed (PR #55 merged)
- Bug fixes: duplicate `detectionStage` useState in photo.tsx (e3c4006), duplicate `messages` const in BreedScanAnimation.tsx (d4cdf3b) — merge artifacts causing launch crash
- breed-classify + breed-detect JWT made optional for pre-auth onboarding (753d7f0)
- BRAIN.md now lives in repo root. Updated after every significant change, not just end of session.
- Parallel breed detection pipeline: classifier + Sonnet overlap, up to ~12s faster (a56380e)
- Scan animation: no AI references, TEXT_CYCLE_MS 1600, updated copy (a56380e)
- Upload prompt: "Upload 3 photos for the best results" + slot labels shown before first upload (a56380e)
- Custom challenges: "Something else?" on challenges screen, free text stored as customChallenges[], keyword-mapped to exercise categories in planGenerator (a56380e)
- Update CLAUDE.md "Current Sprint" section to reflect v10 state

---

## 12. Infrastructure Ownership (All Ashley-Owned)

**Zero Viktor dependencies.**

### App
| Service | Detail |
|---------|--------|
| GitHub | changocircle/PupPal-app |
| Supabase | Project klttrrdyplsemqiudfvf |
| Vercel | whitestoneglobal org |
| Apple Developer | Enrolled as Organization, enrollment ID 5J4UG739H5, pending approval |

### Landing Page
| Service | Detail |
|---------|--------|
| GitHub | changocircle/PupPal-Lander |
| Domain | puppal.dog (via Vercel) |
| Convex | decisive-cheetah-657.convex.cloud (Ashley's account, chat widget + waitlist + welcome emails) |
| Vercel | Auto-deploy from main |
| Resend | changocircle@gmail.com, domain puppal.dog (buddy@puppal.dog + hello@puppal.dog) |

### Admin Dashboard
| Service | Detail |
|---------|--------|
| URL | pup-pal-admin.vercel.app |
| Backend | Supabase (same project klttrrdyplsemqiudfvf) |

### Notes
- Old Convex instance (confident-ladybug-474) is dormant. Can be deleted.
- Viktor Spaces fully removed. Zero Viktor dependencies.

---

## 13. Landing Page (PupPal-Lander) Status

### Overview
React + Vite + Tailwind (using `@tailwindcss/vite` plugin). Deployed to Vercel at puppal.dog.

### Features Built (fully merged in main)
- 12 landing page sections: Hero, Problem, How It Works, Meet Buddy, Training Plan, Good Boy Score, Features Showcase, Health Tracker, Social Proof, Price Comparison, FAQ, Final CTA
- Sticky header with scroll behavior
- Buddy chat widget (uses Convex action, NOT the Supabase edge function)
- Waitlist form (via Convex + Resend) with welcome email sequence (PR L#5 merged)
- SEO: comprehensive JSON-LD schemas (Organization, SoftwareApplication, FAQPage, HowTo)
- OG tags in index.html pointing to `/og-image.png` (1200x630, added PR L#2)
- noscript fallback: comprehensive static HTML for crawlers (updated PR L#2)
- Static pre-rendering: `vite-plugin-prerender` added (PR L#3 merged)
- Copy audit across all 12 sections (PR L#1 merged)

### Overnight PRs (Pending Merge)
- **PR L#4 (SEO Foundation):** llms.txt, robots.txt, sitemap (67 URLs), blog (10 articles), blog routing
- **PR L#5 (Welcome Emails):** 3-email Convex drip sequence via Resend
- **PR L#6 (Deep Links):** apple-app-site-association + assetlinks.json

### SEO Status After PR L#4
- **llms.txt:** AI crawlers (ChatGPT, Claude, Perplexity) can understand PupPal
- **Sitemap:** 67 URLs including static pages, 51 breed slugs, 10 blog articles
- **Blog:** 10 articles at `/blog/[slug]` targeting high-volume puppy training queries
- **robots.txt:** Clean, crawlable
- **Pre-rendering:** Static HTML generated at build time for all routes

### Convex Backend (landing page only)
- Deployment: decisive-cheetah-657.convex.cloud
- Functions: chat action (Anthropic via `ANTHROPIC_API_KEY`), waitlist submission, welcome email scheduler

---

## 14. Environment Variables

### Client-side (React Native app, .env)
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_POSTHOG_API_KEY=
EXPO_PUBLIC_POSTHOG_HOST=
EXPO_PUBLIC_SENTRY_DSN=             # Added PR #53 - reads into analytics.ts
SENTRY_DSN=                          # Also referenced in older code
```

### Server-side (Supabase Edge Function secrets)
```
ANTHROPIC_API_KEY                    # All 4 edge functions
HUGGINGFACE_API_KEY                  # breed-classify (optional - free tier works without)
SUPABASE_SERVICE_ROLE_KEY            # Auto-set by Supabase
SUPABASE_URL                         # Auto-set
SUPABASE_ANON_KEY                    # Auto-set
```

### Not yet configured (pending integration)
```
REVENUECAT_APPLE_API_KEY=
REVENUECAT_GOOGLE_API_KEY=
SUPERWALL_API_KEY=
ONESIGNAL_APP_ID=
```

### Landing Page (Vercel env vars)
```
VITE_CONVEX_URL=                     # decisive-cheetah-657.convex.cloud
```

### Landing Page Convex (env vars in Convex dashboard)
```
ANTHROPIC_API_KEY                    # Used by chat action
RESEND_API_KEY                       # Used by welcome email sequence
```

---

## 15. Known Bugs and Tech Debt

### Active Bugs (as of v10 - overnight PRs)
1. **Chat counter timing** - PR #57 adds `useChatStore` to `useHydration()` - this should fix the "0 left" issue. MUST verify on physical device with fresh install.
2. **Chat history cross-account** - PR #57 adds `userId` stamping on sessions + `getUserSessions()` filter. Should prevent old test account history showing for new users.
3. **Community backend** - Hardcoded demo posts. No real Supabase Realtime backend.
4. **Weight breed range** - PR #59 adds real comparison. Needs to be tested with edge cases (small breeds, giant breeds at boundary weights).
5. **breed-classify deployed** - PR #55 merged, Supabase function deployed (`supabase functions deploy breed-classify --project-ref klttrrdyplsemqiudfvf` completed)
6. **assetlinks.json SHA256** - Android App Links (PR L#6/PR #61) has a placeholder SHA256 fingerprint. Must update when Android keystore is created before Play Store submission.

### Tech Debt
- **RevenueCat IAP** - Not wired. Subscription management is UI only.
- **Apple Sign-In** - Not implemented. Required for App Store.
- **OneSignal push delivery** - Not connected. `expo-notifications` works locally.
- **Sentry SDK** - `@sentry/react-native` installed, plugin wired in app.config.js (bc3cf7a). Stubs in analytics.ts still need full Sentry.init() wiring.
- **PostHog** - Stub in analytics.ts. Package not installed.
- **Community backend** - Supabase Realtime not wired to community.
- **Breed pages on Lander** - Sitemap has 51 breed URLs but no `src/pages/breeds/` component exists. Planned for future sprint.
- **Breed Encyclopedia expansion** - App still has 51 breeds in `src/data/breeds.json`. Expanding to 200+ is on backlog.
- **Health PDF export** - No PDF generation. PRD-05 feature.
- **Journal entry detail** - Tapping entries in journal index doesn't open detail view (TODO at app/journal/index.tsx:84).
- **Plan generation on backend** - Plan is generated client-side from templates. No AI-powered personalization on server.
- **i18n** - No framework. English only.

---

## 16. Security

### What's Protected
- ANTHROPIC_API_KEY: Server-side only (Supabase Edge Function secrets, never in client)
- Supabase RLS: Row-level security on all tables
- Edge Functions: Rate limiting on all functions (10-20/min/IP)
- Content moderation: Basic keyword filter in buddy-chat
- JWT verification: buddy-chat requires auth (PR #52). breed-detect + breed-classify: no JWT (Supabase anon key is not a user token)

### Still Needed Before Launch
- Supabase RLS audit (confirm all tables have correct policies)
- Rate limiting review (per-user not just per-IP)
- Android keystore creation + update assetlinks.json SHA256 fingerprint

---

## 17. Marketing Deliverables Created

### 1. PupPal Growth Bible (Marketing Playbook)
Comprehensive growth strategy: 10 content pillars, Instagram strategy with 8 content types, TikTok playbook, Reels/Shorts strategy, influencer outreach playbook (micro/nano focus, 1k-100k), dog mom influencer target list (50 profiles), email sequence templates (7-day trial, post-trial, win-back), pricing psychology, A/B test framework.

### 2. PupPal Launch Pack (Phase 1)
App Store listing: long description (4,200 chars), promotional text, keywords list (100 terms), 5 screenshot captions, privacy policy URL format.

### 3. PupPal Press Kit
Media one-pager, company boilerplate, founder bio, 5 press angles, review outreach template.

### 4. PR Distribution Plan
50 media targets (pet, parenting, tech, business), outreach cadence, response handling guide.

### 5. Phase 2: Outreach Arsenal
Cold email templates for each media category, DM scripts for influencer outreach, personalization formula.

### 6. Brand Guidelines v2
Full PDF: logo assets (primary, stacked, icon-only, reversed, favicon), Buddy 8 expressions (PNG files), complete color/type/spacing system, component examples, do/don't guide.

### 7. App Store Submission Docs (PR #54)
`docs/app-store-metadata.md`, `docs/screenshot-spec.md`, `docs/submission-checklist.md` - everything needed to submit day one.

### 8. Blog Content Foundation (Lander PR #4)
10 SEO articles (800-1200 words each) targeting high-volume puppy training search queries.

### 9. Welcome Email Sequence (Lander PR #5)
3-email Convex/Resend drip. Immediate from Buddy, Day 2 positive reinforcement tip, Day 5 launch teaser.

---

## 18. Project Timeline

### Day 1 (March 4, 2026)
Viktor joined project. Initial codebase audit. PRs #1-#3 (TestFlight bug fixes, growth curves, skeleton loaders).

### Day 2 (March 5, 2026)
PRs #4-#7 (device testing fixes, breed detection, selector sweep, premium toggle). Supabase dog profile sync (PR #25). Breed scan animation (PR #26).

### Day 3 (March 6, 2026)
PRs #8-#16 (Kimi to Claude migration, multi-photo breed detection, vaccination rethink). Growth Bible delivered.

### Day 4 (March 7, 2026)
PRs #17-#35 (testing rounds, Supabase sync phases 2-5, conversation memory, plan adaptation, documentation audit). Brand Guidelines v2 delivered. All 5 sync phases complete.

### Day 5 (March 8, 2026) - Daytime
PRs #36-#53 (breed detection rewrite, photo screen premium UI, token cap series, rate limiting, Buddy PNGs, BuddyIcon crash fix, JWT verification, Sentry DSN). Growth Journal renamed to Puppy Time Hop.

### Overnight Session (March 8-9, 2026)
PRs merged (all deployed):
- PR #54: App Store submission prep (eas.json, metadata, screenshot spec, submission checklist)
- PR #55: Hybrid breed detection (HuggingFace ViT classifier + Sonnet reasoning)
- PR #56: QA fixes - onboarding/home/plan (7 items)
- PR #57: QA fixes - chat (5 items)
- PR #58: QA fixes - visual/edge-case (7 items)
- PR #59: QA fixes - health/tricks/profile (6 items)
- PR #60: QA fixes - settings/community (5 items)
- PR #61: Deep link configuration (Universal Links + Android App Links)
- Lander PR #4: SEO Foundation (llms.txt, blog 10 articles, sitemap 67 URLs, robots.txt)
- Lander PR #5: Welcome email sequence (3-email Convex/Resend drip)
- Lander PR #6: Deep link well-known files (AASA + assetlinks.json)
- @sentry/react-native installed, plugin added to app.config.js (commit bc3cf7a)

---

## 19. Critical Rules

1. **No Moti** - Banned. Use React Native Reanimated 4 only.
2. **No em dashes** - Use commas or "and" instead.
3. **Model string** - `claude-sonnet-4-6` (NOT `claude-sonnet-4-6-20250514`)
4. **Buddy personality** - Positive reinforcement ONLY. No punishment, no scolding.
5. **useSubscription()** - THE ONLY way to check premium. Never check subscription_status directly.
6. **resetAllStores()** - THE ONLY correct sign-out flow. Never reset stores individually. Must also call `supabase.auth.signOut()` on account deletion.
7. **Stable Zustand selectors** - Never return new arrays/objects inline. Memoize.
8. **Zustand button text leak** - use `array.join(' ')` for className, not template literals.
9. **All URLs are puppal.dog** - NOT puppal.app. Support: support@puppal.dog.
10. **Per-dog data** - Every query filters by dog_id. Never mix dog data.
11. **Read PRDs first** - Always read the relevant PRD before building a feature.
12. **JSX comments crash React Native** - `{/* comment */}` inside native views renders as text string. DON'T add JSX comments inside SVG components or native view trees.
13. **Sentry SDK installed** - `@sentry/react-native` installed, plugin in app.config.js (bc3cf7a). analytics.ts stubs still need full `Sentry.init()` wiring in `app/_layout.tsx`.
14. **Expo Router v6** - File-based routing. No duplicate routes in multiple directories.
15. **Expo managed workflow** - PupPal has no `android/` or `ios/` dirs. Any package requiring bare workflow (like `react-native-fast-tflite`) is incompatible. Verify before recommending packages.
16. **Per-user chat history** - ChatSessions must be stamped with userId at startSession(). Use getUserSessions() to filter. Never show sessions from other user accounts.
17. **breed-classify deployment** - After merging PR #55, must run: `supabase functions deploy breed-classify --project-ref klttrrdyplsemqiudfvf`
18. **assetlinks.json SHA256 is a placeholder** - Must update with real Android keystore fingerprint before Play Store submission. Never use the placeholder SHA256 in production.

---

## 20. What's Next (Priority Order)

### Immediate (Review and Merge Overnight PRs)
- [ ] Review and merge PRs #54-#61 (app)
- [ ] Review and merge Lander PRs #4-#6
- [ ] After merging #55: `supabase functions deploy breed-classify --project-ref klttrrdyplsemqiudfvf`
- [ ] After merging #53 (already merged): Set `EXPO_PUBLIC_SENTRY_DSN` in .env

### Before TestFlight
- [x] Install Sentry SDK: `@sentry/react-native` installed + plugin added to app.config.js (bc3cf7a). Still needs `Sentry.init()` call in `app/_layout.tsx`.
- [ ] Install PostHog SDK and wire analytics
- [ ] Full QA pass on physical device (especially chat counter CHAT-01)
- [x] breed-classify deployed (PR #55 merged). Verify hybrid detection end-to-end on physical device.
- [ ] Fix journal entry detail screen (tap to open)
- [ ] Fix chat camera button (wire up or remove)
- [ ] Update CLAUDE.md "Current Sprint" section

### v1 Launch Blockers (2 remaining)
- [ ] Apple Sign-In (`expo-apple-authentication` + Supabase Apple OAuth)
- [ ] RevenueCat IAP (`react-native-purchases` + dashboard setup + App Store Connect products)

### Post-TestFlight
- [ ] Connect OneSignal for real push delivery
- [ ] Wire community to Supabase Realtime
- [ ] Expand breed data from 51 to 200+ breeds in `src/data/breeds.json`
- [ ] Build breed pages on Lander (`src/pages/breeds/[slug].tsx`) - sitemap URLs already set up
- [ ] Add breed comparison (PRD-12)
- [ ] Add health PDF export (PRD-05)
- [ ] Create Android keystore + update assetlinks.json SHA256 fingerprint
- [ ] Wire RevenueCat entitlements to `useSubscription()` hook (replace dev mock)

---

## 21. QA Report (Overnight PRs - March 9, 2026)

*Updated QA status after overnight fixes. All items from v9 report addressed.*

### Status After Overnight PRs

| Item | Status | Notes |
|------|--------|-------|
| OB-01 | Verified | BuddyAvatar thinking PNG correct in SCAN state |
| OB-02 | Verified | Plan-preview CTA wired to paywall |
| OB-03 | Verified | Paywall graceful Alert fallback |
| HOME-01 | FIXED (PR #56) | gbsDelta null guard added |
| HOME-02 | Verified | dogStore.switchDog correct |
| CHAT-01 | FIXED (PR #57) | useHydration includes chatStore |
| CHAT-02 | FIXED (PR #57) | Per-user session isolation |
| CHAT-03 | Verified | No JSX comment crash risk |
| CHAT-04 | FIXED (PR #57) | Summarize console.log added |
| CHAT-05 | FIXED (PR #57) | React.memo on BuddyAvatar |
| PLAN-01 | Verified | Week nav lock/unlock correct |
| PLAN-02 | FIXED (PR #56) | rateExercise() debug log added |
| PLAN-03 | Verified | No camera in exercise detail |
| HEALTH-01 | FIXED (PR #59) | Real breed range comparison |
| HEALTH-02 | FIXED (PR #59) | Empty result handling |
| HEALTH-03 | FIXED (PR #59) | DOB milestone log added |
| TRICKS-01/02/03 | Verified | All correct |
| PROFILE-01 | FIXED (PR #59) | Alert fallback for photo upload |
| PROFILE-02 | FIXED (PR #59) | isAuthLoading guard |
| COMM-01/02 | Verified | Demo posts correct |
| SET-01 | FIXED (PR #60) | supabase.auth.signOut on deletion |
| SET-02 | FIXED (PR #60) | OneSignal note added |
| SET-03 | Verified | Coming soon toast correct |
| VIS-01 | Verified | Splash icon exists (Buddy illustration) |
| VIS-02 | Verified | BuddyIcon no JSX comments |
| VIS-03 | FIXED (PR #58) | Brand app icon replaces default Expo icon |
| VIS-04 | Verified | Reanimated 4 only, no Moti |
| EDGE-01 | Verified | Zero-dog guard in place |
| EDGE-02 | Verified | Mixed breed fallback |
| EDGE-03 | Verified | 503 error state |

### Remaining Items Needing Device Testing
- **CHAT-01** - Counter fix needs verification on physical device with clean install
- **Hybrid breed detection** - Needs end-to-end testing after breed-classify is deployed
- **Deep links** - Universal Links require signed build (cannot test in Expo Go or dev build)

---

## 22. Competitive Landscape

| App | Price | Key Differentiator | Gap vs PupPal |
|-----|-------|-------------------|---------------|
| Dogo | $60-80/yr | Video lessons | No AI, generic plans |
| Puppr | $99.99/yr | Step-by-step with cues | No health, no AI |
| Woofz | ~$60/yr | Clicker training | No health, generic |
| Zigzag | $49.99/yr | Age-based program | No AI chat, UK-focused |
| GoodPup | $34/week | Live trainer calls | Expensive, no 24/7 |
| Pupford | $9.99/mo | Video library | No personalization |
| **PupPal** | **$39.99/yr** | **AI mentor + health + gamification** | **v1 launch** |

PupPal is 41% cheaper than market average with the only AI-powered mentor + health tracking combo.

---

## 23. App Store Launch Kit Summary

- **Bundle ID:** com.puppal.app
- **App Name:** PupPal - AI Puppy Training
- **Subtitle:** Train Smarter with Your AI Mentor
- **Category:** Lifestyle
- **Sub-category:** Pets
- **Price:** Free (with IAP)
- **Age Rating:** 4+
- **Privacy URL:** https://puppal.dog/privacy
- **Terms URL:** https://puppal.dog/terms
- **Support:** support@puppal.dog
- **Apple Developer:** Enrolled as Organization, enrollment ID 5J4UG739H5, pending approval
- **TestFlight:** Not yet submitted (pending Apple Developer approval + RevenueCat + Apple Sign-In)
- **EAS Config:** `eas.json` added (PR #54). Run `eas build --platform ios --profile production` when ready.
- **App Store Docs:** `docs/app-store-metadata.md`, `docs/screenshot-spec.md`, `docs/submission-checklist.md` (all in PR #54)

---

## 24. Git Configuration

- **App repo:** `https://github.com/changocircle/PupPal-app`
- **Lander repo:** `https://github.com/changocircle/PupPal-Lander`
- **Main branch:** `main`
- **Branch naming:** `feat/`, `fix/`, `refactor/`
- **Never push directly to main** - always use PRs

---

*End of Brain Dump v10. Generated March 8-9, 2026 after overnight session. 53 app PRs merged, 8 open. 3 lander PRs merged, 3 open.*
