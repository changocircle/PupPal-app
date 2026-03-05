# PRD #07: Free vs Premium Gating Logic

## PupPal — The Conversion Architecture

**Document version**: 1.0
**Feature owner**: Ashley
**Status**: Draft
**Priority**: P0 — Gating determines conversion rate. Too aggressive = bad reviews, uninstalls. Too generous = no revenue. This balance IS the business.

---

## 1. Overview & Purpose

Gating logic defines exactly what free users can and cannot do, how limits are enforced, and how the upgrade prompt appears. It's the invisible architecture that converts free users into paying subscribers.

The philosophy: **give enough value to create investment, then gate at the moment of highest motivation.**

Free users should:
- Experience the FULL quality of PupPal (not a degraded version)
- Build real progress (streak, XP, Good Boy Score) they don't want to lose
- Hit natural walls where premium unlocks the next step they desperately want
- Never feel tricked or ambushed by a paywall

The free tier is NOT a demo. It's a fully functional Week 1 experience that happens to end right when the user is most hooked.

### Design Principles

1. **Value before gate**: User always experiences the feature's value before being asked to pay. Never gate something they haven't tried.
2. **Soft walls, not hard blocks**: Show what's behind the gate (titles, descriptions, previews). Never show a blank screen with a lock icon.
3. **Personalized gates**: Use the dog's name and progress in every gating message. "[Name]'s Week 2 plan is ready" converts better than "Upgrade to Premium."
4. **One gate per session**: Never show more than one paywall per app session. After dismissing a paywall, don't show another for at least 4 hours.
5. **Celebrate, then gate**: When a gate coincides with a milestone (Week 1 complete, 7-day streak), celebrate first, then present the upgrade as the natural next step.

### Success Metrics

| Metric | Target |
|--------|--------|
| Free to trial conversion | 40-60% of onboarding completions |
| Feature gate conversion | 15-25% of gate impressions |
| Time to first gate hit | 3-7 days (ideal) |
| Gate-driven churn (uninstalls after gate) | <10% |
| Free user Day 7 retention | 40%+ (they should stay even without paying) |
| Average gates seen before converting | 2-3 |

---

## 2. The Entitlement Model

### Single Entitlement

PupPal uses ONE entitlement: `premium`. No feature-level entitlements, no tiered plans, no "basic" vs "pro." You're either free or premium.

```ts
// The universal gate check
const { isPremium } = useSubscription();
```

This simplicity is intentional. It reduces decision paralysis ("which plan do I need?"), simplifies development (one check everywhere), and makes the value proposition clear: "Everything, unlimited, one price."

### Premium Status Sources

A user is premium if ANY of these are true:
- Active RevenueCat entitlement `premium` (subscription or lifetime)
- Active free trial via RevenueCat
- Admin override flag in database (for testing, press, influencer comps)
- Promotional access (time-limited, configured server-side)

```ts
const isPremium = () => {
  // Primary: RevenueCat (source of truth)
  if (revenueCatEntitlement.active) return true;
  // Secondary: Admin/promo override (for comps)
  if (user.premium_override === true && user.premium_override_expires > now) return true;
  return false;
};
```

---

## 3. Feature-by-Feature Gating Matrix

### Training Plan (PRD #03)

| Feature | Free | Premium |
|---------|------|---------|
| Week 1 — all exercises, full content | ✅ Full access | ✅ |
| Week 2-12 — titles and descriptions | ✅ Visible (preview) | ✅ Full access |
| Week 2-12 — exercise content | ❌ Locked | ✅ |
| Today's Training (Week 1) | ✅ | ✅ |
| Today's Training (Week 2+) | ❌ Gate | ✅ |
| Exercise detail (Week 1) | ✅ Full content | ✅ |
| Exercise detail (Week 2+) | ❌ Locked (show title, time, difficulty — lock steps) | ✅ |
| Mark exercise complete (Week 1) | ✅ | ✅ |
| Plan adaptation engine | ❌ | ✅ |
| Progress dashboard (basic) | ✅ Week 1 stats only | ✅ Full |
| Skills radar chart | ❌ Blurred preview | ✅ |
| Breed comparison | ❌ | ✅ |

**Gate UX for Week 2+**:
When free user taps a Week 2+ exercise:
1. Show exercise title, time estimate, difficulty, and first 2 lines of description
2. Content area shows blurred/locked state with lock icon overlay
3. Message: "[Name]'s Week [X] plan is ready. Unlock to continue training."
4. "Unlock Full Plan" button → triggers Superwall `feature_gate_week2`
5. "Maybe Later" dismisses (returns to previous screen)

### AI Mentor Chat — Buddy (PRD #02)

| Feature | Free | Premium |
|---------|------|---------|
| Chat access | ✅ 3 messages/day | ✅ Unlimited |
| Message quality | ✅ Full personalization (no degradation) | ✅ |
| Photo input | ❌ | ✅ |
| Chat history (current session) | ✅ | ✅ |
| Chat history (past sessions) | ❌ | ✅ |
| Suggested prompts | ✅ | ✅ |
| Proactive Buddy messages | ❌ (only post-onboarding welcome) | ✅ |

**Gate UX for chat limit**:
After 3rd message sent in a day:
1. User's message sends normally (don't block mid-thought)
2. Buddy responds normally to the 3rd message
3. After Buddy's response, inline card appears in chat:
   ```
   ┌─────────────────────────────┐
   │  You've used 3/3 free       │
   │  messages today.             │
   │                              │
   │  Unlock unlimited Buddy     │
   │  access for [Name].         │
   │                              │
   │  [Upgrade to Premium]       │
   │                              │
   │  Resets tomorrow at midnight │
   └─────────────────────────────┘
   ```
4. "Upgrade" → Superwall `feature_gate_chat`
5. Message count shown subtly in chat header: "2/3 messages today" (only visible to free users)
6. Counter resets at midnight user timezone

**Critical rule**: NEVER degrade free message quality. Free users get the same personalized, breed-specific, empathetic Buddy responses as premium. The limit is quantity, not quality. This is how you prove value.

### Trick Library (PRD #03)

| Feature | Free | Premium |
|---------|------|---------|
| Trick Library browsing (pack names, trick titles) | ✅ Visible | ✅ |
| Trick Pack 1 — "Shake" exercise only | ✅ 1 free trick | ✅ All tricks |
| Trick content (instructions, steps) | ❌ All others locked | ✅ |
| Trick progression (3 levels) | ✅ For free trick | ✅ All tricks |
| Bonus tricks in weekly plan | ❌ | ✅ |

**Gate UX for locked tricks**:
1. Trick Library shows all packs and trick names (transparent about what exists)
2. One trick fully free: "Shake / Paw" from Starter Pack — full instructions, all 3 levels
3. All other tricks: tap shows title, difficulty, time estimate, first line of description
4. Lock overlay: "Unlock [Trick Name] and 30+ more tricks for [Name]"
5. "Unlock Tricks" → Superwall `feature_gate_tricks`

### Gamification (PRD #04)

| Feature | Free | Premium |
|---------|------|---------|
| XP earning (Week 1 exercises) | ✅ | ✅ |
| XP earning (all sources) | ❌ Week 1 only | ✅ |
| Daily XP bar | ✅ | ✅ |
| Streak tracking | ✅ (but limited by exercise access) | ✅ |
| Streak freeze | ❌ | ✅ |
| Good Boy Score (Week 1 dimensions) | ✅ Visible, updating | ✅ |
| Good Boy Score (full dimensions) | ❌ Frozen after Week 1 | ✅ |
| Achievements (Week 1 achievements) | ✅ ~5 achievable | ✅ All ~45 |
| Achievements (full catalog) | ✅ Visible, locked with progress | ✅ |
| Level system | ✅ (levels from Week 1 XP) | ✅ |
| Weekly challenges | ❌ Visible, content locked | ✅ |
| Social sharing | ✅ (for any unlocked milestone) | ✅ |

**Gate UX for gamification**:
Gamification is minimally gated — it's the hook that drives conversion. Free users should feel their XP, streak, and score investment. The gate is indirect: they can't earn more XP because they can't access more exercises. The score plateau and streak stagnation creates organic upgrade motivation.

When GBS stops updating after Week 1:
- Score gauge shows current score with message: "[Name]'s score can reach 85+ with the full plan"
- Subtle CTA below gauge: "Unlock full training → "

### Health Tracker (PRD #05)

| Feature | Free | Premium |
|---------|------|---------|
| Next 2 upcoming health events (titles + dates) | ✅ | ✅ |
| Full vaccination schedule | ❌ | ✅ |
| Vaccination logging | ❌ | ✅ |
| Weight entry (1 current entry) | ✅ | ✅ |
| Weight history + breed growth curve | ❌ Blurred chart | ✅ |
| Medication tracking | ❌ | ✅ |
| Vet visit logging | ❌ | ✅ |
| Developmental milestones | ❌ Next 1 visible | ✅ All |
| Health notes | ❌ | ✅ |
| Health reminders | ✅ Next vaccination only | ✅ All |
| PDF export | ❌ | ✅ |
| Breed health profile | ✅ Top 2 conditions visible | ✅ Full |
| Vet contact storage | ❌ | ✅ |

**Gate UX for health**:
Health dashboard shows enough to demonstrate value:
1. "Upcoming" section shows 2 events with dates (fully visible)
2. Tapping any locked feature shows: "Track [Name]'s complete health with Premium"
3. Weight chart area shows blurred chart with "[Name]'s growth curve" label visible
4. Breed health shows top 2 conditions, "and 4 more..." with lock

### Growth Journal (PRD #10)

| Feature | Free | Premium |
|---------|------|---------|
| View auto-generated timeline (Week 1 milestones) | ✅ | ✅ |
| Add photos | ❌ | ✅ |
| Add notes | ❌ | ✅ |
| Backdating | ❌ | ✅ |
| Monthly recap generation | ❌ | ✅ |
| Share timeline moments | ✅ Week 1 moments | ✅ All |

### Multi-Dog (PRD #11)

| Feature | Free | Premium |
|---------|------|---------|
| 1 dog profile | ✅ | ✅ |
| Additional dog profiles | ❌ | ✅ |

**Gate**: When free user tries to add second dog: "Premium lets you train multiple pups! Add [new dog] with Premium."

### Community (PRD #15)

| Feature | Free | Premium |
|---------|------|---------|
| Browse community feed | ✅ Read-only | ✅ |
| Post to community | ❌ | ✅ |
| Comment / react | ❌ | ✅ |

---

## 4. Gate Implementation Pattern

### The `PremiumGate` Component

A reusable component that wraps any premium content:

```tsx
// src/components/ui/PremiumGate.tsx
interface PremiumGateProps {
  feature: string;              // Superwall trigger name
  children: React.ReactNode;    // Premium content
  preview?: React.ReactNode;    // What free users see
  headline?: string;            // Gate message
  cta?: string;                 // Button text
}

const PremiumGate = ({ feature, children, preview, headline, cta }) => {
  const { isPremium } = useSubscription();

  if (isPremium) return <>{children}</>;

  return (
    <View>
      {preview && preview}
      <GateOverlay
        headline={headline || `Unlock with Premium`}
        cta={cta || 'Upgrade'}
        onUpgrade={() => Superwall.register(feature)}
      />
    </View>
  );
};
```

Usage:
```tsx
<PremiumGate
  feature="feature_gate_week2"
  headline={`${dog.name}'s Week 2 is ready`}
  cta="Unlock Full Plan"
  preview={<ExercisePreview exercise={exercise} />}
>
  <ExerciseDetail exercise={exercise} />
</PremiumGate>
```

### The `useFeatureGate` Hook

For programmatic gating (e.g., chat message limit):

```tsx
// src/hooks/useFeatureGate.ts
const useFeatureGate = () => {
  const { isPremium } = useSubscription();

  const checkAccess = async (feature: string): Promise<boolean> => {
    if (isPremium) return true;

    // Feature-specific limit checks
    switch (feature) {
      case 'chat_message':
        const count = await getDailyMessageCount();
        if (count >= 3) {
          await Superwall.register('feature_gate_chat');
          return false;
        }
        return true;

      case 'week_content':
        const week = getCurrentPlanWeek();
        if (week > 1) {
          await Superwall.register('feature_gate_week2');
          return false;
        }
        return true;

      case 'add_dog':
        const dogCount = await getDogCount();
        if (dogCount >= 1) {
          await Superwall.register('feature_gate_multi_dog');
          return false;
        }
        return true;

      default:
        await Superwall.register(`feature_gate_${feature}`);
        return false;
    }
  };

  return { isPremium, checkAccess };
};
```

### Gate Frequency Limiting

```ts
// src/lib/gateThrottle.ts
const GATE_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours

const canShowGate = async (feature: string): Promise<boolean> => {
  const lastShown = await getLastGateTimestamp(feature);
  if (!lastShown) return true;
  return Date.now() - lastShown > GATE_COOLDOWN_MS;
};

const recordGateShown = async (feature: string) => {
  await setLastGateTimestamp(feature, Date.now());
};
```

**Rules**:
- Maximum 1 paywall per session (app open → close = 1 session)
- After dismissing, 4-hour cooldown before same gate shows again
- Different gates can show in different sessions (Week 2 gate today, chat gate tomorrow)
- Celebration gates (streak milestone) bypass frequency limits (they're positioned as rewards, not interruptions)
- Settings "Upgrade" button always works regardless of cooldown

---

## 5. Free User Daily Message Tracking

### Data Model

```
DailyMessageCount {
  user_id: UUID
  dog_id: UUID
  date: date                    // user's timezone date
  messages_sent: integer
  limit: integer (default 3)
  limit_hit_at: timestamp (nullable)  // when they hit the limit
}
```

### Implementation

```ts
// Before sending each chat message:
const canSendMessage = async (userId: string, dogId: string): Promise<boolean> => {
  const today = getUserLocalDate();
  const record = await getDailyCount(userId, dogId, today);

  if (!record) {
    await createDailyCount(userId, dogId, today, 1, 3);
    return true;
  }

  if (record.messages_sent >= record.limit) {
    return false; // Trigger gate in UI
  }

  await incrementDailyCount(record.id);
  return true;
};
```

### Display

Chat header for free users: subtle counter `2/3` showing messages used. Appears as caption text, not alarming. After 3/3: counter turns to warning color and inline upgrade card appears in chat.

---

## 6. Content Preview Strategy

### What Free Users See (Preview Content)

The key to good gating is showing WHAT is locked, not just THAT something is locked. Previews create desire.

**Week 2+ Exercises**:
- Title: "Teach 'Down' — Lure Method" ✅ visible
- Time: "10 min" ✅ visible
- Difficulty: "2 paws" ✅ visible
- Description first 2 lines: "Teaching your puppy 'down' is one of the..." ✅ visible
- Full steps: ❌ locked (blurred or hidden)
- Breed tip: ❌ locked
- "Unlock this exercise →" CTA

**Locked Tricks**:
- Trick name + pack: "Roll Over — Classic Tricks" ✅ visible
- Difficulty + time: ✅ visible
- 1-line description: ✅ visible
- Steps + levels: ❌ locked
- "Unlock 30+ tricks →" CTA

**Health Events**:
- Event name + date: "DHPP Booster — Due Mar 15" ✅ visible
- Full details, logging, reminders: ❌ locked
- "Track all of [Name]'s health →" CTA

**Achievements**:
- All achievement names, icons, categories: ✅ visible
- Progress toward locked achievements: ✅ visible ("14/30 days")
- The achievement itself isn't locked — the EXERCISES needed to unlock it are

### Preview Design Pattern

```tsx
// Generic locked content preview
const LockedPreview = ({ title, subtitle, ctaText, feature }) => (
  <View className="relative overflow-hidden rounded-xl">
    {/* Blurred content preview */}
    <View className="opacity-40 blur-sm pointer-events-none">
      <ContentPreview title={title} subtitle={subtitle} />
    </View>

    {/* Lock overlay */}
    <View className="absolute inset-0 items-center justify-center bg-secondary/5">
      <LockIcon size={24} color={colors.primary} />
      <Text className="text-body-medium text-secondary mt-2">{ctaText}</Text>
      <Button
        variant="primary"
        size="small"
        onPress={() => Superwall.register(feature)}
        className="mt-3"
      >
        Unlock
      </Button>
    </View>
  </View>
);
```

---

## 7. Buddy's Role in Gating

Buddy is the soft-sell engine. Instead of hard UI gates, Buddy naturally references premium features in conversation:

### Buddy Upsell Messages (Contextual, Never Spammy)

These appear organically in chat when relevant to the conversation:

| Context | Buddy Says |
|---------|-----------|
| User asks about Week 2 topic | "Great question! That's covered in Week 2 of [Name]'s plan. Unlock the full plan to get there →" |
| User asks about a locked exercise | "[Name] would love this exercise! It's part of the full training plan." |
| User hits 3 message limit | "I'd love to keep chatting about [Name]! With Premium, we can talk as much as you need." |
| User asks about health topic | "I can help with that! The health tracker keeps all of [Name]'s vaccinations and vet visits organized." |
| User mentions wanting to teach trick | "Tricks are so fun! [Name] could learn 30+ tricks with the full Trick Library. Want to start with Shake? That one's free!" |
| User asks about second dog | "A new pup! Premium lets you create a plan for each dog separately." |

### Rules for Buddy Upsells
- Maximum 1 upsell reference per conversation session
- Never interrupt a user's real question to upsell — answer the question first, then mention the feature
- Never repeat the same upsell message twice in the same week
- Always frame as "[Name] would benefit" not "you need to pay"
- If user expresses frustration about limits, Buddy acknowledges honestly: "I know the limits can be frustrating. I want to help [Name] as much as I can within them."

---

## 8. Free User Retention (Why They Stay Without Paying)

Not every free user will convert. That's fine. Free users who stay provide:
- Social proof (app install numbers)
- Potential future conversion
- Referral source (they may recommend PupPal even without paying)
- App Store ranking boost (more users = better ranking)

### Free User Experience Should NOT Feel Broken

- Week 1 is a complete, satisfying experience (not a teaser)
- Buddy works for 3 messages/day (enough for a real question)
- XP, streaks, and Good Boy Score all work within Week 1
- 1 free trick (Shake) provides ongoing engagement
- Health: next 2 events visible for genuine utility
- Community: can read feed (engagement without contribution)

### Free User Re-engagement

Even free users get some push notifications:
- "Today's training with [Name] (~10 min)" — Week 1 exercises
- "[Name]'s streak is at risk!" — if they started a streak
- "[Name]'s next vaccination is coming up" — the 1 free health reminder

These keep free users active, which increases the chance of eventual conversion.

---

## 9. Promotional & Override Access

### Influencer Comps

For influencer partnerships (PRD #08), grant temporary premium access:

```ts
// Admin function: grant promotional premium
const grantPromoAccess = async (userId: string, durationDays: number, reason: string) => {
  await supabase.from('users').update({
    premium_override: true,
    premium_override_expires: addDays(new Date(), durationDays),
    premium_override_reason: reason,
  }).eq('id', userId);
};
```

### Override Data

```
-- On users table:
premium_override: boolean (default false)
premium_override_expires: timestamp (nullable)
premium_override_reason: string (nullable)  // "influencer_comp", "beta_tester", "support_issue"
```

### Where Override Is Checked

The `isPremium` check (Section 2) includes override. No other code changes needed. When override expires, user sees standard free experience with upgrade option.

---

## 10. Analytics Events

```
// Gate events
gate_encountered              { feature, screen, user_tier }
gate_upgrade_tapped           { feature, screen }
gate_dismissed                { feature, screen }
gate_converted                { feature, product_id }
gate_frequency_limited        { feature }  // gate wanted to show but was throttled

// Free user behavior
free_chat_limit_hit           { messages_sent_today, dog_id }
free_exercise_gate_hit        { week_number, exercise_id }
free_trick_gate_hit           { trick_id, pack_id }
free_health_gate_hit          { feature_type }
free_weekly_retention         { week_number, days_active, exercises_completed }

// Buddy upsell
buddy_upsell_shown            { upsell_type, context }
buddy_upsell_tapped           { upsell_type }
buddy_upsell_converted        { upsell_type, product_id }
```

---

## 11. Edge Cases

| Scenario | Handling |
|----------|----------|
| User downgrades mid-Week 5 | Keep all completed progress. Lock unfinished Week 5+ exercises. Today's Training reverts to Week 1 review content. |
| User re-subscribes after lapse | Immediately restore access to current plan week. No data lost. |
| Free user somehow has >3 messages (race condition) | Server validates. If 4th message slips through, allow it (don't delete). Fix count for next day. |
| User in trial cancels but trial hasn't expired | Full premium access until trial end date. No gates visible. |
| Admin override active but user also has subscription | Both work. No conflict. If override expires, subscription keeps them premium. |
| Gate shows but Superwall fails to load | Fallback: show native "Upgrade" screen with basic product info and RevenueCat purchase flow. |
| Free user tries to access exercise from push notification deep link | Check gate before rendering. If locked, show preview + gate instead of 404. |
| Free user's streak would break because they can't access exercises | Week 1 exercises are always available for streak maintenance. |
| User completes all Week 1 exercises multiple times | Allow it. They keep earning XP (reduced: 5 XP for repeats vs 15 for first time). Streak maintained. |
| Free user on Day 8 with no exercises left to complete | Show "completed" state for Week 1. Suggest: "Repeat favorites" or "Try the free trick (Shake)." Gate message: "Ready for Week 2?" |
| Mixed state: premium on iOS, free on Android | RevenueCat cross-platform sync handles this. Same entitlement on both. |

---

## 12. Testing Checklist

Before launch, verify every gate works correctly:

- [ ] Week 1 exercises fully accessible to free users (all content, completion, XP)
- [ ] Week 2 exercise tap shows preview + gate (not blank screen)
- [ ] Chat works for 3 messages with counter visible
- [ ] 4th chat message triggers inline gate card
- [ ] Message counter resets at midnight user timezone
- [ ] Trick Library shows all names, 1 free trick (Shake) fully works
- [ ] Locked trick shows preview + gate
- [ ] Health shows 2 upcoming events, locked details
- [ ] Weight allows 1 entry, chart is blurred
- [ ] GBS updates during Week 1, plateaus after
- [ ] Achievements show progress even for locked ones
- [ ] Weekly challenge visible but locked
- [ ] Multi-dog blocked with gate on second dog
- [ ] Community readable, posting locked
- [ ] Growth Journal shows auto timeline, manual features locked
- [ ] Buddy upsells appear max 1 per session
- [ ] Gate frequency limiter works (4-hour cooldown)
- [ ] Max 1 paywall per session enforced
- [ ] Celebration gates bypass frequency limits
- [ ] Settings "Upgrade" always works regardless of cooldown
- [ ] All gate analytics events fire correctly
- [ ] Premium user sees NO gates, NO counters, NO lock icons anywhere
- [ ] Downgrade preserves all data and shows appropriate locked state
- [ ] Re-upgrade immediately restores full access

---

## 13. Dependencies

| Dependency | Purpose | Fallback |
|------------|---------|----------|
| RevenueCat (PRD #06) | Premium status check | Cannot gate without this |
| Superwall (PRD #06) | Paywall presentation at gates | Native fallback paywall |
| Training Plan (PRD #03) | Week-based content gating | Gate all non-Week-1 |
| AI Chat (PRD #02) | Message counting and limiting | Hard limit server-side |
| Gamification (PRD #04) | XP/streak/GBS work in free tier | Gamification works independently |
| Health Tracker (PRD #05) | Partial access gating | Gate all non-preview |
| PostHog | Gate analytics | Log to database |

---

## 14. Acceptance Criteria

- [ ] `PremiumGate` component wraps all premium content correctly
- [ ] `useFeatureGate` hook handles all gate types
- [ ] `useSubscription` is the single source of premium status
- [ ] Free users access Week 1 fully with no quality degradation
- [ ] All locked content shows meaningful preview (never blank)
- [ ] Chat 3/day limit enforced with counter and inline gate
- [ ] Gate frequency limiting works (1 per session, 4-hour cooldown)
- [ ] Buddy upsells capped at 1 per conversation, contextual
- [ ] Superwall triggers fire for all 9 gate events
- [ ] Premium users see zero gates anywhere in the app
- [ ] Promotional override grants access and expires correctly
- [ ] Downgrade preserves data, shows locked state
- [ ] Re-subscribe restores access immediately
- [ ] All gate and free-user analytics events fire
- [ ] Free user retention tracked weekly
