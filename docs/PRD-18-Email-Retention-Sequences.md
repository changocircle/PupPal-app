# PRD #18: Email Retention & Lifecycle Sequences

## PupPal — The Channel That Works When Everything Else Fails

**Document version**: 1.0
**Feature owner**: Ashley
**Status**: Draft
**Priority**: P1 — Push notifications are PupPal's primary re-engagement tool, but email is the safety net. It's the only channel that survives app uninstalls, notification opt-outs, and device changes. It's also the highest-converting channel for trial-to-paid conversion (emails with personalized content convert 3-6x higher than generic push). Every successful subscription app — Cal AI, Noom, Headspace — runs aggressive email sequences alongside push.

---

## 1. Overview & Purpose

Email serves four distinct functions in PupPal's lifecycle:

1. **Trial conversion** — Days 0-3: maximize the probability that trial users convert to paid before the trial ends. This is the highest-ROI email sequence in the entire app.
2. **Onboarding reinforcement** — Days 0-7: drive first exercise completion, establish daily habit, reinforce value. Supplements push notifications.
3. **Retention & engagement** — Ongoing: weekly progress recaps, milestone celebrations, training tips. Keeps PupPal top-of-mind.
4. **Win-back & reactivation** — Lapsed and cancelled users: bring them back with emotional hooks, progress reminders, and promotional offers.

### Why Email + Push (Not Just Push)

| Scenario | Push | Email |
|----------|------|-------|
| User disabled notifications | ❌ | ✅ |
| User uninstalled app | ❌ | ✅ |
| User changed devices | ❌ (until reinstall) | ✅ |
| Longer-form content (tips, recaps) | ❌ (too short) | ✅ |
| Rich visuals (photos, progress charts) | Limited | ✅ |
| Click-to-action tracking | Basic | ✅ (detailed) |
| Promotional offers (win-back) | Feels spammy | ✅ (expected) |
| Legal: required trial reminders | Acceptable | ✅ (preferred) |

### Email Collection

PupPal collects email via Apple Sign-In or Google Sign-In (PRD-01). Apple allows users to hide their email (relay address). That's fine — Apple relay still delivers. For Google Sign-In, the real email is always available.

**For free-tier users who skipped the paywall without signing in**: email is not yet collected. These users see an email capture prompt:
- After first exercise completion: "Enter your email to save your progress"
- This framing is honest (they need an account to sync data) and captures the email for lifecycle sequences

### Success Metrics

| Metric | Target | How Measured |
|--------|--------|-------------|
| Email collection rate | 85%+ of all users (via auth) | Users with email / total users |
| Trial sequence open rate | 40-55% | Email platform analytics |
| Trial sequence click rate | 10-20% | Email platform analytics |
| Trial-to-paid conversion (email-attributed) | 5-10% lift vs no-email cohort | A/B: email vs no email during trial |
| Weekly recap open rate | 25-35% | Email platform analytics |
| Win-back sequence conversion | 8-15% of lapsed users return | Reactivation events |
| Unsubscribe rate | <1% per email | Email platform analytics |
| Spam complaint rate | <0.05% | Email platform (must stay under 0.1% for deliverability) |

---

## 2. Email Platform

### Recommended: Customer.io

**Why Customer.io over alternatives**:
- Event-driven (not just time-based) — triggers from Supabase events
- Native Supabase/webhook integration
- Liquid templating for personalization tokens
- A/B testing built-in
- Supports transactional + marketing in one platform
- Multi-language support (for PRD-17)
- Reasonable pricing at early stage (~$150/month for up to 12K profiles)

**Alternative**: Loops.so (simpler, cheaper, designed for product-led growth — good if budget is tight at launch)

### Integration Architecture

```
User action in app
  → Supabase DB update + Edge Function
    → Customer.io event (via API)
      → Customer.io evaluates trigger rules
        → Sends email (if conditions met)
          → Tracks open/click
            → PostHog receives engagement data (webhook)
```

### Event Flow to Customer.io

```ts
// Supabase Edge Function: send events to Customer.io
const sendEmailEvent = async (userId: string, eventName: string, data: object) => {
  await fetch('https://track.customer.io/api/v1/customers/' + userId + '/events', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(CUSTOMERIO_SITE_ID + ':' + CUSTOMERIO_API_KEY),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: eventName,
      data: {
        ...data,
        dog_name: user.dog.name,
        breed: user.dog.breed,
        locale: user.locale,
        timestamp: new Date().toISOString()
      }
    })
  });
};
```

### Events Sent to Customer.io

| Event Name | Trigger | Data |
|------------|---------|------|
| `user_created` | Account creation (auth) | email, name, locale, platform |
| `onboarding_completed` | Onboarding finished | dog_name, breed, age, challenges, experience |
| `trial_started` | Free trial begins | plan_type, trial_end_date |
| `exercise_completed` | Any exercise done | exercise_name, category, day_count, streak |
| `trial_day_1` | 24h after trial start | exercises_done, streak, gbs |
| `trial_day_2` | 48h after trial start | exercises_done, streak, gbs |
| `trial_expiring` | 12h before trial ends | converted: false, exercises_done, gbs |
| `trial_converted` | Trial → paid | plan_type, price |
| `trial_expired` | Trial ended without payment | exercises_done, gbs, days_active |
| `subscription_cancelled` | User cancelled | reason (from survey), duration, gbs |
| `subscription_expired` | Access ended | last_active, gbs, streak_at_expiry |
| `streak_milestone` | 7, 14, 30, 60, 90 days | streak_length, gbs |
| `week_completed` | Training week finished | week_number, exercises_done, gbs |
| `plan_graduated` | Completed 12-week plan | total_exercises, gbs, tricks_learned |
| `inactive_3_days` | No app open for 3 days | last_active, streak_at_risk, gbs |
| `inactive_7_days` | No app open for 7 days | last_active, gbs |
| `inactive_14_days` | No app open for 14 days | last_active, gbs |
| `inactive_30_days` | No app open for 30 days | last_active, gbs |

---

## 3. Email Sequences

### Sequence 1: Trial Onboarding (Days 0-3) — HIGHEST PRIORITY

This sequence runs for every user who starts a free trial. Its ONLY goal: get them to open the app, complete exercises, and convert before the trial ends.

**Day 0 — Welcome (sent immediately after trial start)**

```
Subject: [Name]'s training plan is ready 🐾
From: Buddy @ PupPal <buddy@puppal.app>

Hey {{user_first_name}}!

I just finished building {{dog_name}}'s personalized training plan — 
12 weeks of exercises designed specifically for 
{{age_description}} {{breed}}s.

Here's what's on the agenda for today:

📋 {{todays_exercise_1}} ({{exercise_1_time}} min)
📋 {{todays_exercise_2}} ({{exercise_2_time}} min)

Total time: about {{total_time}} minutes. That's it!

[START TRAINING →]   (deep link: puppal://training/today)

Your 3-day free trial is active. You've got full access to 
everything — let's make the most of it.

— Buddy 🐾

P.S. Got questions? Just open the app and chat with me. 
I'm available 24/7!
```

**Day 1 — Progress + Social Proof (sent at user's preferred training time)**

```
Subject: {{dog_name}} is off to a great start!
From: Buddy @ PupPal <buddy@puppal.app>

{{user_first_name}}, 

{{#if exercises_completed_day0 > 0}}
{{dog_name}} completed {{exercises_completed_day0}} exercise(s) 
yesterday! That's exactly how great training starts.

Good {{gender_title}} Score: {{gbs}} 📈
{{else}}
{{dog_name}}'s plan is ready and waiting! Most {{breed}} owners 
see results after just the first session.
{{/if}}

Today's training ({{total_time}} minutes):
📋 {{todays_exercise_1}}
📋 {{todays_exercise_2}}

[TRAIN {{dog_name}} TODAY →]

Fun fact: {{breed}}s who start training before {{age_threshold}} 
learn commands {{speed_comparison}} faster than average.

Trial reminder: You have 2 days of full access remaining.

— Buddy 🐾
```

**Day 2 — Trial Urgency + Value Recap (sent morning)**

```
Subject: ⏰ {{dog_name}}'s trial ends tomorrow
From: Buddy @ PupPal <buddy@puppal.app>

{{user_first_name}},

Quick update on {{dog_name}}'s progress so far:

✅ Exercises completed: {{total_exercises}}
📈 Good {{gender_title}} Score: {{gbs}}
🔥 Training streak: {{streak_days}} day(s)

{{#if gbs > 5}}
{{dog_name}} is already making progress! Imagine where 
you'll be in 12 weeks.
{{else}}
The first session is the hardest — after that, it gets 
easier every day. {{dog_name}} is counting on you!
{{/if}}

Your trial ends tomorrow. To keep {{dog_name}}'s plan 
and momentum going:

[CONTINUE {{dog_name}}'S TRAINING →]  (deep link: puppal://paywall)

After the trial:
✓ Full 12-week personalized plan
✓ Unlimited Buddy AI chat
✓ 30+ tricks to learn
✓ Health & vaccination tracker
✓ XP, streaks & achievements

All for {{annual_price_monthly}} per month 
({{annual_price_yearly}}/year).

— Buddy 🐾

P.S. This is your required trial reminder — your subscription 
begins tomorrow unless you cancel.
```

**Day 3 — Trial Ended / Converted**

*If converted:*
```
Subject: 🎉 {{dog_name}}'s journey officially begins!
From: Buddy @ PupPal <buddy@puppal.app>

{{user_first_name}},

Welcome to PupPal Premium! {{dog_name}} and I are going to 
have an amazing 12 weeks together.

Here's your plan at a glance:

📅 Weeks 1-2: Quick wins ({{primary_challenge}} focus)
📅 Weeks 3-6: Core training (commands, socialization, habits)
📅 Weeks 7-12: Advanced goals + first tricks

Today's training is ready:
[START TODAY'S SESSION →]

— Buddy 🐾
```

*If trial expired without conversion:*
```
Subject: {{dog_name}}'s plan is still here
From: Buddy @ PupPal <buddy@puppal.app>

{{user_first_name}},

Your free trial ended, but {{dog_name}}'s training plan 
is saved and waiting.

{{#if gbs > 0}}
You already got {{dog_name}}'s Good {{gender_title}} Score 
to {{gbs}} — that's real progress! Don't let it slip.
{{/if}}

You still have access to:
✓ Week 1 training exercises
✓ 3 Buddy messages per day
✓ Basic health tracking

To unlock the full 12-week plan:
[UPGRADE TO PREMIUM →]

— Buddy 🐾
```

---

### Sequence 2: Habit Formation (Days 1-14, all users)

Supplements push notifications. Only sends if user has NOT completed an exercise that day (checked at send time).

| Day | Subject | Purpose |
|-----|---------|---------|
| 1 | "{{dog_name}}'s first week: what to expect" | Set expectations, reduce overwhelm |
| 3 | "The #1 mistake {{breed}} owners make" | Breed-specific tip, drives app open |
| 5 | "{{dog_name}}'s 5-day report card" | Progress recap, GBS update, streak status |
| 7 | "One week! Here's what {{dog_name}} learned" | Celebration + Week 2 preview |
| 10 | "{{dog_name}} vs. the average {{breed}}" | Competitive/comparative hook |
| 14 | "Two weeks in — {{dog_name}}'s transformation" | Before/after framing, reinforcement |

**Rules**:
- Skip sending if user was active in the app in the last 6 hours (they don't need an email)
- Skip Day X email if a higher-priority sequence email (trial, win-back) is scheduled that day
- All emails include deep link to "Today's Training"
- Unsubscribe from this sequence does NOT unsubscribe from transactional (trial reminders, receipts)

---

### Sequence 3: Weekly Progress Recap (Ongoing, premium users)

Sent every Sunday evening (or user's last active day of the week). The one email most users actually look forward to.

```
Subject: {{dog_name}}'s Week {{week_number}} Report 📊
From: Buddy @ PupPal <buddy@puppal.app>

Hey {{user_first_name}}, here's {{dog_name}}'s weekly report:

📈 GOOD {{GENDER_TITLE}} SCORE
   {{gbs_start}} → {{gbs_end}} (+{{gbs_change}})
   {{#if gbs_change > 5}}Great week! 🎉{{/if}}

🔥 STREAK
   {{streak_days}} days ({{streak_status}})

✅ TRAINING
   {{exercises_completed}} / {{exercises_available}} exercises
   {{#if completion_rate >= 80}}Crushing it!
   {{else if completion_rate >= 50}}Solid progress!
   {{else}}Every bit counts — even 1 exercise a day makes a difference.
   {{/if}}

🏆 ACHIEVEMENTS
   {{#if new_achievements > 0}}
   New: {{achievement_names}}
   {{else}}
   {{closest_achievement_name}}: {{closest_achievement_progress}}% complete
   {{/if}}

🐾 NEXT WEEK PREVIEW
   Focus: {{next_week_focus}}
   New exercises: {{next_week_new_exercises}}

[SEE FULL REPORT →]

— Buddy 🐾
```

**Rules**:
- Only sent to users who completed at least 1 exercise that week (don't send "you did nothing" emails)
- If no exercises completed, move user to re-engagement sequence instead
- Include "Share your progress" CTA with link to generate share card

---

### Sequence 4: Milestone Celebrations (Event-driven)

Triggered by specific achievements. These are the most shareable emails.

| Trigger | Subject | Content |
|---------|---------|---------|
| 7-day streak | "🔥 {{dog_name}} is on FIRE! 7-day streak!" | Streak graphic + encouragement |
| 30-day streak | "30 DAYS! {{dog_name}} is unstoppable" | Celebration + share CTA |
| GBS hits 25 | "{{dog_name}} is officially 'Making Progress'!" | Score gauge graphic |
| GBS hits 50 | "HALFWAY! {{dog_name}}'s score is 50+" | Milestone comparison |
| GBS hits 75 | "{{dog_name}} is a WELL-TRAINED PUP!" | Celebration + share card |
| Week 4 complete | "Month 1: done! Here's {{dog_name}}'s growth" | Before/after stats |
| Week 12 complete | "🎓 {{dog_name}} GRADUATED! Full report inside" | Graduation certificate CTA |
| First trick mastered | "{{dog_name}} learned {{trick_name}}! 🎉" | Trick highlight + share |
| 10 tricks mastered | "{{dog_name}} knows 10 tricks! Show-off time 🌟" | Trick gallery |

**Rules**:
- Max 2 milestone emails per week (batch if multiple milestones hit in same week)
- Always include a share CTA (drives referral loop)
- Include deep link to achievement detail screen

---

### Sequence 5: Re-engagement (Lapsed Users)

Triggered when a user stops opening the app. Escalates over time.

| Day Inactive | Subject | Approach |
|-------------|---------|----------|
| 3 | "{{dog_name}} has training waiting!" | Gentle reminder, today's exercise |
| 7 | "Buddy misses {{dog_name}}! 🐾" | Emotional hook, streak status |
| 14 | "{{dog_name}}'s Good {{gender_title}} Score update" | Show score declining/stalling |
| 21 | "Quick 5-min session for {{dog_name}}?" | Lower the bar, suggest easiest exercise |
| 30 | "We saved {{dog_name}}'s progress" | Reassurance, "pick up where you left off" |
| 45 | "What happened? (Quick survey)" | Feedback request, shows you care |
| 60 | Last email: "{{dog_name}}'s plan expires in 30 days" | Urgency (data retention warning) |
| 90 | Move to suppressed. Stop all non-transactional email. | Respect their decision |

**Rules**:
- If user opens the app during sequence, cancel remaining re-engagement emails and resume normal sequences
- Never send re-engagement AND weekly recap in the same week
- Day 45 survey captures: too busy / dog trained / not helpful / too expensive / other

---

### Sequence 6: Win-Back (Cancelled/Expired Subscribers)

Aligns with PRD-06 win-back strategy but via email channel.

| Day Post-Expiry | Subject | Offer |
|----------------|---------|-------|
| 0 | "Your premium access ended" | No offer — just confirmation + what they keep |
| 3 | "{{dog_name}}'s streak was {{streak}} days..." | No offer — emotional hook |
| 7 | "New this week in PupPal" | No offer — FOMO (new content, features) |
| 14 | "Special offer: 50% off for {{dog_name}}" | $19.99/yr (50% off annual) |
| 30 | "40% off — {{dog_name}}'s plan is waiting" | $23.99/yr (40% off) |
| 60 | "Last chance: 60% off annual" | $15.99/yr (60% off, final offer) |
| 90 | Final: "We'll keep {{dog_name}}'s data safe" | No offer — close gracefully |

**Rules**:
- Promotional offers delivered via RevenueCat promotional offers (Apple Promotional Offers / Google Developer Determined Offers)
- Deep link from email → Superwall paywall with pre-applied offer
- If user resubscribes at any point, cancel remaining win-back emails immediately
- Track which offer tier converts best → optimize sequence

---

### Sequence 7: Plan Graduation & Post-Grad Retention

After the user completes the 12-week plan, the risk of churn spikes because the "problem" (untrained puppy) is solved. This sequence transitions them into the Trick Library as the new engagement anchor.

| Day Post-Grad | Subject | Content |
|--------------|---------|---------|
| 0 | "🎓 {{dog_name}} GRADUATED! Your certificate is ready" | Graduation certificate + full stats recap |
| 3 | "What's next? Meet the Trick Library" | Introduce tricks as the next chapter |
| 7 | "{{dog_name}} could learn {{suggested_trick}} this week" | Specific trick recommendation based on breed |
| 14 | "Trick spotlight: {{popular_trick}} — most shared trick on PupPal!" | Social proof + trick preview |
| 30 | "{{dog_name}}'s one-month checkup: how are those habits?" | Maintenance tips + refresher exercises |

---

## 4. Email Design System

### From Name & Address

- **Marketing/lifecycle**: `Buddy @ PupPal <buddy@puppal.app>`
- **Transactional** (receipts, password reset): `PupPal <no-reply@puppal.app>`
- **Reply-to**: `support@puppal.app` (so users can reply to marketing emails and reach support)

### Template Design Principles

- **Mobile-first**: 90%+ of PupPal users are on mobile. Single-column, large tap targets, 14px+ body text
- **Branded but light**: PupPal coral accent color for CTAs, Buddy avatar in header. No heavy graphics (they slow load and get clipped)
- **One CTA per email**: Every email has ONE primary action. Don't split attention
- **Buddy's voice**: Emails are written as if Buddy is talking. Warm, encouraging, uses the dog's name constantly
- **Short**: Trial emails < 150 words. Recaps < 250 words. Nobody reads long emails

### Template Structure

```
┌─────────────────────────────────────┐
│  [PupPal logo]        [Buddy avatar]│  ← Header (minimal)
├─────────────────────────────────────┤
│                                     │
│  Hey {{first_name}},                │  ← Personal greeting
│                                     │
│  [2-4 sentences of content]         │  ← Body (short, punchy)
│                                     │
│  [KEY STAT OR DATA POINT]           │  ← Personalized metric
│                                     │
│  ┌─────────────────────────┐        │
│  │   PRIMARY CTA BUTTON    │        │  ← Single CTA (coral)
│  └─────────────────────────┘        │
│                                     │
│  — Buddy 🐾                         │  ← Sign-off
│                                     │
├─────────────────────────────────────┤
│  [Unsubscribe] · [Manage prefs]     │  ← Footer (required)
│  PupPal, Inc. · [Address]           │
└─────────────────────────────────────┘
```

### Personalization Tokens

| Token | Source | Example |
|-------|--------|---------|
| `{{user_first_name}}` | Auth profile | "Ashley" |
| `{{dog_name}}` | Dog profile | "Luna" |
| `{{breed}}` | Dog profile | "Golden Retriever" |
| `{{age_description}}` | Calculated from age_in_weeks | "14-week-old" |
| `{{gender_title}}` | Dog profile sex field | "Boy" / "Girl" / "Pup" |
| `{{gbs}}` | Gamification | "34" |
| `{{streak_days}}` | Gamification | "12" |
| `{{exercises_completed}}` | Training plan | "8" |
| `{{todays_exercise_1}}` | Today's plan | "Cue Word Reinforcement" |
| `{{annual_price_yearly}}` | RevenueCat / locale | "$39.99" |
| `{{annual_price_monthly}}` | Calculated | "$3.33" |
| `{{primary_challenge}}` | Onboarding data | "potty training" |
| `{{next_week_focus}}` | Plan engine | "Leash walking foundations" |

### Deep Links in Emails

All CTAs use universal links that handle both installed and not-installed states:

| CTA | Deep Link | Fallback (not installed) |
|-----|-----------|--------------------------|
| Start Training | `https://puppal.app/open/training/today` | App Store page |
| View Progress | `https://puppal.app/open/profile/progress` | App Store page |
| Upgrade | `https://puppal.app/open/paywall?source=email&offer={{offer_id}}` | App Store page |
| Share Achievement | `https://puppal.app/open/achievement/{{id}}` | App Store page |

---

## 5. Email Preferences & Compliance

### User Email Preferences

Managed in Settings (PRD-14) and in email footer "Manage Preferences" link:

| Category | Default | Description |
|----------|---------|-------------|
| Training reminders | ON | Daily exercise reminders (if no push) |
| Weekly reports | ON | Sunday progress recaps |
| Milestone celebrations | ON | Achievement, streak, GBS milestones |
| Product updates | ON | New features, content |
| Promotional offers | ON | Win-back, upsell offers |
| Trial/subscription alerts | ALWAYS ON (transactional) | Cannot unsubscribe — legally required |

### Compliance Requirements

| Requirement | Implementation |
|-------------|----------------|
| CAN-SPAM (US) | Physical address in footer, clear unsubscribe, honor within 10 days |
| GDPR (EU) | Explicit opt-in at account creation, granular preferences, data export/deletion |
| CASL (Canada) | Express consent required, identify sender, unsubscribe mechanism |
| LGPD (Brazil) | Similar to GDPR — consent-based, right to deletion |
| Apple relay emails | Customer.io supports sending to Apple relay addresses |
| SPF/DKIM/DMARC | Configure for puppal.app domain — required for deliverability |
| Unsubscribe header | RFC 8058 one-click unsubscribe (Gmail requires this) |

### Suppression Rules

- User unsubscribes from a category → suppress that category only, not all email
- User marks as spam → suppress ALL non-transactional email permanently
- Hard bounce → remove from all lists
- Soft bounce → retry 3 times over 72 hours, then suppress
- 90 days inactive (no opens) → move to suppressed list, send one final "still interested?" email
- User deletes account → purge from Customer.io within 24 hours

---

## 6. A/B Testing Strategy

### What to Test

| Element | Variant A | Variant B | Metric |
|---------|-----------|-----------|--------|
| Subject line | Dog name in subject | No dog name | Open rate |
| Subject line | Emoji vs no emoji | | Open rate |
| Send time (trial) | Morning (9am local) | Evening (7pm local) | Open rate + click rate |
| CTA copy | "Start Training" | "Train {{dog_name}} Now" | Click rate |
| Trial urgency | Countdown ("2 days left") | Value focus ("Here's what you'll learn") | Conversion |
| Win-back offer timing | Day 14 (50% off) | Day 7 (50% off) | Reactivation rate |
| Weekly recap day | Sunday evening | Monday morning | Open rate |
| Email length | Short (< 100 words) | Medium (150-200 words) | Click rate |
| From name | "Buddy @ PupPal" | "PupPal" | Open rate |

### Testing Rules

- Minimum 1,000 recipients per variant before declaring a winner
- Run each test for at least 7 days
- One test per sequence at a time (don't stack)
- Winner auto-applies after confidence threshold (95%)

---

## 7. Integration Points

### With Onboarding (PRD #01)
- Email collected via Apple/Google Sign-In → synced to Customer.io as user profile
- Onboarding data (dog name, breed, age, challenges) populates personalization tokens
- `onboarding_completed` event triggers Sequence 1 (trial) enrollment

### With Training Plan (PRD #03)
- Today's exercises populate email content tokens
- Exercise completion events drive habit formation and recap sequences
- Week completion events trigger milestone emails

### With Gamification (PRD #04)
- GBS, streak, achievements, level data populate email tokens
- Milestone events (streak 7, GBS 25, etc.) trigger celebration emails
- Share CTA in celebration emails uses the same share card generator (PRD-08)

### With Paywall & Subscriptions (PRD #06)
- Trial start/end events trigger trial conversion sequence
- Subscription cancelled/expired events trigger win-back sequence
- Promotional offer codes from RevenueCat embedded in win-back email CTAs

### With Push Notifications (PRD #09)
- Email and push coordinate, not duplicate. If push was opened today, skip today's email
- Email is the fallback when push is disabled or ineffective
- Both channels use the same personalization tokens (from Supabase)
- Customer.io can check OneSignal push delivery status before sending email (optional advanced integration)

### With Localization (PRD #17)
- All email templates translated per supported language
- Customer.io sends in user's locale
- Subject lines A/B tested per language (what works in English may not work in Spanish)

### With Analytics (PRD #13)
- Email engagement events (open, click, unsubscribe) sent to PostHog via Customer.io webhook
- Attribution: track which emails drove app opens, exercise completions, conversions
- Dashboard: email performance by sequence, by cohort, by locale

---

## 8. Data Model

### User Email Profile (synced to Customer.io)

```
-- Customer.io user attributes (synced from Supabase)
customer_io_id: string (= user.id)
email: string
first_name: string
locale: string
timezone: string
platform: enum (ios / android)
created_at: timestamp

-- Dog attributes
dog_name: string
dog_breed: string
dog_age_weeks: integer
dog_gender: enum (male / female / unknown)
challenges: array of string
experience_level: string

-- Subscription attributes
subscription_status: string
subscription_plan: string
trial_started_at: timestamp (nullable)
trial_ends_at: timestamp (nullable)
subscription_expires_at: timestamp (nullable)

-- Engagement attributes
gbs: integer
streak_days: integer
total_exercises: integer
current_plan_week: integer
last_active_at: timestamp
last_exercise_at: timestamp
```

### Email Event Log (Supabase)

```
EmailEvent {
  id: UUID
  user_id: UUID
  email_id: string          // Customer.io message ID
  sequence: string          // "trial_day0", "recap_weekly", etc.
  event_type: enum (sent / delivered / opened / clicked / bounced / unsubscribed / complained)
  link_clicked: string (nullable)  // Which CTA was clicked
  created_at: timestamp
}
```

### Email Preferences (Supabase — synced to Customer.io)

```
EmailPreferences {
  user_id: UUID (FK)
  training_reminders: boolean (default true)
  weekly_reports: boolean (default true)
  milestone_celebrations: boolean (default true)
  product_updates: boolean (default true)
  promotional_offers: boolean (default true)
  updated_at: timestamp
}
```

---

## 9. Analytics Events

```
// Email lifecycle
email_sent                  { sequence, email_id, locale }
email_delivered             { sequence, email_id }
email_opened                { sequence, email_id, time_since_sent }
email_clicked               { sequence, email_id, link, time_since_sent }
email_bounced               { sequence, email_id, bounce_type: hard | soft }
email_unsubscribed          { sequence, email_id, category }
email_complained            { sequence, email_id }

// Attribution
email_attributed_app_open   { sequence, email_id, time_to_open }
email_attributed_exercise   { sequence, email_id, exercise_id }
email_attributed_conversion { sequence, email_id, plan_type, revenue }
email_attributed_reactivation { sequence, email_id, days_inactive }

// Preferences
email_preferences_changed   { category, old_value, new_value, source: settings | email_link }
```

---

## 10. Edge Cases

| Scenario | Handling |
|----------|----------|
| User has Apple relay email (hidden) | Works normally — Apple relay delivers. Track deliverability separately for relay vs real emails. |
| User signed up but never completed onboarding | Send simplified sequence: "Your training plan is waiting!" No dog-specific tokens (use generic "your puppy"). |
| Multiple dogs (PRD-11) | Use primary dog for email personalization. If both dogs have activity, mention both in weekly recap. |
| User changes dog name | Customer.io profile updates on next sync. Next email uses new name. |
| User changes email (re-auth) | Update Customer.io profile. Verify new email deliverability. |
| Email client blocks images | All emails readable without images. Alt text on all images. Critical info in text, not graphics. |
| User in timezone with no time data | Default to UTC-5 (EST) for send time. Update when app reports timezone. |
| Trial started but 0 exercises completed | Day 1 email shifts from "progress" to "getting started" variant. Emphasis on how easy first exercise is. |
| User unsubscribes via email link but wants emails back | Settings → Email Preferences → toggle categories back on. Syncs to Customer.io within 1 hour. |
| Email + push both configured for same trigger | Check: if push was delivered and opened in last 2 hours, skip email. If push was not opened, send email as backup. |
| Win-back email sent, user resubscribes same day | Cancel remaining win-back sequence immediately (Customer.io event trigger). |
| User reports email as spam | Auto-suppress ALL marketing email. Flag in Supabase. Never send marketing again unless they explicitly re-opt-in. |
| GDPR deletion request | Purge from Customer.io + Supabase within 24 hours. Log deletion for compliance audit. |

---

## 11. Dependencies

| Dependency | Purpose | Fallback |
|------------|---------|----------|
| Customer.io | Email platform (sequences, A/B testing, analytics) | Loops.so (simpler) or SendGrid (manual sequences) |
| Supabase Edge Functions | Event relay to Customer.io | Direct API calls from client (less reliable) |
| RevenueCat | Subscription events for trial/win-back sequences | Webhook from App Store / Google Play (raw) |
| PostHog | Email attribution analytics | Customer.io built-in analytics (limited) |
| OneSignal | Push delivery status (for email/push coordination) | Send both, accept some duplication |
| SPF/DKIM/DMARC | Email authentication for puppal.app domain | Required — no fallback. Must configure. |
| Universal Links | Deep links from email CTAs | App Store fallback |
| Share card generator (PRD #08) | Milestone email share CTAs | Static share link without card |

---

## 12. Acceptance Criteria

- [ ] Customer.io integrated with Supabase via Edge Functions
- [ ] All user attributes synced to Customer.io on creation and update
- [ ] All events from Section 2 fire correctly to Customer.io
- [ ] Trial Sequence (Days 0-3) sends at correct timing with correct tokens
- [ ] Habit Formation Sequence (Days 1-14) sends only if no exercise that day
- [ ] Weekly Recap sends every Sunday with accurate stats
- [ ] Milestone emails trigger on correct events (streak 7, GBS 25, etc.)
- [ ] Re-engagement sequence triggers at Day 3, 7, 14, 21, 30, 45, 60 of inactivity
- [ ] Win-back sequence triggers on subscription expiry with correct offers
- [ ] Post-graduation sequence triggers on Week 12 completion
- [ ] All personalization tokens resolve correctly (no `{{undefined}}` in production)
- [ ] Deep links in emails open correct app screens (or App Store if not installed)
- [ ] Email preferences screen in Settings works and syncs to Customer.io
- [ ] Unsubscribe link in email footer works per category (not all-or-nothing)
- [ ] Spam complaint auto-suppresses all marketing email
- [ ] Hard bounces auto-remove from all lists
- [ ] SPF/DKIM/DMARC configured and verified for puppal.app
- [ ] Email/push coordination: skip email if push opened within 2 hours
- [ ] A/B test framework running on at least 1 subject line test
- [ ] All email events logged to PostHog for attribution dashboards
- [ ] Localized email templates ready for Phase 1 languages (PRD-17)
- [ ] All emails pass CAN-SPAM, GDPR, and CASL requirements
- [ ] All emails render correctly on iOS Mail, Gmail, Outlook (mobile + desktop)
