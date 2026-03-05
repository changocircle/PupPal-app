# PRD #13: Analytics & A/B Testing Framework

## PupPal — Measure Everything, Decide with Data

**Document version**: 1.0
**Priority**: P1 — You can't optimize what you can't measure. Analytics are how PupPal goes from "we think this works" to "we know this works." Every revenue, retention, and engagement decision depends on this infrastructure.

---

## 1. Overview

PupPal uses **PostHog** as the primary analytics platform (events, funnels, retention, feature flags, session replay). **RevenueCat** provides subscription-specific analytics. **OneSignal** provides notification analytics. **Superwall** provides paywall A/B test results.

This PRD defines: what events to track, which dashboards to build, feature flag strategy, and how to run experiments.

---

## 2. Analytics Architecture

### Event Flow

```
User action in app
  → PostHog.capture(event, properties)
  → PostHog processes (cloud)
  → Available in dashboards, funnels, cohorts

Subscription event
  → RevenueCat webhook → Supabase Edge Function
  → Edge Function calls PostHog.capture() server-side
  → Also stored in SubscriptionEvent table

Notification event
  → OneSignal tracks delivery/open
  → App tracks tap → PostHog.capture()
```

### PostHog Initialization

```ts
// src/services/posthog.ts
import PostHog from 'posthog-react-native';

const posthog = new PostHog(POSTHOG_API_KEY, {
  host: POSTHOG_HOST,
  enableSessionReplay: true, // for debugging
});

// Identify user after auth
posthog.identify(userId, {
  subscription_status: 'active',
  breed: 'golden_retriever',
  dog_age_weeks: 14,
  plan_week: 3,
});
```

---

## 3. Event Taxonomy

### Naming Convention

`{object}_{action}` in snake_case. Examples: `exercise_completed`, `paywall_presented`, `chat_message_sent`.

### Core Events

**Onboarding**:
```
onboarding_started, onboarding_screen_viewed { screen_number, screen_name },
onboarding_photo_uploaded, onboarding_breed_detected { breed, confidence },
onboarding_breed_manual_selected { breed }, onboarding_challenges_selected { challenges },
onboarding_completed { duration_seconds, breed, age_weeks, challenges }
```

**Training**:
```
exercise_viewed { exercise_id, category, week, is_trick },
exercise_started { exercise_id, category }, exercise_completed { exercise_id, category, rating, xp_earned, time_spent_seconds, is_first_completion },
exercise_skipped { exercise_id, reason }, exercise_needs_practice { exercise_id },
plan_week_started { week_number }, plan_week_completed { week_number },
plan_graduated, plan_adapted { trigger_type, changes }
```

**Tricks**:
```
trick_library_viewed, trick_pack_viewed { pack_id },
trick_started { trick_id, level }, trick_level_completed { trick_id, level, xp_earned },
trick_shared { trick_id, platform }
```

**Chat**:
```
chat_opened, chat_message_sent { message_length, is_photo },
chat_response_received { response_time_ms, tokens_used },
chat_suggested_prompt_tapped { prompt_text },
chat_feedback_given { message_id, feedback: thumbs_up/thumbs_down },
chat_limit_hit { messages_today }
```

**Gamification**:
```
xp_earned { amount, source, exercise_id }, streak_updated { count, is_milestone },
streak_broken, streak_freeze_used, score_updated { old_score, new_score },
achievement_unlocked { achievement_id, name, xp }, level_up { level, title },
challenge_started { challenge_id }, challenge_completed { challenge_id, xp },
share_card_generated { type }, share_completed { type, platform }
```

**Health**:
```
vaccination_logged { vaccine_name }, medication_logged { med_name },
weight_logged { weight, unit, within_range }, vet_visit_logged { visit_type },
health_note_created { category, severity },
health_reminder_actioned { type, action: completed/snoozed/dismissed },
health_export_generated
```

**Journal**:
```
journal_viewed { filter }, journal_entry_created { type, is_backdated },
journal_photo_uploaded, recap_viewed { month }, recap_shared { month, platform },
throwback_shown, throwback_tapped, before_after_generated, before_after_shared
```

**Subscription** (server-side via RevenueCat webhook):
```
subscription_trial_started, subscription_trial_converted, subscription_trial_expired,
subscription_renewed { count }, subscription_cancelled { reason },
subscription_expired, subscription_reactivated { offer_used },
subscription_billing_issue, subscription_billing_recovered
```

**Paywall** (tracked by Superwall + mirrored to PostHog):
```
paywall_presented { trigger, variant }, paywall_dismissed { trigger, time_on_screen },
paywall_purchase_started, paywall_purchase_completed { product, price },
paywall_purchase_failed { error }
```

**Navigation & Sessions**:
```
app_opened { source: organic/notification/deep_link },
tab_switched { tab_name }, screen_viewed { screen_name },
app_backgrounded { session_duration_seconds }
```

---

## 4. Key Dashboards

### Dashboard 1: Acquisition Funnel
```
App Install → Onboarding Started → Onboarding Completed → Paywall Viewed → Trial Started → Day 1 Exercise → Day 2 Exercise → Trial Converted
```
Track drop-off at every step. Break down by: attribution source (organic/referral/campaign), breed, platform (iOS/Android).

### Dashboard 2: Engagement
- DAU / WAU / MAU
- Exercises completed per day/week
- Chat sessions per day
- Average session duration
- Streak distribution (histogram)
- Feature usage breakdown (% using training, chat, health, journal, tricks)

### Dashboard 3: Retention
- Day 1, 3, 7, 14, 30, 60, 90 retention curves
- Retention by cohort (signup week)
- Retention by subscription status (free vs trial vs paid)
- Retention by breed (are certain breeds more engaged?)
- Feature correlation: which features predict retention?

### Dashboard 4: Revenue
- MRR / ARR
- Trial conversion rate (trending)
- Churn rate (monthly/annual)
- Revenue per install
- LTV by cohort
- Plan mix (annual vs monthly)
- Win-back conversion rate
- Failed payment recovery rate

### Dashboard 5: Training Effectiveness
- Exercise completion rate by category
- Average rating by exercise
- Adaptation trigger frequency
- Plan graduation rate
- Time to graduation
- Most skipped exercises
- Trick popularity ranking

### Dashboard 6: AI Chat
- Messages per user per day
- Response time (p50, p95)
- Token usage and cost per message
- Thumbs up/down ratio
- Safety escalation triggers
- Free limit hit rate
- Chat-to-conversion rate

---

## 5. Feature Flags (PostHog)

### Active Flags

| Flag | Purpose | Type |
|------|---------|------|
| `health_tracker_enabled` | Gradual rollout of health feature | Release (% rollout) |
| `trick_library_enabled` | Gradual rollout of tricks | Release |
| `community_feed_enabled` | Community feature gate | Release |
| `new_onboarding_flow` | Test revised onboarding | Experiment (A/B) |
| `buddy_personality_v2` | Test updated Buddy system prompt | Experiment |
| `exercise_video_hints` | Show micro-animation hints on exercises | Experiment |
| `aggressive_streak_alerts` | Test 3pm + 5pm + 8pm streak alerts | Experiment |
| `weekly_challenge_types` | Test different challenge formats | Multivariate |

### Feature Flag Usage

```ts
import { useFeatureFlag } from 'posthog-react-native';

const isHealthEnabled = useFeatureFlag('health_tracker_enabled');

if (isHealthEnabled) {
  // Show health tab
}
```

### Experiment Framework

PostHog experiments with statistical significance tracking:

1. Define hypothesis: "Adding micro-animation hints to exercises will increase completion rate by 10%"
2. Create experiment in PostHog: control (no hints) vs variant (hints)
3. Set target metric: `exercise_completed` rate
4. Set minimum sample size and significance level (95%)
5. PostHog automatically splits traffic and tracks results
6. When significant: roll out winner to 100%

---

## 6. Session Replay (PostHog)

Enable for 10% of sessions (configurable via feature flag). Captures: screen recordings (anonymized), tap events, navigation flow, errors.

**Use cases**:
- Debug why users drop off at onboarding Screen 3
- See what users do before churning
- Understand confusing UI patterns
- Reproduce bug reports

**Privacy**: Session replay masks all text inputs by default. No PII captured. Compliant with App Store guidelines.

---

## 7. User Properties

Set on PostHog identify and update on change:

```
// Identity properties
user_id, platform (ios/android), app_version, device_model, os_version

// Dog properties
breed, dog_age_weeks, dog_sex, challenges (array)

// Subscription
subscription_status, subscription_product, trial_start_date, subscription_start_date

// Engagement
plan_week, exercises_completed_total, streak_current, good_boy_score,
achievements_count, tricks_learned, journal_entries_count,
last_exercise_date, last_chat_date, last_app_open

// Attribution
attribution_source (organic/referral/campaign), campaign_id, referral_code
```

---

## 8. Data Export & Warehousing

PostHog supports data export to:
- BigQuery (for advanced SQL analysis)
- S3 (for data warehouse)
- Webhook (for real-time triggers)

**v1**: PostHog dashboards only. No external warehouse.
**v2 (post-$50K MRR)**: Export to BigQuery for advanced cohort analysis, LTV modeling, and churn prediction.

---

## 9. Acceptance Criteria

- [ ] PostHog SDK initialized with session replay
- [ ] User identified with correct properties after auth
- [ ] All core events fire correctly (verify with PostHog debugger)
- [ ] 6 key dashboards created in PostHog
- [ ] Acquisition funnel tracks end-to-end (install → paid)
- [ ] Retention cohort analysis working
- [ ] Feature flags functional (release + experiment types)
- [ ] At least 2 A/B experiments runnable
- [ ] Session replay captures 10% of sessions
- [ ] RevenueCat events mirrored to PostHog via webhook
- [ ] User properties update on relevant events
- [ ] No PII in event properties (names, emails, photos)
