# PRD #09: Push Notification & Retention Sequences

## PupPal — The Re-engagement Engine

**Document version**: 1.0
**Feature owner**: Ashley
**Status**: Draft
**Priority**: P1 — The best app in the world is useless if people forget to open it. Push notifications are the single most important retention lever in mobile apps. Done right, they feel like a helpful friend reminding you. Done wrong, they get your app uninstalled.

---

## 1. Overview & Purpose

Push notifications serve three functions in PupPal:

1. **Daily habit formation**: Remind users to train today. Consistency is how puppies learn AND how subscriptions retain.
2. **Contextual health/safety reminders**: Vaccination due dates, medication reminders, vet follow-ups. Genuinely useful, not marketing.
3. **Re-engagement and win-back**: Bring back lapsed users before they churn. Celebrate milestones to reinforce the habit loop.

PupPal uses **OneSignal** for push notifications because it provides: user segmentation, automated journeys (sequences without code changes), A/B testing copy, delivery time optimization (send at best time per user), analytics (open rates, conversion), and in-app messaging.

### The Golden Rule

Every notification must pass this test: **"Would the user thank me for this notification?"** If no, don't send it.

### Success Metrics

| Metric | Target |
|--------|--------|
| Push opt-in rate | 70%+ (ask at the right moment) |
| Average open rate | 15-25% |
| Training reminder open rate | 20-30% |
| Health reminder open rate | 30-40% (highest value) |
| Notification-driven sessions | 25%+ of daily sessions |
| Unsubscribe rate (disable push) | <5%/month |
| Notification-attributed exercise completions | 15%+ |

---

## 2. Permission Request Strategy

### When to Ask

**Do NOT ask on first launch.** The iOS permission dialog is one-shot — if they say no, recovery is extremely difficult (must go to Settings manually).

**Ask after the user has experienced value.** Specifically:

**Trigger: After completing first exercise (post-onboarding)**

Flow:
1. User completes first exercise → celebration animation → XP earned
2. After celebration dismisses, show a custom pre-permission screen (NOT the system dialog):

```
┌─────────────────────────────┐
│                              │
│          ┌──────┐            │
│          │BUDDY │            │
│          │ 😊  │            │
│          └──────┘            │
│                              │
│   Great start! Want me       │
│   to remind you when         │
│   [Name]'s next training     │
│   is ready?                  │
│                              │
│   I'll also let you know     │
│   about:                     │
│   🔥 Streak reminders        │
│   💉 Vaccination due dates   │
│   🏆 [Name]'s achievements   │
│                              │
│  ┌───────────────────────┐   │
│  │   Yes, remind me! →   │   │  ← Primary button
│  └───────────────────────┘   │
│                              │
│      Maybe later             │  ← Ghost button (no penalty)
│                              │
└─────────────────────────────┘
```

3. If "Yes" → show iOS system permission dialog
4. If "Maybe later" → ask again after 3rd exercise completion (different copy)
5. If system dialog denied → show instructions to enable in Settings (only if user later taps a notification-dependent feature)

**Why this works**: By the time the user sees this, they've invested in the app (completed onboarding + first exercise), experienced value, and the request is framed as Buddy helping them — not the app wanting their attention.

### Second Chance Ask

If "Maybe later" on first ask, re-ask after 3rd exercise:

"[Name] has a 3-day streak! Want reminders so you never miss a day?"

If declined twice, don't ask again for 30 days.

---

## 3. Notification Categories

### Category Architecture

Each category can be independently enabled/disabled by the user in Settings.

| Category | Description | Default | Priority |
|----------|-------------|---------|----------|
| `training_reminders` | Daily training nudges | ON | Normal |
| `streak_alerts` | Streak at risk / milestones | ON | High |
| `gamification` | Achievements, level-ups, challenges | ON | Normal |
| `health_reminders` | Vaccinations, medications, vet | ON | High |
| `buddy_messages` | Proactive tips and check-ins | ON | Low |
| `growth_updates` | Monthly recaps, milestones | ON | Low |
| `social` | Referral rewards, community | ON | Low |
| `marketing` | Feature announcements, promotions | ON | Low |

### OneSignal Tags

Each user has tags in OneSignal for segmentation:

```
dog_name: "Luna"
breed: "golden_retriever"
age_weeks: 14
plan_week: 3
subscription_status: "active" | "trialing" | "free" | "cancelled" | "expired"
streak_days: 12
good_boy_score: 42
last_exercise_completed: "2026-03-02T14:30:00Z"
last_app_open: "2026-03-03T08:00:00Z"
timezone: "America/Chicago"
exercises_completed_total: 34
onboarding_completed: true
push_enabled: true
```

Tags updated on every relevant event via OneSignal API.

---

## 4. Notification Sequences

### Sequence 1: Trial Onboarding (Day 0-3)

Goal: Maximize exercise completion during trial to drive conversion.

| Day | Time | Copy | Deep Link |
|-----|------|------|-----------|
| 0 (signup) | Immediate | "Welcome! {dog_name}'s training plan starts now — your first exercise takes just 5 minutes. 🐾" | → Today's Training |
| 0 | +4 hours (if no exercise) | "Quick 5-minute session with {dog_name}? Today's exercise: {exercise_name}" | → Exercise detail |
| 1 | Morning (user TZ) | "Good morning! {dog_name}'s Day 2 training is ready. Keep the streak alive! 🔥" | → Today's Training |
| 1 | Evening (if incomplete) | "{dog_name} is counting on you! Just {minutes} minutes to finish today's training." | → Today's Training |
| 2 | Morning | "Day 3 with {dog_name}! 🎉 Reminder: your free trial ends tomorrow." | → Today's Training |
| 2 | Afternoon | "How's {dog_name} doing with {current_skill}? Buddy has tips if you need them." | → Chat |
| 3 (trial end) | Morning | "Your trial wraps up today. {dog_name} has made real progress — Good Boy Score: {score}!" | → Home |

### Sequence 2: Daily Training Reminders (Ongoing)

Goal: Drive daily exercise completion to maintain streaks and engagement.

**Morning Reminder** (configurable time, default 8am user TZ):
- Sent if user hasn't opened app yet today
- Rotates through variants:

| Variant | Copy |
|---------|------|
| A | "Today's training with {dog_name}: {exercise_name} (~{minutes} min) 🐾" |
| B | "{dog_name}'s {streak_count}-day streak is going strong! Keep it up today." |
| C | "Good morning! {dog_name} is {score_change} points from the next milestone." |
| D | "Quick tip from Buddy: {breed}-specific training works best in short sessions. Ready?" |
| E | "Week {week_number} focus: {week_theme}. {dog_name}'s exercise is ready!" |

**Evening Reminder** (7pm user TZ):
- Sent ONLY if no exercise completed today
- Max 1 evening reminder per day
- Copy: "{dog_name}'s training is waiting! Just {minutes} minutes before bed. 🌙"

**Rules**:
- Never send morning + evening on the same day if exercise was completed
- After 3 consecutive days of no exercise completion despite reminders → reduce to 1 notification/day
- After 7 consecutive days of no opens → switch to re-engagement sequence
- Quiet hours: no notifications between 10pm-7am user timezone

### Sequence 3: Streak Alerts

Goal: Protect streaks (streaks drive retention better than any other mechanic).

| Trigger | Time | Copy |
|---------|------|------|
| Streak at risk (no exercise by 5pm) | 5pm user TZ | "🔥 {dog_name}'s {streak_count}-day streak is at risk! Quick session?" |
| Streak at risk (still nothing by 8pm) | 8pm user TZ | "Last chance to save the streak! {exercise_name} takes just {minutes} min." |
| Streak broken | Morning after | "Your streak reset, but {dog_name}'s progress didn't! Every day is a fresh start. 💪" |
| Streak milestone (7 days) | Immediate | "🔥 7-day streak! You and {dog_name} are unstoppable!" |
| Streak milestone (14 days) | Immediate | "Two weeks straight! {dog_name} is building amazing habits. 🎉" |
| Streak milestone (30 days) | Immediate | "30-DAY STREAK! 🔥🔥🔥 {dog_name} is officially a training rockstar." |
| Streak milestone (60/90) | Immediate | "LEGENDARY! {streak_count} days. You and {dog_name} are in the top 1%." |
| Streak freeze used | Morning after | "Streak freeze saved your {streak_count}-day streak! Get back to training today." |

### Sequence 4: Gamification Celebrations

Goal: Dopamine hits that reinforce training behavior.

| Trigger | Copy |
|---------|------|
| Achievement unlocked | "🏆 {dog_name} unlocked '{achievement_name}'! +{xp} XP" |
| Level up | "⬆️ Level up! You're now a {level_title}!" |
| GBS milestone (every 10 points) | "{dog_name}'s Good Boy Score hit {score}! That's amazing progress." |
| Weekly challenge complete | "Challenge complete: {challenge_name}! +{xp} XP 🎯" |
| GBS breed comparison | "{dog_name} is in the top {percentile}% of {breed}s! 🐾" |

**Rules**: Max 2 gamification notifications per day. Celebration notifications always send regardless of cap.

### Sequence 5: Health Reminders

Goal: Genuinely useful health management. Highest-value notifications in the app.

| Trigger | Timing | Copy |
|---------|--------|------|
| Vaccination due | 7 days before | "💉 {dog_name}'s {vaccine_name} is due next week. Time to schedule!" |
| Vaccination due | Day of | "💉 {dog_name}'s {vaccine_name} is due today." |
| Vaccination overdue | 1 day after window | "⚠️ {dog_name}'s {vaccine_name} is overdue. Contact your vet." |
| Medication due (monthly) | Day of, morning | "💊 {dog_name}'s {med_name} is due today!" |
| Medication due (daily) | User-configured time | "Time for {dog_name}'s {med_name}" |
| Vet follow-up | 3 days before | "🩺 {dog_name}'s follow-up vet visit is on {date}." |
| Monthly weigh-in | Monthly | "⚖️ Time for {dog_name}'s monthly weigh-in! Track growth." |
| Developmental milestone | When entering window | "📋 {dog_name} is entering {milestone_name}. Here's what to expect!" |
| Spay/neuter window | At breed-appropriate age | "Talk to your vet about spay/neuter timing for {dog_name}." |

**Rules**: Health notifications are NEVER suppressed by daily caps. They're utility, not marketing.

### Sequence 6: Buddy Proactive Messages

Goal: Make Buddy feel alive even when user isn't in the app.

| Trigger | Timing | Copy |
|---------|--------|------|
| No chat in 3 days | Afternoon | "Buddy here! 🐾 Quick tip for {breed}s: {breed_tip}. Want to chat?" |
| Dog age milestone | On milestone | "Happy {age} weeks, {dog_name}! Here's what to expect this month." |
| Seasonal tip | Seasonal | "Hot weather alert! {breed}s can overheat — keep {dog_name} cool today." |
| Behavior tip (context) | Weekly | "Week {week} focus: {skill}. Want Buddy's #1 tip for teaching this?" |

**Rules**: Max 1 Buddy notification per week. Free users get these too (drives chat engagement → hits message limit → conversion opportunity).

### Sequence 7: Re-engagement (Lapsed Users)

Goal: Bring back users who stopped opening the app.

| Day Inactive | Copy | Strategy |
|-------------|------|----------|
| 3 days | "{dog_name} hasn't trained in 3 days. Quick {minutes}-min session?" | Simple nudge |
| 7 days | "Buddy misses {dog_name}! Your training plan is paused at Week {week}. Come back!" | Emotional + progress reminder |
| 14 days | "{dog_name}'s Good Boy Score was {score}. Don't let the progress slip! 🐾" | Loss aversion |
| 21 days | "We added new tricks this week! Teach {dog_name} something fun. 🎯" | New content hook |
| 30 days | "It's never too late! {dog_name} can pick up right where you left off. Start fresh today." | Encouragement + fresh start |
| 45 days | "[New feature/content] just launched! {dog_name}'s plan is waiting. 🐾" | Feature announcement |
| 60 days | "One quick session can restart {dog_name}'s training. Just 5 minutes? ❤️" | Minimal ask |
| 90 days | Final notification before stopping | Respect the decision |

After 90 days of inactivity with no opens: stop all push notifications. User has effectively churned. Re-engagement shifts to email (if collected) or paid retargeting.

### Sequence 8: Win-Back (Cancelled/Expired Subscribers)

Defined in PRD #06 Section 7. Summary:

Day 0 (expiry), Day 3, Day 7 (no offer), Day 14 (50% off), Day 30 (40% off), Day 60 (60% off).

### Sequence 9: Growth Journal / Milestones

Goal: Emotional moments that drive engagement and sharing.

| Trigger | Copy |
|---------|------|
| 1 week with PupPal | "1 week together! Look how far {dog_name} has come. View your timeline →" |
| 1 month with PupPal | "Happy 1-month anniversary! {dog_name}'s monthly recap is ready. 📸" |
| Photo added 30 days ago | "Remember this? {dog_name} 30 days ago! Compare to today →" |
| Plan graduation | "🎓 {dog_name} GRADUATED! 12 weeks done. What a journey. See the full story →" |

---

## 5. Notification Delivery Logic

### Timing Optimization

OneSignal's "Intelligent Delivery" sends at the time each user is most likely to open. Enable this for:
- Daily training reminders (learns user's preferred training time)
- Buddy proactive messages
- Re-engagement sequences

**Don't use intelligent delivery for**:
- Streak alerts (time-sensitive, must be 5pm/8pm)
- Health reminders (date-specific)
- Celebration notifications (immediate on trigger)

### Daily Caps

| Category | Max/Day | Exception |
|----------|---------|-----------|
| Training reminders | 2 (morning + evening) | — |
| Streak alerts | 2 (5pm + 8pm) | Milestones always send |
| Gamification | 2 | Celebrations bypass cap |
| Health | No cap | All health reminders send |
| Buddy | 1 | — |
| Re-engagement | 1 | — |
| Growth/social | 1 | — |

**Global cap**: Maximum 4 notifications per day across all categories (health and celebrations exempt).

### Quiet Hours

No notifications between 10pm and 7am user timezone. Exceptions: none. Even health reminders wait until morning.

### Platform-Specific

**iOS**:
- Grouped by category (training, health, gamification as separate notification groups)
- Support notification actions: "Start Training" button directly on notification
- Critical alerts: NOT used (reserve for actual emergencies, PupPal doesn't have those)

**Android**:
- Notification channels mapped to categories (user can disable per-channel in system settings)
- Big text style for longer copy
- Action buttons: "Train Now", "Snooze 1hr"

---

## 6. Notification Content Personalization

### Token Replacement

All notifications use dynamic tokens resolved at send time:

```
{dog_name}           → "Luna"
{breed}              → "Golden Retriever"
{streak_count}       → "12"
{score}              → "42"
{score_change}       → "5"
{exercise_name}      → "Sit: Adding Distance"
{minutes}            → "10"
{week_number}        → "3"
{week_theme}         → "Core Obedience"
{vaccine_name}       → "DHPP Booster #3"
{med_name}           → "NexGard"
{achievement_name}   → "Sit Happens"
{xp}                 → "50"
{level_title}        → "Senior Trainer"
{age}                → "14"
{breed_tip}          → "Golden Retrievers respond best to food-based rewards"
{date}               → "March 15"
{percentile}         → "20"
```

### A/B Testing Copy

OneSignal supports A/B testing notification copy. Run tests on:
- Emoji vs no emoji
- Dog name first vs action first ("{dog_name}'s training" vs "Training time for {dog_name}")
- Urgency level ("Just 5 min!" vs "When you're ready")
- Question vs statement ("Ready to train?" vs "Training is ready")

Track: open rate, exercise completion rate within 1 hour of open.

---

## 7. Notification Settings Screen

```
┌─────────────────────────────┐
│  ← Notifications             │
│                              │
│  TRAINING                    │
│  Daily training reminders    │  [ON/OFF toggle]
│  Preferred time: 8:00 AM    │  [time picker]
│  Evening reminders           │  [ON/OFF]
│                              │
│  STREAKS                     │
│  Streak at risk alerts       │  [ON/OFF]
│  Streak milestones           │  [ON/OFF]
│                              │
│  GAMIFICATION                │
│  Achievements                │  [ON/OFF]
│  Level ups                   │  [ON/OFF]
│  Weekly challenges           │  [ON/OFF]
│                              │
│  HEALTH                      │
│  Vaccination reminders       │  [ON/OFF]
│  Medication reminders        │  [ON/OFF]
│  Vet appointment reminders   │  [ON/OFF]
│  Growth milestones           │  [ON/OFF]
│                              │
│  BUDDY                       │
│  Tips and check-ins          │  [ON/OFF]
│                              │
│  GROWTH & SOCIAL             │
│  Monthly recaps              │  [ON/OFF]
│  Referral rewards            │  [ON/OFF]
│                              │
│  UPDATES                     │
│  New features & content      │  [ON/OFF]
│                              │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─     │
│  Quiet hours: 10pm - 7am    │  [configurable]
│                              │
└─────────────────────────────┘
```

### Data Model

```
NotificationPreferences {
  user_id: UUID
  training_daily: boolean (default true)
  training_preferred_time: time (default '08:00')
  training_evening: boolean (default true)
  streak_risk: boolean (default true)
  streak_milestones: boolean (default true)
  gamification_achievements: boolean (default true)
  gamification_levelups: boolean (default true)
  gamification_challenges: boolean (default true)
  health_vaccinations: boolean (default true)
  health_medications: boolean (default true)
  health_vet: boolean (default true)
  health_growth: boolean (default true)
  buddy_tips: boolean (default true)
  growth_recaps: boolean (default true)
  social_referrals: boolean (default true)
  marketing_updates: boolean (default true)
  quiet_hours_start: time (default '22:00')
  quiet_hours_end: time (default '07:00')
  updated_at: timestamp
}
```

---

## 8. Local Notifications (Offline Backup)

For time-critical reminders that must fire even without network:

- Medication daily reminders (scheduled locally via Expo Notifications)
- Streak risk alert at 7pm (if no exercise completed, scheduled each morning)
- Vet appointment day-of reminder (scheduled when appointment is logged)

These are scheduled on-device and fire regardless of network connectivity. OneSignal handles the cloud-based notifications. Local notifications serve as a reliability backup for critical reminders.

```ts
// Schedule local medication reminder
import * as Notifications from 'expo-notifications';

await Notifications.scheduleNotificationAsync({
  content: {
    title: `${dogName}'s ${medName}`,
    body: `Time for ${dogName}'s ${medName}`,
    data: { type: 'medication', medicationId },
  },
  trigger: {
    hour: preferredHour,
    minute: preferredMinute,
    repeats: true, // daily
  },
});
```

---

## 9. Implementation Architecture

### Event-Driven Notification System

Notifications are triggered by events, not cron jobs polling for conditions:

```
Event occurs (exercise completed, streak updated, vaccine due)
  → Supabase database trigger / Edge Function
    → Evaluates notification rules (should we send? which sequence? user preferences?)
      → If yes: call OneSignal API with user_id, template, tokens
        → OneSignal handles delivery timing, platform, grouping
```

### OneSignal Integration

```ts
// supabase/functions/send-notification/index.ts
const sendNotification = async (
  userId: string,
  template: string,
  tokens: Record<string, string>,
  category: string,
  deepLink: string,
) => {
  // Check user preferences
  const prefs = await getNotificationPrefs(userId);
  if (!prefs[category]) return; // User disabled this category

  // Check daily caps
  const todayCount = await getTodayNotificationCount(userId, category);
  if (todayCount >= CAPS[category] && !EXEMPT_CATEGORIES.includes(category)) return;

  // Check quiet hours
  if (isQuietHours(userId)) {
    await scheduleForMorning(userId, template, tokens, category, deepLink);
    return;
  }

  // Send via OneSignal
  await oneSignal.createNotification({
    include_external_user_ids: [userId],
    headings: { en: resolveTokens(TEMPLATES[template].title, tokens) },
    contents: { en: resolveTokens(TEMPLATES[template].body, tokens) },
    data: { deep_link: deepLink, category },
    android_channel_id: CHANNEL_MAP[category],
    ios_category: category,
  });

  // Log
  await logNotificationSent(userId, template, category);
};
```

### Notification Templates

Store templates in database for remote updates:

```
NotificationTemplate {
  id: UUID
  slug: string                // "training_morning_a"
  category: string            // "training_reminders"
  sequence: string (nullable) // "trial_onboarding" or null for triggered
  title: string               // "Today's training with {dog_name}"
  body: string                // "{exercise_name} (~{minutes} min) 🐾"
  deep_link_template: string  // "puppal://training/today"
  active: boolean
  ab_test_group: string (nullable)
}
```

---

## 10. Analytics Events

```
// Notification lifecycle
notification_permission_asked    { trigger, first_or_retry }
notification_permission_granted  { }
notification_permission_denied   { first_or_retry }
notification_sent                { template, category, sequence, tokens }
notification_delivered           { template, category }  // from OneSignal
notification_opened              { template, category, time_to_open_ms }
notification_dismissed           { template, category }
notification_action_tapped       { template, category, action }  // "Train Now" button

// Sequence tracking
sequence_started                 { sequence_name, user_id }
sequence_step_sent               { sequence_name, step_number }
sequence_completed               { sequence_name, outcome }  // converted, lapsed, etc.
sequence_user_reengaged          { sequence_name, step_that_worked }

// Settings
notification_category_toggled    { category, enabled }
notification_time_changed        { old_time, new_time }
quiet_hours_changed              { start, end }
```

---

## 11. Edge Cases

| Scenario | Handling |
|----------|----------|
| User disables push at OS level | OneSignal reports. Stop sending (saves cost). Show in-app banner: "Turn on notifications to get training reminders." |
| User in timezone that changes (DST) | OneSignal handles timezone. Recalculate local schedules on app open. |
| User travels to different timezone | Update timezone on app open. Adjust all scheduled notifications. |
| Multiple dogs — which reminders? | Send for primary (most recently trained) dog. Combine if both due: "{dog1} and {dog2}'s training is ready!" |
| User completes exercise before reminder fires | Cancel pending reminder for that day. Send congratulation instead (or nothing). |
| Re-engagement notification → user opens but doesn't train | Count as open. Don't resend same day. Continue sequence. |
| User gets trial onboarding sequence + daily training sequence | Trial sequence takes priority during Day 0-3. Daily sequence starts Day 4. |
| 90-day inactive user — stop notifications | Mark as "notification_paused" in OneSignal. Resume only on next app open. |
| Notification copy references exercise that was adapted/changed | Resolve tokens at send time (not schedule time). Always fetch current exercise. |
| Health reminder for completed vaccination | Check status before sending. If already logged, skip or send: "✅ {vaccine_name} logged! {dog_name} is up to date." |
| User on free tier getting premium-feature notifications | Free users get training (Week 1), streak, and limited health. Don't send notifications about features they can't access. |
| Notification leads to gated content | Deep link should handle gracefully: show content if premium, show preview + gate if free. Never crash or 404. |

---

## 12. Dependencies

| Dependency | Purpose | Fallback |
|------------|---------|----------|
| OneSignal | Cloud push delivery, segmentation, analytics | Expo Notifications (basic, no segmentation) |
| Expo Notifications | Local/offline notifications, permission API | OneSignal handles cloud side |
| Supabase Edge Functions | Event-driven notification triggers | Cron-based fallback |
| Training Plan (PRD #03) | Exercise names, plan week for tokens | Generic copy without exercise specifics |
| Gamification (PRD #04) | Streak, XP, GBS, achievements for tokens | Generic copy |
| Health Tracker (PRD #05) | Vaccination, medication due dates | No health notifications |
| Subscription (PRD #06) | Trial sequence, win-back triggers | No subscription-specific sequences |
| PostHog | Notification analytics | OneSignal analytics (limited) |

---

## 13. Acceptance Criteria

- [ ] Push permission asked after first exercise (not on first launch)
- [ ] Custom pre-permission screen shows before iOS system dialog
- [ ] If declined, re-asked after 3rd exercise with different copy
- [ ] OneSignal initialized with correct user tags
- [ ] Tags update on every relevant event (exercise, streak, score change)
- [ ] Trial onboarding sequence fires Day 0-3 with correct timing
- [ ] Daily training reminders fire at user's preferred time
- [ ] Evening reminder fires only if no exercise completed
- [ ] Streak risk alerts fire at 5pm and 8pm
- [ ] Streak milestones fire immediately on trigger
- [ ] Gamification celebrations fire (max 2/day, celebrations exempt)
- [ ] Health reminders fire at correct intervals (7 days before, day of, overdue)
- [ ] Medication daily reminders fire at user-configured time (local notification)
- [ ] Buddy proactive messages limited to 1/week
- [ ] Re-engagement sequence fires at Day 3, 7, 14, 21, 30, 45, 60
- [ ] Notifications stop after 90 days inactive
- [ ] Global cap of 4/day enforced (health and celebrations exempt)
- [ ] Quiet hours (10pm-7am) respected
- [ ] Notification settings screen shows all categories with toggles
- [ ] Toggling a category updates OneSignal tags and stops delivery
- [ ] All tokens resolve correctly (dog name, breed, scores, exercises)
- [ ] Deep links from notifications navigate to correct screen
- [ ] Deep links handle free vs premium gracefully (no crashes)
- [ ] A/B testing running on at least 2 notification templates
- [ ] All analytics events fire correctly
- [ ] Local notification backup fires for medications and streak risk
