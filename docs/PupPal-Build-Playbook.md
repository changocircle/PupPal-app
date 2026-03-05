# PupPal — Build Playbook

## Step-by-Step Development Guide for Claude Code

**This document tells you exactly what to build, in what order, and what to say to Claude Code at each step.** Follow it sequentially. Each step builds on the last.

---

## Before You Start (Week 0 Checklist)

### Accounts to Create
- [ ] **Apple Developer Account** ($99/year) — required for App Store, TestFlight, Apple Sign-In
- [ ] **Supabase** — create project at supabase.com (free tier)
- [ ] **RevenueCat** — create account at revenuecat.com (free until $2.5K MRR)
- [ ] **Superwall** — create account at superwall.com (free tier available)
- [ ] **PostHog** — create account at posthog.com (generous free tier)
- [ ] **OneSignal** — create account at onesignal.com (free tier)
- [ ] **Kimi/Moonshot** — get API key for AI chat
- [ ] **Google Cloud** — for Vision API (breed detection)
- [ ] **Expo** — create account at expo.dev (free, needed for EAS)
- [ ] **Sentry** — create account at sentry.io (free tier)

### Buddy Character
Before Week 1, you need Buddy's character illustrations. Options:
1. **Midjourney/DALL-E**: Generate base character, refine in Figma
2. **Fiverr illustrator**: $300-800 for 8 expression set
3. **Placeholder**: Use emoji/simple SVG circles for dev, replace before TestFlight

Minimum for development: 1 default Buddy face (use for everything initially, add expressions later).

### Content Preparation (Parallel Track)
While you build, someone (you or AI-assisted) needs to write:
- 60-80 exercise descriptions for Phase 2 (see PRD-03 content template)
- 30-40 trick descriptions for Phase 6 (see PRD-03 Section 6)
- 50 breed profiles (see PRD-12 data model)
- Achievement definitions and copy
- Buddy system prompt refinement

---

## Phase 1: Foundation + Onboarding (Week 1-2)

### Step 1.1: Project Scaffold

**Tell Claude Code:**
> "Read CLAUDE.md and TECH-STACK.md. Initialize a new Expo project with TypeScript, Expo Router v4, NativeWind v4, and the following dependencies: zustand, @tanstack/react-query, react-hook-form, zod, react-native-reanimated, moti, expo-image, expo-secure-store. Set up the project structure from CLAUDE.md. Create the tailwind.config.js with the design tokens from DESIGN-SYSTEM.md."

**Expected output:**
- Working Expo project
- `app/` folder with route groups: `(onboarding)/`, `(tabs)/`
- `src/` folder with hooks, stores, services, lib, types, constants
- NativeWind configured with PupPal theme colors, typography, spacing
- TanStack Query provider in root layout
- TypeScript strict mode

**Verify:** `npx expo start` opens with no errors.

### Step 1.2: Design System Primitives

**Tell Claude Code:**
> "Read DESIGN-SYSTEM.md. Build the core UI component library in src/components/ui/: Button (primary, secondary, ghost variants with pressed states), Card (default and featured), Typography (display, h1, h2, h3, body variants using Plus Jakarta Sans), Badge (success, warning, error, info, neutral), ProgressBar (animated fill), and a basic Input component. Follow the exact specs from DESIGN-SYSTEM.md for colors, spacing, radius, and shadows."

**Expected output:**
- Reusable components with NativeWind styling
- Plus Jakarta Sans loaded via expo-google-fonts
- All color tokens from design system
- Components match the visual specs

**Verify:** Create a test screen that renders all components.

### Step 1.3: Supabase Setup

**Tell Claude Code:**
> "Set up Supabase client in src/services/supabase.ts. Create the first database migration in supabase/migrations/001_users_and_dogs.sql with tables for: users (extends Supabase auth.users with display_name, photo_url, subscription fields from PRD-06 and PRD-14), dogs (all fields from PRD-11 data model). Add Row Level Security policies so users can only access their own data. Generate TypeScript types."

**Expected output:**
- `src/services/supabase.ts` with typed client
- Migration file with users and dogs tables
- RLS policies
- Generated types in `src/types/database.ts`

**Verify:** `supabase db push` applies migration. Supabase Studio shows tables.

### Step 1.4: Auth (Apple Sign-In)

**Tell Claude Code:**
> "Read PRD-01 for the auth flow. Implement Apple Sign-In using Supabase Auth. Create useAuth hook in src/hooks/useAuth.ts that handles: signInWithApple, signOut, getCurrentUser, onAuthStateChange. Create an auth gate in the root layout that redirects to onboarding if not authenticated and to (tabs) if authenticated. Store auth state in authStore (Zustand)."

**Expected output:**
- Apple Sign-In working (requires Apple Developer setup)
- Auth state persisted across app restarts
- Route protection (unauthenticated → onboarding, authenticated → tabs)
- useAuth hook with clean API

**Verify:** Can sign in with Apple, close app, reopen, still signed in.

### Step 1.5: Onboarding Flow (Screens 1-6)

**Tell Claude Code:**
> "Read PRD-01 Onboarding and DESIGN-SYSTEM.md onboarding wireframes. Build the onboarding flow in app/(onboarding)/. Screen 1: Meet Buddy (Buddy waving, intro bubbles with typing delay animation, 'Let's Go' CTA). Screen 2: Dog name (Buddy bubble, text input, auto-focus keyboard). Screen 3: Photo upload (camera/library picker, placeholder for breed detection, skip option). Screen 4: Dog age (birthday picker or 'I don't know' with age range selector). Screen 5: Challenges (multi-select grid of 8 challenges per PRD-01). Screen 6: Experience level (3 options: first_time, experienced, advanced). Store all onboarding data in onboardingStore (Zustand). Each screen has back navigation and animated transitions."

**Expected output:**
- 6 working screens with correct visual design
- Buddy chat bubble UI with typing delay (Moti animation)
- Photo picker working (Expo ImagePicker)
- Challenge selection grid with selected state
- Data persisted in Zustand store across screens

**Verify:** Can flow through all 6 screens. Data persists if you go back.

### Step 1.6: Onboarding Screen 7 (Plan Preview)

**Tell Claude Code:**
> "Read PRD-01 Screen 7 and PRD-03 plan structure. Build the plan preview screen. For now, create a STATIC plan preview based on the onboarding data (no plan generation algorithm yet). Show: dog photo + name + breed header, 3-4 week summaries based on selected challenges, a GBS preview (0 → target), and health timeline preview. Use the featured card style from DESIGN-SYSTEM.md. Add a loading animation before showing the preview (Buddy thinking expression, 3 sequential text lines fading in per DESIGN-SYSTEM.md animation specs)."

**Expected output:**
- Plan loading animation (2-3 seconds with Buddy + text lines)
- Static plan preview card with dog personalization
- Looks like a real plan even though it's template-based for now

### Step 1.7: Onboarding Screen 8 (Paywall) + RevenueCat + Superwall

**Tell Claude Code:**
> "Read PRD-06 paywall design specs and PRD-01 Screen 8. Integrate RevenueCat SDK (react-native-purchases) and Superwall SDK (@superwall/react-native-superwall). Initialize both in the app root. For the paywall, set up Superwall to trigger on 'onboarding_complete' event. Create a FALLBACK native paywall screen in app/(onboarding)/paywall.tsx matching the design from PRD-06 Section 4 (annual/monthly cards, trial timeline, feature list, reassurance text). Wire RevenueCat purchase flow. Create useSubscription hook per PRD-06 Section 2."

**Note:** You'll need to configure products in App Store Connect first. For development, use RevenueCat sandbox.

**Expected output:**
- RevenueCat SDK initialized
- Superwall configured with onboarding_complete trigger
- Fallback paywall screen matching design spec
- useSubscription hook returning isPremium, isTrialing
- Purchase flow works in sandbox

### Step 1.8: Save Dog + Complete Onboarding

**Tell Claude Code:**
> "Complete the onboarding flow. After paywall (whether they subscribe or skip), save the dog profile to Supabase (dogs table) using the data from onboardingStore. Create the user profile row if it doesn't exist. Set the dog as active. Navigate to the (tabs) home screen. Clear onboarding store."

**Expected output:**
- Dog saved to database with all onboarding data
- User navigated to main app
- Can see dog data on home screen

---

## Phase 2: Training Plan Engine (Week 3-4)

### Step 2.1: Database — Exercises and Plans

**Tell Claude Code:**
> "Read PRD-03 data models. Create migration 003_training_plans.sql with tables: training_plans, plan_weeks, plan_days, plan_exercises. Create migration 004_exercises.sql with: exercises table (all fields from PRD-03 Exercise model including is_trick and trick fields), exercise_completions, trick_packs, user_trick_pack_progress, trick_progress. Add RLS policies. Create migration for breed_profiles table with the BreedProfile schema from PRD-03 Section 4. Generate types."

### Step 2.2: Seed Data — Exercises and Breeds

**Tell Claude Code:**
> "Create seed files in supabase/seed/. Create exercises.sql with 10-15 seed exercises per category (potty_training, bite_inhibition, basic_commands, leash_skills, crate_training, socialization) — use the content template format from PRD-03 Section 5. Create breeds.sql with 5 starter breed profiles (Golden Retriever, French Bulldog, Labrador, German Shepherd, Pomeranian + Mixed Breed default) with all BreedProfile fields populated. Create trick_packs.sql with Pack 1 (Starter Tricks: Shake, High Five, Spin, Touch, Take a Bow)."

**Note:** Start with 60-80 exercises. You'll add more before launch.

### Step 2.3: Plan Generation Algorithm

**Tell Claude Code:**
> "Read PRD-03 Section 4 (Plan Generation Algorithm). Implement the plan generation algorithm in a Supabase Edge Function supabase/functions/generate-plan/. The function takes a dog profile (breed, age_weeks, challenges, experience_level), queries the breed profile and exercise library, and generates a 12-week plan following the algorithm: determine developmental stage, build priority queue from challenges, apply breed modifiers, assemble weekly plan (2-3 exercises/day, 5-7 days/week with reviews and bonus trick slots starting Week 4), generate week summaries and milestones. Write the complete plan to training_plans, plan_weeks, plan_days, plan_exercises tables. Return the plan summary."

### Step 2.4: Wire Plan Generation to Onboarding

**Tell Claude Code:**
> "Update the onboarding completion flow to call the generate-plan Edge Function after saving the dog profile. Replace the static plan preview (Step 1.6) with a real preview based on the generated plan. Show actual week themes and exercise counts from the generated plan."

### Step 2.5: Today's Training Home Screen

**Tell Claude Code:**
> "Read PRD-03 Section 7 and DESIGN-SYSTEM.md home screen wireframe. Build the home screen in app/(tabs)/index.tsx. Show: greeting header with dog photo/name/week/day, gamification row (placeholder for now — streak flame, GBS gauge, XP bar), Today's Training card with exercise list (status icon, category tag, title, time), This Week progress bar, Weekly Challenge card (placeholder). Create usePlan hook that fetches today's exercises via TanStack Query. Each exercise row is tappable."

### Step 2.6: Exercise Detail + Completion

**Tell Claude Code:**
> "Read PRD-03 Section 7 completion flow. Build exercise detail screen in app/exercise/[id].tsx. Show: title, category, difficulty (paw icons), time, supplies needed. Scrollable step-by-step instructions with personalized tokens ({dog_name}, {breed_tip}). Timer component (optional start). Bottom actions: 'Mark Complete' (primary), 'Need More Practice', 'Skip'. On Mark Complete: save to exercise_completions, show celebration animation (confetti, XP float-up per DESIGN-SYSTEM.md), optional 1-5 star rating, navigate back to home with updated status."

### Step 2.7: Free/Premium Gating Foundation

**Tell Claude Code:**
> "Read PRD-07. Build the PremiumGate component in src/components/ui/PremiumGate.tsx and useFeatureGate hook in src/hooks/useFeatureGate.ts, exactly as specified in PRD-07 Section 4. Implement the gate for Week 2+ exercises: free users see Week 1 fully, Week 2+ shows exercise title/time/difficulty with locked content and upgrade CTA. Wire the Superwall trigger 'feature_gate_week2'. Implement gate frequency throttling (1 paywall per session, 4-hour cooldown per PRD-07 Section 4)."

---

## Phase 3: AI Mentor Chat (Week 5-6)

### Step 3.1: Chat Database

**Tell Claude Code:**
> "Read PRD-02 data models. Create migration 005_chat.sql with: chat_sessions, chat_messages, conversation_summaries. Add daily_message_counts table from PRD-07 Section 5. RLS policies. Generate types."

### Step 3.2: Chat Edge Function (AI Proxy)

**Tell Claude Code:**
> "Read PRD-02 Sections 3-5. Build the chat Edge Function in supabase/functions/chat/. It receives: user message, dog_id, session_id. It: fetches dog profile + current plan + recent completions + health events from database, constructs the system prompt with Buddy's personality (PRD-02 Section 3) and dynamic context injection (PRD-02 Section 4), calls Kimi K2.5 API via Vercel AI SDK with streaming enabled, streams the response back to the client via SSE, after stream completes: saves both user message and assistant response to chat_messages. Include safety escalation keyword detection per PRD-02."

### Step 3.3: Chat UI

**Tell Claude Code:**
> "Read PRD-02 and DESIGN-SYSTEM.md chat screen wireframe. Build the chat screen in app/(tabs)/chat.tsx. Implement: message list (FlatList, inverted), Buddy message bubbles (left, white, shadow, Buddy avatar) and user message bubbles (right, coral), typing indicator (3 animated dots per DESIGN-SYSTEM.md), streaming text rendering (tokens appear progressively), input bar with text input + send button, suggested prompts (horizontally scrollable pills above input), photo input button (premium only). Create useChat hook wrapping the Edge Function call with streaming."

### Step 3.4: Chat Gating

**Tell Claude Code:**
> "Implement the 3 messages/day limit for free users per PRD-07 Section 5. Show message counter in chat header ('2/3 messages today'). After 3rd message: Buddy responds normally, then inline upgrade card appears in chat. Wire Superwall trigger 'feature_gate_chat'. Counter resets at midnight user timezone."

### Step 3.5: Conversation Memory

**Tell Claude Code:**
> "Read PRD-02 memory strategy. Implement conversation memory: within-session (full message history sent to API), cross-session (after session ends, generate summary via separate Edge Function call using generate-summary/, store in conversation_summaries, inject last 2-3 summaries into system prompt for next session). Maximum context window management: trim old messages when approaching token limit."

---

## Phase 4: Gamification (Week 7-8)

### Step 4.1: Gamification Database

**Tell Claude Code:**
> "Read PRD-04 data models. Create migration 006_gamification.sql with: user_gamification (xp, level, good_boy_score per dog), user_streaks (current_streak, longest_streak, freeze count per dog), xp_events (log of all XP earned), user_achievements (unlocked achievements per dog), user_challenges (weekly challenge progress), level_definitions (XP thresholds). Seed: level_definitions (10 levels), achievement definitions (~25 initial from PRD-04). RLS. Types."

### Step 4.2: XP System

**Tell Claude Code:**
> "Read PRD-04 XP section. Wire exercise completions to earn XP. On exercise_completion insert: call check-achievements Edge Function, create xp_event, update user_gamification.total_xp and daily_xp. Implement the XP float-up animation component ('+15 XP' in gold, float up 40px over 600ms with fade). Show daily XP progress bar on home screen."

### Step 4.3: Streak System

**Tell Claude Code:**
> "Read PRD-04 streak mechanics. Build streak-cron Edge Function that runs on a schedule (Supabase pg_cron) to evaluate streaks at multiple times (covering timezones). Logic: if user completed any exercise today → increment streak. If not and streak > 0 → check for freeze → use freeze or break streak. Implement streak flame component per DESIGN-SYSTEM.md (size scales with length, color escalation, pulse animation). Show on home screen."

### Step 4.4: Good Boy Score

**Tell Claude Code:**
> "Read PRD-04 GBS section. Build calculate-score Edge Function. GBS is a composite 0-100 score from 5 weighted dimensions: Training Consistency (30%), Skill Mastery (25%), Engagement (20%), Health Compliance (15%), Socialization (10%). Each dimension calculated from relevant data (exercise completions, ratings, streaks, health events). Build the circular ScoreGauge component per DESIGN-SYSTEM.md (120px, color gradient, animated fill, center number). Show on home screen."

### Step 4.5: Achievements

**Tell Claude Code:**
> "Read PRD-04 achievements section. Build check-achievements Edge Function. Called after every exercise completion, streak update, and score change. Evaluates all achievement trigger conditions against user's stats. If new achievement unlocked: insert into user_achievements, return to client. Build achievement unlock overlay per DESIGN-SYSTEM.md (full-screen dark overlay, badge scale-in, confetti, Buddy excited, share button). Build achievements grid screen (2-column, unlocked vs locked with progress)."

### Step 4.6: Home Screen Integration

**Tell Claude Code:**
> "Update the home screen to show real gamification data. Replace all placeholders with live data from useGamification hook: streak flame with count, GBS gauge with score, daily XP bar with progress, Today's Training with real exercises. Add weekly challenge card (show current challenge, progress bar, XP reward, days remaining)."

---

## Phase 5: Health + Polish + Launch (Week 9-10)

### Step 5.1: Health Database

**Tell Claude Code:**
> "Read PRD-05 data models. Create migration 007_health.sql with: scheduled_vaccinations, medications, medication_events, weight_entries, vet_visits, vet_contacts, user_milestones, health_notes, health_reminders. Seed vaccination templates (AAHA schedule) and developmental milestones. RLS. Types."

### Step 5.2: Health Dashboard + Vaccinations

**Tell Claude Code:**
> "Read PRD-05 Sections 3-4. Build health dashboard in app/(tabs)/health.tsx. Show: header with quick status badges (vaccinations, next vet, weight), upcoming events card (next 3 chronological), quick actions. Build vaccination tracker: generate personalized schedule from breed + age + AAHA templates on plan creation, timeline view with completed/upcoming/overdue color coding, tap to log vaccination (date, vet, notes, +5 XP)."

### Step 5.3: Weight Tracking + Growth Chart

**Tell Claude Code:**
> "Read PRD-05 weight section. Build weight entry (quick input with lbs/kg toggle). Build weight history chart using Recharts or a React Native chart library. Plot user data points against breed growth curve (25th-75th percentile shaded band from breed_growth_data). Color code: green (in range), yellow (slightly off), red (significantly off). Monthly weigh-in reminders."

### Step 5.4: Push Notifications (OneSignal)

**Tell Claude Code:**
> "Read PRD-09. Integrate OneSignal SDK. Implement the permission request flow: show custom pre-permission screen after first exercise completion (Buddy asks, not system dialog). Set user tags in OneSignal (dog_name, breed, plan_week, streak, score, subscription_status, timezone). Build send-notification Edge Function that handles: template resolution with token replacement, user preference checking, daily cap enforcement, quiet hours. Wire training morning reminder, streak risk alerts (5pm/8pm), and health reminders."

### Step 5.5: Analytics (PostHog)

**Tell Claude Code:**
> "Read PRD-13. Integrate PostHog React Native SDK. Initialize with session replay enabled for 10% of users. Identify user with properties after auth. Instrument key events across the app: onboarding funnel (screen_viewed for each), exercise_completed, chat_message_sent, paywall_presented/dismissed/purchase_completed, streak_updated, achievement_unlocked, gate_encountered. Set up user properties that update on change."

### Step 5.6: Settings Screen

**Tell Claude Code:**
> "Read PRD-14. Build the profile/settings screen in app/(tabs)/profile.tsx per the wireframe. Sections: My Dogs (list with active indicator + add), Account (edit profile, subscription via PRD-06, invite friends via PRD-08 placeholder), Preferences (notifications link, training time, units), Support (help, contact, rate), Legal (privacy, terms, data export/delete), sign out, delete account. Wire subscription management to RevenueCat. Wire data export and account deletion per PRD-14 Section 6."

### Step 5.7: RevenueCat Webhook

**Tell Claude Code:**
> "Read PRD-06 Section 5. Build the revenuecat-webhook Edge Function. Verify HMAC signature. Handle all event types: INITIAL_PURCHASE, RENEWAL, CANCELLATION, BILLING_ISSUE, EXPIRATION, PRODUCT_CHANGE, REFUND. Update user subscription fields in database. Trigger downstream actions (win-back sequence on cancellation, payment notification on billing issue). Log all events to PostHog server-side and to SubscriptionEvent table."

### Step 5.8: Final Polish

**Tell Claude Code (multiple sessions):**
> - "Add skeleton loaders to all screens that fetch data (home, chat, health, plan). No white screens ever."
> - "Add error boundaries and toast notifications for all error states."
> - "Review all animations against DESIGN-SYSTEM.md. Ensure: onboarding typing delays, XP float-up, streak flame pulse, achievement confetti, exercise completion celebration."
> - "Add app icon and splash screen (use Buddy on coral background)."
> - "Run through the complete free user flow: onboarding → Week 1 → hit gates → see previews → upgrade prompts."
> - "Run through the complete premium user flow: onboarding → trial → all features accessible → no gates."

### Step 5.9: TestFlight

**Tell Claude Code:**
> "Configure EAS Build for iOS. Create app.json with correct bundle identifier, version, and all required Expo config plugins (RevenueCat, OneSignal, Sentry). Run eas build --platform ios. Once built, run eas submit --platform ios to upload to TestFlight."

---

## Phase 6: Post-Launch Features (Week 11+)

### Step 6.1: Growth Journal (PRD-10)

> "Read PRD-10. Build the growth journal: timeline screen with chronological entries (manual + auto-generated), filter tabs, photo entry creation with backdating support, auto-entry generation triggers (hook into exercise completion, achievement, streak, health events). Monthly recap generation Edge Function on cron. Throwback 'On This Day' card on home screen."

### Step 6.2: Trick Library (PRD-03 Section 6)

> "Read PRD-03 Section 6. Build the Trick Library as a tab within the Plan screen. Trick pack grid (2 columns, locked/unlocked status). Pack detail with trick list. Trick detail with 3-level progression (Learning/Fluent/Mastered tabs). Trick completion earns XP. Wire trick achievements. Suggested next tricks based on completed prerequisites. Share CTA after trick completion."

### Step 6.3: Multi-Dog (PRD-11)

> "Read PRD-11. Build the dog switcher (bottom sheet from home header). Mini-onboarding flow (5 screens). Per-dog data isolation — verify all queries filter by active dog_id. Dog management in settings (edit, archive, delete)."

### Step 6.4: Breed Encyclopedia (PRD-12)

> "Read PRD-12. Build breed detail screen and breed browser. Seed 50 breed profiles. Link breed content to training, health, and growth features."

### Step 6.5: Referral System (PRD-08)

> "Read PRD-08. Generate unique referral code per user on account creation. Build referral screen in settings (code display, share link, stats). Deep link handling for referral URLs. Share cards include referral link. Referral event tracking and reward granting."

### Step 6.6: Community (PRD-15)

> "Read PRD-15. Feature-flag gated. Build community feed, post creation, comments, likes, reporting. AI pre-moderation Edge Function. Buddy's Take on question posts. Only enable when user base reaches 1,000+ active users."

---

## Testing Checklist Before Each TestFlight

- [ ] Complete onboarding flow (all 8 screens)
- [ ] Plan generates correctly for 3+ different breed/age/challenge combos
- [ ] Today's Training shows and exercises complete with XP/animations
- [ ] Buddy chat works with streaming responses
- [ ] Free user hits gates at all correct points
- [ ] Premium user sees no gates
- [ ] Subscription purchase works in sandbox
- [ ] Streak tracks correctly across days
- [ ] Achievements unlock at correct triggers
- [ ] Health dashboard shows upcoming events
- [ ] Push notifications fire for training and streak
- [ ] Settings: edit profile, manage subscription, sign out all work
- [ ] Offline: Today's Training loads from cache
- [ ] No crashes on rapid navigation
- [ ] No white screens (skeletons everywhere)
- [ ] Animations smooth at 60fps

---

## Content Production Timeline

Run these in parallel with development:

**Week 1-2**: Write 30 exercises (potty, bite inhibition, basic commands)
**Week 3-4**: Write 30 more exercises (leash, crate, socialization, impulse)
**Week 5-6**: Write 20 more exercises (advanced, real world, health habits, mental stim)
**Week 7-8**: Write 15 trick descriptions (Starter + Classic packs)
**Week 9-10**: Write 20 breed profiles, finalize all exercise content, QA review
**Week 11+**: Remaining breed profiles, trick packs 3-6, community guidelines

---

## Key Reminders

1. **One feature at a time.** Don't tell Claude Code to build 3 things at once. Sequential steps.
2. **Test after each step.** Run the app in Expo Go after every major step. Fix bugs before moving on.
3. **Update Current Sprint in CLAUDE.md.** Before each Claude Code session, update what you're building. This keeps context focused.
4. **Point Claude Code to specific PRDs.** "Read docs/PRD-03-Training-Plan.md and build the plan generation algorithm." Don't dump all PRDs at once.
5. **Commit after each working feature.** Git commit with descriptive message. You can always roll back.
6. **Seed data matters.** The app feels real with good seed data. Spend time on exercise descriptions and breed profiles.
7. **Animations are not optional.** They're what makes PupPal feel premium vs. a generic app. Don't skip them "to save time."
8. **Free user experience must be great.** If the free tier feels broken, no one converts. Week 1 should be genuinely valuable.
9. **Buddy is the product.** The AI chat is what makes PupPal different from every other dog training app. Invest extra time in the system prompt and context injection.
10. **Ship imperfect, iterate fast.** v1 doesn't need all 15 PRDs. Core 5 + paywall + gating + notifications + analytics = launchable product. Everything else is v1.1+.
