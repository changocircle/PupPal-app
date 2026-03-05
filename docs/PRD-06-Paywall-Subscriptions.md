# PRD #06: Paywall & Subscription System

## PupPal — The Revenue Engine

**Document version**: 1.0
**Feature owner**: Ashley
**Status**: Draft
**Priority**: P0 — No revenue, no business.

---

## 1. Overview & Purpose

The Paywall & Subscription System manages the complete revenue lifecycle: trial initiation, subscription management, paywall presentation, upgrade prompts, failed payment recovery, cancellation handling, and win-back flows.

**Two-vendor architecture**:
- **RevenueCat** handles all subscription logic (Apple/Google IAP, receipt validation, entitlements, webhooks, subscription status)
- **Superwall** handles all paywall UI (presentation, A/B testing, dynamic configuration — no app update needed)

RevenueCat is the source of truth for "is this user premium?" Superwall controls "what does the paywall look like and when does it show?"

### Revenue Targets

| Milestone | Target | Timeline |
|-----------|--------|----------|
| First paying user | $39.99 ARR | Week 1 post-launch |
| 100 subscribers | ~$4K MRR | Month 1 |
| 1,000 subscribers | ~$33K MRR | Month 3 |
| 3,000 subscribers | ~$100K MRR | Month 6 |

### Success Metrics

| Metric | Target |
|--------|--------|
| Trial start rate | 60%+ of paywall views |
| Trial to paid conversion | 55-65% |
| Free to paid overall | 8-12% of installs |
| Monthly churn | <5% |
| Annual renewal rate | 70%+ |
| Revenue per install | $3-5 |
| Failed payment recovery | 40%+ |

---

## 2. Subscription Products

| Product ID | Name | Price | Trial | Billing |
|-----------|------|-------|-------|---------|
| `puppal_annual` | PupPal Annual | $39.99/year | 3-day free | Auto-renewing |
| `puppal_monthly` | PupPal Monthly | $9.99/month | None | Auto-renewing |
| `puppal_lifetime` | PupPal Lifetime | $79.99 one-time | None | Non-renewing |

Annual is the hero. Monthly is the price anchor ($3.33/mo vs $9.99/mo = 67% savings). Lifetime added post-launch once LTV data confirms pricing.

### RevenueCat Configuration

- **Entitlement**: `premium` — single entitlement gates ALL premium features
- **Offering**: `default` — contains all products
- **App User ID**: Mapped to Supabase `auth.uid()`

### Checking Premium Status

```ts
// src/hooks/useSubscription.ts — the ONLY way to check premium
const useSubscription = () => {
  const { data: customerInfo } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => Purchases.getCustomerInfo(),
    staleTime: 5 * 60 * 1000,
  });

  const isPremium = customerInfo?.entitlements?.active?.['premium'] !== undefined;
  const isTrialing = customerInfo?.entitlements?.active?.['premium']?.periodType === 'trial';
  const expirationDate = customerInfo?.entitlements?.active?.['premium']?.expiresDate;
  const willRenew = customerInfo?.entitlements?.active?.['premium']?.willRenew;

  return { isPremium, isTrialing, expirationDate, willRenew };
};
```

---

## 3. Paywall Triggers

| Trigger Event | When | Context |
|---------------|------|---------|
| `onboarding_complete` | Screen 8 | Primary conversion. Highest-intent moment. |
| `feature_gate_week2` | Accessing Week 2+ | "Unlock [Name]'s full plan" |
| `feature_gate_chat` | 3 msg/day limit hit | "Unlimited Buddy access" |
| `feature_gate_health` | Full health tracker | "Track [Name]'s vaccinations" |
| `feature_gate_tricks` | Locked trick content | "Unlock all tricks" |
| `streak_milestone_7` | 7-day streak | Celebration paywall |
| `plan_week1_complete` | Week 1 finished | "Unlock weeks 2-12" |
| `buddy_upsell` | Buddy references premium | Contextual upsell |
| `settings_upgrade` | Manual upgrade tap | Always available |

### Superwall Integration

```ts
// Set user attributes for paywall personalization
Superwall.setUserAttributes({
  dog_name: dog.name,
  breed: dog.breed,
  age_weeks: dog.ageInWeeks,
  streak_days: streak.currentStreak,
  good_boy_score: gamification.goodBoyScore,
});

// Trigger paywall
const result = await Superwall.register('feature_gate_week2');
if (result === 'purchased' || result === 'restored') {
  navigateToWeek(2);
}
```

---

## 4. Paywall Design Variants

### Primary Paywall (Onboarding)

- Personalized headline: "Start [Name]'s 3-day free trial"
- Visual timeline: Today → Day 2 (Reminder) → Day 3 (Trial ends)
- Annual card: selected, coral border, "Best Value" gold badge, "$3.33/month", "Save 67%"
- Monthly card: unselected, gray border, anchor pricing
- Feature list: 5 checkmarks (plan, Buddy, tricks, health, journal)
- Reassurance: "No payment now / Cancel anytime / Reminder before charge"
- CTA: "Start Free Trial →"
- Footer: "Restore purchases · Terms"

### Feature Gate Paywall

- Lock icon + context headline ("Unlock [Name]'s full plan")
- Preview of locked content
- Same plan cards
- CTA: "Start Free Trial →"

### Celebration Paywall

- Streak/milestone celebration header
- Emotional hook: "Don't lose momentum"
- Same plan cards
- CTA: "Keep [Name]'s Streak →"

---

## 5. A/B Testing Plan (Superwall)

| Test | Variants | Metric |
|------|----------|--------|
| Annual price | $29.99 / $39.99 / $49.99 | Revenue per paywall view |
| Monthly price | $7.99 / $9.99 / $14.99 | Monthly selection rate |
| Trial length | 3-day / 7-day | Trial-to-paid conversion |
| CTA copy | "Start Free Trial" / "Start [Name]'s Journey" / "Try Premium Free" | Tap rate |
| Gate timing | Week 2 start / Week 1 Day 5 / Week 2 + 24hr delay | Conversion at gate |
| Close button delay | Immediate / 2s / 3s | Conversion (vs frustration) |
| Social proof | None / "Join 10K+ parents" / "Rated 4.8★" | Conversion lift |

---

## 6. Trial Management

### Trial Timeline Notifications

| Day | Copy |
|-----|------|
| 0 | "Welcome! [Name]'s plan is ready. Let's start!" |
| 1 | "[Name] completed 3 exercises! Score: 8." |
| 2 | "Trial ends tomorrow. [Name]'s made great progress!" (Apple required) |
| 3 | "Premium active. [Name]'s training continues!" |

### Trial Conversion Strategy

Day 1: plan ready instantly, Buddy proactive tip, first exercise + XP + streak start. Day 2: streak at 2, Buddy follow-up, GBS visible at 5-8. Day 3: pre-charge reminder framed as "training continues."

### Trial Expiry (No Payment)

- Access ends at trial expiration, not at cancellation
- Downgrade to free: Week 1, 3 messages/day, limited health
- ALL data preserved (never deleted)
- Streak continues if completing free exercises
- GBS visible but stops updating past Week 1
- Win-back flow activates

---

## 7. Subscription Lifecycle

### States

```
none → trialing → active → (renewed...)
                         → cancelled → expired
                         → grace_period → billing_retry → recovered OR expired
                         → revoked (refunded)
                         → paused (Google only)
```

### RevenueCat Webhook → Supabase Edge Function

```
POST /api/webhooks/revenuecat
```

| Event | Action |
|-------|--------|
| INITIAL_PURCHASE | status = active, log analytics |
| RENEWAL | confirm active, log renewal |
| CANCELLATION | status = cancelled, trigger win-back |
| BILLING_ISSUE | status = grace_period, send payment notification |
| EXPIRATION | status = expired, downgrade to free, win-back |
| PRODUCT_CHANGE | update product, log plan switch |
| REFUND | status = revoked, revoke immediately |

Webhook handler verifies HMAC signature, updates user record, triggers downstream actions, logs to PostHog. All operations idempotent.

---

## 8. Failed Payment Recovery

### Grace Period (6-16 days)

- User KEEPS premium (don't punish for bank issue)
- Subtle banner: "Payment needs attention. Update to keep [Name]'s training."
- Links to device subscription settings
- Buddy mentions once gently

### Billing Retry (up to 60 days)

- Access may be revoked by platform
- Push notification sequence: Day 1, 3, 7, 14

### Recovery rate target: 40%+

---

## 9. Win-Back & Re-engagement

### Cancellation Survey

On next app open after cancel: "Why did you cancel?" Multiple choice (too expensive / dog trained / not helpful / don't use enough / tech issues / other). Store in CancellationSurvey table.

### Win-Back Sequence

| Day | Copy | Offer |
|-----|------|-------|
| 0 (expiry) | "Premium ended. Progress saved." | None |
| 3 | "Streak was [X] days, score was [Y]. Don't lose it." | None |
| 7 | "Buddy misses [Name]! Teach a new trick." | None |
| 14 | "Special: 50% off annual for [Name]." | $19.99/yr |
| 30 | "40% off. [Name]'s plan is waiting." | $23.99/yr |
| 60 | "Last chance: 60% off." | $15.99/yr |

Promotional offers via RevenueCat (Apple Promotional Offers / Google Developer Determined Offers).

### Exit Offer (Before Cancel)

When user taps "Cancel" in settings → show Superwall exit offer screen before linking to Apple/Google. Offer: switch plan or 30% off next renewal.

---

## 10. Restore Purchases

- Available on paywall ("Restore purchases" link)
- Available in Settings
- On fresh install + sign-in: auto-attempt via RevenueCat alias
- `Purchases.restorePurchases()` → check entitlement → grant access or show "No subscription found"

---

## 11. Subscription Management Screen

**Premium user**: Status card (plan, status, renewal date, price), "Manage Subscription" (→ Apple/Google), "Change Plan", "Restore", FAQ.

**Free user**: Current limits card, "Upgrade to Premium" button (→ Superwall), "Restore".

---

## 12. Data Model

```
-- On users table:
subscription_status: enum (none/trialing/active/grace_period/billing_retry/paused/cancelled/expired/revoked)
subscription_product: string (nullable)
subscription_platform: enum (apple/google) (nullable)
subscription_started_at: timestamp (nullable)
subscription_expires_at: timestamp (nullable)
subscription_cancelled_at: timestamp (nullable)
subscription_updated_at: timestamp (nullable)
trial_started_at: timestamp (nullable)
trial_ends_at: timestamp (nullable)
revenuecat_id: string (nullable)

SubscriptionEvent {
  id: UUID
  user_id: UUID
  event_type: string
  product_id: string
  price: float (nullable)
  currency: string (nullable)
  platform: enum (apple/google)
  event_data: JSON
  created_at: timestamp
}

CancellationSurvey {
  id: UUID
  user_id: UUID
  reason: enum (too_expensive/dog_trained/not_helpful/low_usage/tech_issues/other)
  reason_text: string (nullable)
  product_at_cancel: string
  subscription_duration_days: integer
  created_at: timestamp
}
```

---

## 13. API Endpoints

```
POST /api/webhooks/revenuecat           — Webhook handler (signature verified)
GET /api/subscription/status             — Current status (from RevenueCat cache + DB)
POST /api/subscription/cancel-survey     — Submit cancellation reason
GET /api/subscription/win-back-offer     — Get current promotional offer for lapsed user
POST /api/subscription/log-event         — Manual event logging (for analytics)
```

---

## 14. Analytics Events

```
// Paywall
paywall_presented, paywall_dismissed, paywall_product_selected,
paywall_purchase_started, paywall_purchase_completed, paywall_purchase_failed,
paywall_purchase_cancelled, paywall_restore_tapped, paywall_restore_success

// Subscription
subscription_trial_started, subscription_trial_converted, subscription_trial_expired,
subscription_renewed, subscription_cancelled, subscription_expired,
subscription_reactivated, subscription_billing_issue, subscription_billing_recovered,
subscription_refunded, subscription_plan_changed

// Win-back
winback_notification_sent, winback_offer_presented, winback_offer_accepted,
winback_offer_dismissed, exit_offer_presented, exit_offer_accepted
```

---

## 15. Edge Cases

| Scenario | Handling |
|----------|----------|
| Cancel then immediately re-subscribe | RevenueCat handles. New subscription starts at current period end. |
| Cross-platform (iOS subscribe, Android use) | RevenueCat syncs via app_user_id. Works automatically. |
| Family sharing | RevenueCat handles. Family member gets entitlement. |
| Refund from Apple | REFUND webhook → revoke immediately. |
| Reinstall | Sign-in → restorePurchases() → entitlement restored. |
| IAP dialog fails | Show retry. "Purchase couldn't complete. Try again?" |
| Monthly → annual switch | RevenueCat proration. Immediate switch, credit unused monthly. |
| Annual → monthly | Takes effect at renewal. Annual continues until expiry. |
| Superwall fails to load | Fallback to hardcoded native paywall (basic but functional). |
| RevenueCat SDK down | Cached status works. Purchases may fail. "Try again later." |
| Duplicate webhooks | Handler is idempotent. Safe to reprocess. |

---

## 16. Dependencies

| Dependency | Purpose | Fallback |
|------------|---------|----------|
| RevenueCat | Subscription management | Direct StoreKit/Billing (massive effort) |
| Superwall | Paywall A/B testing | Hardcoded native paywall |
| App Store Connect | iOS products | Required |
| Google Play Console | Android products | Required |
| Supabase Edge Functions | Webhook processing | Cloud function |
| OneSignal | Win-back notifications | Expo Notifications |
| PostHog | Conversion analytics | RevenueCat charts |

---

## 17. Acceptance Criteria

- [ ] RevenueCat initialized, Superwall configured with all 9 triggers
- [ ] Paywall renders <500ms with personalized dog name
- [ ] Annual selected by default with "Best Value" badge
- [ ] Purchase flow: trial start → premium activated
- [ ] `useSubscription()` reports isPremium, isTrialing correctly
- [ ] Subscription status cached, works offline
- [ ] Restore purchases works on reinstall
- [ ] Webhook processes all event types, updates DB
- [ ] Webhook signature verified
- [ ] Day 2 trial reminder sent (Apple required)
- [ ] Cancellation triggers win-back sequence
- [ ] Failed payment shows banner with update link
- [ ] Win-back notifications at Day 0, 3, 7, 14, 30, 60
- [ ] Promotional offers apply for lapsed users
- [ ] Exit offer shown before cancel link
- [ ] Cancellation survey captures reason
- [ ] Settings shows correct status and management
- [ ] Fallback paywall renders if Superwall fails
- [ ] All analytics events fire correctly
- [ ] Full funnel trackable in PostHog
