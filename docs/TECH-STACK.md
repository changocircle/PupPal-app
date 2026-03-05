# PupPal — Tech Stack Deep Dive

**Why these choices, what they replace, and how they scale.**

---

## Mobile Framework: React Native + Expo SDK 52

### Why Not Swift/SwiftUI (iOS Native)?
SwiftUI would give the absolute best iOS performance and access to latest Apple APIs. But: no Android path without full rewrite, Claude Code generates significantly better TypeScript than Swift, and the third-party SDK ecosystem (RevenueCat, Superwall, OneSignal, PostHog) has more mature React Native integrations than pure Swift packages. For a solo dev using AI-assisted coding, TypeScript wins on velocity.

### Why Not Flutter?
Flutter has great performance and a beautiful widget system. But: Dart is a less common language that Claude Code handles less reliably than TypeScript, the RevenueCat and Superwall SDKs have less mature Flutter support, and the JavaScript/TypeScript ecosystem for web-adjacent tools (Vercel AI SDK, TanStack Query, Zustand) doesn't exist in Dart. You'd be rebuilding abstractions that already exist in the RN ecosystem.

### Why Expo Specifically?
Expo SDK 52+ is not the "training wheels" Expo from 2020. It's now the recommended way to build React Native apps even by the React Native team. What Expo gives you: EAS Build (cloud builds without local Xcode), EAS Submit (automated store submission), EAS Update (OTA JS updates without App Store review), Expo Router (file-based navigation), Expo Image (optimized image loading with caching), Expo Camera/ImagePicker (photo upload), Expo Notifications (local notifications), and Expo SecureStore (secure token storage). All of this would take weeks to configure manually in bare React Native.

### Managed vs Bare Workflow
Start with managed workflow. Only eject if you hit a native module that Expo doesn't support (unlikely for PupPal's feature set). RevenueCat, Superwall, OneSignal all have Expo config plugins that work in managed workflow.

---

## Routing: Expo Router v4

File-based routing modeled after Next.js. Routes map directly to files in the `app/` directory. This means:
- Navigation structure is visible in the file tree
- Deep linking works automatically (important for influencer referral links and push notification deep links)
- Type-safe route parameters
- Layout nesting (shared layouts for tab groups, onboarding flow, etc.)
- Automatic code splitting

The onboarding flow uses a route group `(onboarding)/` with its own layout (no tab bar, custom back navigation). The main app uses `(tabs)/` with bottom tab navigation.

---

## Styling: NativeWind v4

NativeWind brings Tailwind CSS to React Native. Why this over StyleSheet.create:
- Claude Code generates excellent Tailwind — it knows the utility classes deeply
- Consistent with web Tailwind mental model (if you ever build a web version)
- Responsive design with breakpoint prefixes
- Dark mode support built in
- Design tokens map directly to Tailwind config (colors, spacing, typography)
- Faster iteration than writing StyleSheet objects

NativeWind v4 specifically uses the Tailwind CSS compiler, meaning it supports arbitrary values (`text-[#FF6B5C]`), custom plugins, and proper CSS variable support.

### Theme Configuration
All design tokens from DESIGN-SYSTEM.md map into `tailwind.config.js`:
```js
// Colors: bg-primary, text-secondary, border-border, etc.
// Spacing: p-4 (16px), m-6 (24px), gap-3 (12px)
// Typography: text-display, text-body, font-brand-bold
// Radius: rounded-card (12px), rounded-button (8px)
```

---

## State Management: Zustand + TanStack Query v5

### Why Two Systems?
Client state and server state are fundamentally different. Mixing them (like old Redux patterns) creates complexity.

**Zustand** handles client-only state: current onboarding step, UI toggles, active dog selection, chat input text, animation states. It's 1KB, has no boilerplate, and works with React Native out of the box. No providers, no context, just plain stores.

**TanStack Query v5** handles server state: dog profiles, training plans, exercise data, health records, chat history, gamification stats. It gives you: automatic caching and refetching, optimistic updates (show XP immediately, confirm server-side), offline mutation queuing (complete exercise offline, sync later), background refetching (stale data auto-refreshes), pagination and infinite scroll support, and retry logic with exponential backoff.

### TanStack Query Offline Persistence
Use `@tanstack/query-async-storage-persister` + `expo-secure-store` to persist the query cache to device storage. This means: Today's Training loads instantly from cache on app open (then refreshes in background), exercise content available offline after first load, health dashboard shows cached data immediately.

### Data Flow Example
```
User taps "Mark Complete" on exercise
  → Component calls mutate() via TanStack Query useMutation
  → Optimistic update: UI shows complete immediately (+15 XP animation)
  → Mutation sends to Supabase (exercise_completions insert)
  → Supabase trigger fires Edge Function: check-achievements
  → Edge Function returns: { xp_earned, achievements_unlocked, score_update }
  → TanStack Query invalidates: ['gamification', dogId], ['plan', planId]
  → Cache refreshes with server-confirmed data
  → If offline: mutation queued, synced on reconnect
```

---

## Backend: Supabase

### Why Not Custom Node/Express?
You could build a Node/Express API with Postgres. But for a solo dev on a 10-week timeline, that means: setting up a server, configuring Postgres, writing auth middleware, building file upload handling, setting up WebSocket infrastructure, writing database migrations by hand, configuring CORS, setting up deployment. Supabase gives you all of this on Day 1 with a generous free tier.

### What Supabase Provides
- **Postgres database**: Full SQL, indexes, triggers, functions. Not a toy database.
- **Auth**: Apple Sign-In + Google Sign-In with 3 lines of client code. JWT tokens, session management, refresh tokens all handled.
- **Row Level Security (RLS)**: Database-level access control. Users can ONLY read/write their own data. Not application-level checks — Postgres enforces it. This is critical for data isolation.
- **Storage**: S3-compatible object storage for dog photos, vet record images. Private buckets with RLS policies.
- **Edge Functions**: Deno/TypeScript serverless functions for compute (AI proxy, plan generation, score calculation). Deploy with `supabase functions deploy`.
- **Realtime**: WebSocket subscriptions for live updates (not critical for v1 but useful for future community features).
- **Database Webhooks**: Trigger Edge Functions on database events (e.g., exercise inserted → recalculate score).

### Row Level Security Pattern
Every table has RLS policies ensuring users only access their own data:
```sql
-- Users can only read their own dogs
CREATE POLICY "Users read own dogs" ON dogs
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert for themselves
CREATE POLICY "Users insert own dogs" ON dogs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Edge Functions for Compute
Heavy logic runs in Edge Functions, not client-side:
- `chat`: Proxies to Kimi K2.5 API with system prompt injection. Streams response back to client. Never exposes API key to client.
- `generate-plan`: Takes dog profile, runs plan generation algorithm, writes plan to database.
- `calculate-score`: Takes dog_id, recalculates Good Boy Score from all exercise completions.
- `check-achievements`: Takes user_id + event, evaluates all achievement triggers, inserts any new unlocks.
- `breed-detect`: Proxies photo to Google Cloud Vision, returns breed classification.
- `streak-cron`: Scheduled function (runs at multiple times to cover all timezones), evaluates streaks.
- `export-health`: Generates PDF health record from dog's health data.

### Scaling Path
Supabase Pro plan ($25/month) handles up to ~100K users easily. Beyond that: Supabase scales Postgres vertically (larger instance) or you migrate to self-hosted Supabase on your own infrastructure. The code doesn't change — just the connection string.

---

## AI Chat: Vercel AI SDK + Kimi K2.5

### Why Vercel AI SDK?
The Vercel AI SDK is the most modern way to build AI chat interfaces. It provides:
- **Provider-agnostic**: Same code works with Kimi, Anthropic Claude, OpenAI, Mistral, etc. Swap provider by changing one import.
- **Streaming built-in**: SSE streaming with React hooks (`useChat`) that handle token-by-token rendering.
- **React Native compatible**: Works with the `fetch`-based approach in React Native.
- **Tool calling support**: If you want Buddy to take actions (log exercise, check score) in the future.

### Provider Abstraction
```ts
// Switch from Kimi to Claude by changing one line:
import { createKimi } from '@ai-sdk/kimi';     // primary
// import { createAnthropic } from '@ai-sdk/anthropic'; // backup

const model = createKimi('kimi-k2.5');
```

### Chat Architecture
Client sends message → Edge Function receives → Edge Function constructs system prompt by fetching dog context, conversation summaries, and plan status from Supabase → Edge Function calls Kimi with full context → Kimi streams response → Edge Function streams to client via SSE → Client renders tokens progressively → Edge Function stores message + response in database after stream completes.

### Cost Management
Kimi K2.5 is chosen for cost efficiency. At scale: monitor cost per message (target <$0.01), set up alerts if cost spikes, keep provider abstraction so you can switch. Run 1% of traffic through Claude or GPT quarterly to compare quality.

---

## Payments: RevenueCat + Superwall

### RevenueCat
RevenueCat abstracts Apple and Google's IAP APIs. Without it, you're writing hundreds of lines of StoreKit 2 (Apple) and Google Play Billing code, handling receipt validation, managing subscription states, dealing with grace periods, billing retries, family sharing, and cross-platform subscription sync. RevenueCat handles all of this.

Key RevenueCat concepts for PupPal:
- **Products**: `puppal_monthly`, `puppal_annual`, `puppal_lifetime` (configured in App Store Connect + Google Play Console)
- **Entitlement**: `premium` — one entitlement that unlocks everything
- **Trial**: Configured on the product in App Store Connect (3-day free trial on annual)
- **Checking access**: `const { customerInfo } = await Purchases.getCustomerInfo(); const isPremium = customerInfo.entitlements.active['premium'] !== undefined;`
- **Webhooks**: RevenueCat sends webhooks to Supabase Edge Function on subscription events (new, renewal, cancellation, expiration). Edge Function updates `users.subscription_status` in database.

### Superwall
Superwall lets you change the paywall UI, pricing, copy, and A/B tests WITHOUT an app update. The paywall is essentially a remote config that renders natively. This means you can:
- Change pricing from $39.99 to $49.99 to test revenue impact — no App Store review
- Run 5 paywall variants simultaneously
- Change CTA copy from "Start Free Trial" to "Begin [Name]'s Journey"
- Add/remove lifetime plan
- Show different paywalls to different user segments

Superwall registers paywalls that trigger on events: `onboarding_complete`, `feature_gate_hit`, `streak_milestone`. When triggered, Superwall decides which paywall variant to show based on the user's test group.

---

## Analytics: PostHog

### Why Not Mixpanel or Amplitude?
PostHog is the modern choice for several reasons: feature flags built-in (replaces LaunchDarkly/Statsig, one fewer tool), session replay for debugging (see exactly what the user saw before a bug report), funnels, retention, paths all included, generous free tier (1M events/month), self-hostable if needed later, and the API is clean and modern.

### Feature Flags
PostHog feature flags replace the need for a separate feature flag service:
- Gate features during development (`if (posthog.isFeatureEnabled('health-tracker'))`)
- Gradual rollout (10% → 50% → 100%)
- A/B testing non-paywall experiments (challenge tile count, Buddy reaction variants)

### Key Dashboards to Build
1. Onboarding funnel (screen-by-screen drop-off)
2. Trial conversion (paywall → trial → paid)
3. Daily engagement (DAU, exercises completed, chat sessions)
4. Gamification (streak distribution, achievement unlocks, GBS progression)
5. Health tracker usage (events logged, reminders actioned)
6. Revenue (MRR, plan mix, churn rate — supplement with RevenueCat dashboard)

---

## Push Notifications: OneSignal

### Why Not Just Expo Notifications?
Expo Notifications handles the basics (sending a push). OneSignal adds: user segmentation (send to "premium users who haven't trained in 3 days"), automation journeys (trial onboarding sequence without code changes), in-app messaging (banners, modals without app update), A/B testing notification copy, delivery optimization (send at best time per user), and an analytics dashboard showing open rates and conversion.

### Notification Categories for PupPal
- Training reminders (morning, evening if not completed)
- Streak alerts (at risk, broken, milestone)
- Gamification (achievement, level-up, challenge)
- Health reminders (vaccination, medication, weigh-in)
- Buddy (proactive tips, check-ins)
- Marketing (win-back, feature announcements)

Each category is independently toggleable by the user in settings.

---

## Animations: React Native Reanimated 3 + Moti

### Why Reanimated?
Reanimated runs animations on the native UI thread, not the JS thread. This means 60fps animations even during heavy JS computation. Critical for: XP counter float-up animation during API call, confetti on achievement unlock while saving to database, smooth scroll in chat while streaming AI response, onboarding screen transitions.

### Why Moti?
Moti is a declarative animation API built on top of Reanimated. Instead of writing imperative animation code, you describe target states:
```tsx
<MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }}>
  <BuddyBubble text="Hey there!" />
</MotiView>
```
This makes Claude Code's job much easier — declarative animations are simpler to generate than imperative Animated.Value sequences.

---

## Database Schema Overview

Complete schemas are defined in each PRD. Here's the high-level entity map:

```
users
  ├── dogs (1:many)
  │   ├── training_plans (1:1 active)
  │   │   ├── plan_weeks (1:many)
  │   │   │   ├── plan_days (1:many)
  │   │   │   │   └── plan_exercises (1:many)
  │   │   └── plan_adaptations (1:many)
  │   ├── exercise_completions (1:many)
  │   ├── chat_sessions (1:many)
  │   │   ├── chat_messages (1:many)
  │   │   └── conversation_summaries (1:1)
  │   ├── user_gamification (1:1)
  │   ├── user_streaks (1:1)
  │   ├── xp_events (1:many)
  │   ├── user_achievements (1:many)
  │   ├── user_challenges (1:many)
  │   ├── scheduled_vaccinations (1:many)
  │   ├── medications (1:many)
  │   │   └── medication_events (1:many)
  │   ├── weight_entries (1:many)
  │   ├── vet_visits (1:many)
  │   ├── user_milestones (1:many)
  │   └── health_notes (1:many)
  └── vet_contacts (1:many)

-- Reference tables (not user-owned):
exercises                  -- exercise content library
achievements               -- achievement definitions
weekly_challenges           -- challenge pool
breed_profiles             -- breed traits + health
breed_growth_data          -- weight curves
developmental_milestones   -- milestone templates
level_definitions          -- XP thresholds per level
vaccination_templates      -- AAHA vaccine schedules
```

### Migration Strategy
Sequential numbered migrations in `supabase/migrations/`. Each migration is idempotent. Run via `supabase db push` (dev) or `supabase db migrate` (prod). Never edit a deployed migration — always create a new one.

---

## Development Workflow

### Local Development
1. `npx expo start` — starts Expo dev server
2. `supabase start` — starts local Supabase (Postgres, Auth, Storage, Edge Functions)
3. Expo Go app on phone for testing (or iOS Simulator)
4. Supabase Studio at `localhost:54323` for database inspection

### Claude Code Workflow
1. Update `Current Sprint` section in CLAUDE.md before each session
2. Point Claude Code to the relevant PRD: "Read docs/PRD-01-Onboarding.md"
3. Build one screen or feature at a time
4. Test in Expo Go before moving to next
5. Commit after each working feature

### Build & Deploy
1. `eas build --platform ios` — cloud build for iOS
2. `eas submit --platform ios` — submit to App Store / TestFlight
3. `eas update` — OTA JavaScript update (no App Store review needed)
4. `supabase functions deploy` — deploy Edge Functions
5. `supabase db push` — apply database migrations

### Environment Management
- Local: Supabase local instance + Expo dev
- Staging: Supabase project (staging) + TestFlight
- Production: Supabase project (prod) + App Store

---

## Scaling Considerations

### 10K Users
- Supabase free/pro tier handles this easily
- Single Postgres instance is fine
- Edge Functions handle burst with cold starts < 200ms
- Kimi API costs: ~$50-100/month at this scale

### 100K Users
- Supabase Pro ($25/month) with larger instance
- Add database indexes on hot queries (user_id + created_at patterns)
- Consider read replicas for analytics queries
- Kimi costs: ~$500-1000/month
- RevenueCat and OneSignal costs scale linearly

### 1M Users
- Supabase Enterprise or self-hosted
- Database partitioning for chat_messages and xp_events tables
- CDN for exercise content (move from DB to static content)
- Multi-region Edge Functions
- Negotiate volume pricing with AI provider
- Consider dedicated AI inference (self-hosted model)
