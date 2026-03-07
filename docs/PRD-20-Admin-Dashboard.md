# PRD #20: Admin Dashboard & Internal Analytics

## PupPal — Command Center: See Everything, Control Everything

**Document version**: 1.0
**Feature owner**: Ashley
**Status**: Draft
**Priority**: P1 — You can't optimize what you can't see. Every subscription app that scales has an internal dashboard where the founder can see real-time revenue, churn, LTV, acquisition channels, and user behavior without digging through three different analytics tools. This is non-negotiable for making data-driven decisions and for telling a compelling acquisition story to investors/acquirers.

---

## 1. Overview & Purpose

The Admin Dashboard is PupPal's internal command center — a web application accessible only to the team (not end users). It consolidates data from every system (Supabase, RevenueCat, PostHog, OneSignal, Customer.io, Superwall, partner program) into a single interface with real-time and historical views.

### What This Is NOT

- Not a user-facing feature (no App Store impact, no mobile implementation)
- Not a replacement for PostHog (PostHog remains the event analytics engine)
- Not a BI tool (no custom SQL queries — those live in PostHog/Metabase if needed)

### What This IS

- A purpose-built dashboard showing the 30-50 metrics that matter most for running PupPal
- A management interface for users, partners, content, feature flags, and support
- A tool that consolidates RevenueCat revenue data, PostHog engagement data, and Supabase operational data
- The single place Ashley goes every morning to understand business health

### Success Metrics

| Metric | Target |
|--------|--------|
| Time to answer "how's the business doing?" | < 30 seconds (glance at dashboard) |
| Data freshness | Revenue: near real-time. Engagement: hourly. Cohorts: daily. |
| Dashboard uptime | 99.5%+ |
| Team members using daily | 100% of team |

---

## 2. Technical Architecture

### Stack

- **Frontend**: Next.js (React) with Tailwind CSS + shadcn/ui components
- **Hosting**: Vercel (fast deploys, preview per PR)
- **Authentication**: Supabase Auth (email + password for admin accounts, no social login)
- **Data sources**:
  - Supabase (PostgreSQL) — users, dogs, subscriptions, partners, content
  - RevenueCat API — revenue, MRR, subscription lifecycle
  - PostHog API — engagement events, funnels, cohorts
  - OneSignal API — notification delivery and engagement
  - Customer.io API — email delivery and engagement
  - Stripe Connect API — partner payouts
  - Superwall API — paywall conversion data
- **Caching**: Vercel KV (Redis) for expensive queries — cache 5 min for real-time, 1 hour for cohorts
- **Cron jobs**: Vercel Cron for daily/weekly metric calculation and caching

### Access Control

```
AdminUser {
  id: UUID
  email: string
  name: string
  role: enum (owner / admin / viewer)
  permissions: JSON           // granular overrides
  last_login: timestamp
  created_at: timestamp
}
```

| Role | Can View | Can Edit | Can Delete | Can Manage Admins |
|------|----------|----------|------------|-------------------|
| Owner | Everything | Everything | Everything | Yes |
| Admin | Everything | Users, content, partners, flags | Flagged content only | No |
| Viewer | Everything | Nothing | Nothing | No |

### URL Structure

```
https://admin.puppal.app

/                          → Dashboard home (KPI overview)
/revenue                   → Revenue & subscription deep-dive
/users                     → User management & search
/users/{id}                → Individual user detail
/acquisition               → Acquisition channels & UTM tracking
/engagement                → Engagement & retention metrics
/training                  → Training plan & content analytics
/ai-chat                   → Buddy AI chat analytics
/health                    → Health tracker usage
/partners                  → Partner program management
/partners/{id}             → Individual partner detail
/notifications             → Push + email analytics
/experiments               → A/B tests & feature flags
/content                   → Content management (exercises, tricks, breeds)
/support                   → Support queue & tools
/settings                  → Admin settings, team management
```

---

## 3. Dashboard Home — KPI Overview

The home screen shows the metrics Ashley checks every morning. Everything is at-a-glance, with sparklines for trends and click-through for details.

### Top Row: Today's Headline Numbers

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  MRR          │ │  NEW USERS   │ │  TRIALS      │ │  CONVERSIONS │
│  $12,450      │ │  142 today   │ │  89 started  │ │  34 today    │
│  ↑ 3.2% MoM  │ │  ↑ 12% WoW  │ │  63% rate    │ │  38% rate    │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  ARR          │ │  ACTIVE USERS│ │  CHURN RATE  │ │  LTV         │
│  $149,400     │ │  4,230 DAU   │ │  5.2% monthly│ │  $68.40      │
│  ↑ 28% MoM   │ │  8,910 MAU   │ │  ↓ 0.3%      │ │  ↑ $4.20     │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

### Middle Section: Trend Charts (Last 30 Days)

- **Revenue trend**: Daily revenue (bar chart) + MRR line overlay
- **User growth**: New installs, new trials, new conversions (stacked area)
- **Retention curve**: Day 1, 7, 14, 30 retention by install cohort (line chart)
- **Churn**: Daily churned subscribers + cumulative churn rate

### Bottom Section: Quick Access Cards

- **Top acquisition channel today**: "Influencer @zakthedogtrainer: 23 installs, 8 conversions"
- **Active A/B tests**: "Paywall price test: $29.99 vs $39.99 — $39.99 leading (+12% revenue/view)"
- **Support queue**: "4 open tickets, oldest: 2 hours"
- **Alerts**: "Churn rate above 6% threshold (5-day trend)" / "Push opt-in rate dropped below 65%"

---

## 4. Revenue & Subscriptions Dashboard

### Key Metrics

| Metric | Definition | Source |
|--------|-----------|--------|
| MRR | Monthly Recurring Revenue (normalized) | RevenueCat |
| ARR | MRR × 12 | Calculated |
| Revenue today/this week/this month | Gross revenue collected | RevenueCat |
| Net revenue | After Apple/Google 30% fee (15% for small business program if applicable) | Calculated |
| New MRR | MRR from new subscribers this period | RevenueCat |
| Churned MRR | MRR lost from cancellations this period | RevenueCat |
| Expansion MRR | MRR gained from plan upgrades (monthly → annual) | RevenueCat |
| Net MRR growth | New + Expansion - Churned | Calculated |
| Trial-to-paid conversion rate | Trials converted / trials started | RevenueCat |
| Trial-to-paid by plan | Breakdown: annual vs monthly | RevenueCat |
| Average revenue per user (ARPU) | Total revenue / total active subscribers | Calculated |
| Lifetime value (LTV) | ARPU / monthly churn rate (simplified) | Calculated |
| LTV:CAC ratio | LTV / blended acquisition cost | Calculated + manual input |
| Subscription by plan | Count and % for annual, monthly, lifetime | RevenueCat |
| Active free trial count | Users currently in trial | RevenueCat |
| Grace period / billing retry count | Users with payment issues | RevenueCat |
| Refund rate | Refunds / total subscriptions | RevenueCat |
| Win-back conversion rate | Lapsed users resubscribed / total lapsed | RevenueCat + Supabase |

### Revenue Charts

- **MRR waterfall**: New, Expansion, Churned, Net (bar chart, monthly)
- **Revenue by plan**: Annual vs monthly vs lifetime (pie + trend)
- **Trial funnel**: Started → Day 1 active → Day 2 active → Converted (funnel)
- **Cohort LTV**: Revenue per cohort over 1, 3, 6, 12 months (heatmap)
- **Revenue by channel**: Organic, paid, influencer, partner, referral (stacked bar)
- **Revenue by geography**: Map + table, broken down by country

### Subscription Lifecycle View

```
Active subscribers:    3,420
  Annual:              2,394 (70%)
  Monthly:               890 (26%)
  Lifetime:              136 (4%)

In trial:                234
Grace period:             18
Billing retry:            42
Cancelled (access remaining): 156

Free tier users:       12,450
```

### Individual Subscription Drill-Down

Click any metric → see the users behind it. Click a user → go to user detail (Section 6).

---

## 5. Acquisition & Attribution Dashboard

### Channel Performance Table

| Channel | Installs | Trials | Conv. | Revenue | CAC | LTV | LTV:CAC |
|---------|----------|--------|-------|---------|-----|-----|---------|
| Organic (ASO) | 2,340 | 1,404 | 562 | $18,720 | $0 | $68 | ∞ |
| Paid (TikTok) | 1,200 | 600 | 210 | $6,930 | $12.50 | $62 | 5.0x |
| Paid (Instagram) | 890 | 445 | 156 | $5,148 | $15.20 | $58 | 3.8x |
| Influencer | 780 | 546 | 218 | $7,194 | $8.40 | $72 | 8.6x |
| Referral (in-app) | 420 | 336 | 151 | $4,983 | $2.10 | $74 | 35.2x |
| Partner (breeders) | 180 | 144 | 86 | $2,838 | $7.00 | $78 | 11.1x |

### UTM Tracking

Track UTM parameters on all inbound links:

```
utm_source    → channel (tiktok, instagram, google, partner, referral, email)
utm_medium    → type (paid, organic, influencer, cpc, email)
utm_campaign  → campaign name (spring_launch, breed_awareness_mar26)
utm_content   → creative variant (video_1, carousel_a, story_b)
utm_term      → keyword (puppy_training, dog_tricks)
```

**UTM storage**:
```
UserAttribution {
  user_id: UUID
  utm_source: string (nullable)
  utm_medium: string (nullable)
  utm_campaign: string (nullable)
  utm_content: string (nullable)
  utm_term: string (nullable)
  referral_code: string (nullable)
  partner_code: string (nullable)
  influencer_code: string (nullable)
  install_source: string            // app_store, play_store, direct
  first_touch_at: timestamp
  attribution_platform: string      // adjust, appsflyer
  attributed_at: timestamp
}
```

### Attribution Dashboard Views

- **Channel breakdown**: Installs, trials, conversions, revenue, CAC, LTV per channel (table + charts)
- **Campaign performance**: Drill into specific campaigns (e.g., "TikTok March Creative Test")
- **Creative performance**: Which ad creative converts best (requires UTM content tag)
- **Influencer leaderboard**: Ranked by conversions, revenue, ROI (from PRD-08 attribution)
- **Partner leaderboard**: Ranked by conversions, revenue (from PRD-19)
- **Referral metrics**: K-factor, referral send rate, conversion per invite
- **Geographic breakdown**: Installs and conversion by country/region (map + table)

### Cost Input (Manual)

Since PupPal doesn't have a direct API integration with every ad platform at launch, allow manual monthly cost entry:

```
ChannelCost {
  id: UUID
  channel: string          // "tiktok_ads", "instagram_ads", "influencer_zak", etc.
  period: date             // month (2026-03-01)
  cost: float              // total spend
  currency: string
  notes: string (nullable)
  entered_by: UUID
  created_at: timestamp
}
```

This enables CAC and LTV:CAC calculations per channel. Over time, replace with API integrations (Meta Ads API, TikTok Ads API).

---

## 6. User Management

### User Search & List

```
┌──────────────────────────────────────────────────────────┐
│  USERS                                          12,450    │
│                                                            │
│  [Search: name, email, dog name, breed, partner code]      │
│                                                            │
│  Filters: [Status ▼] [Plan ▼] [Channel ▼] [Date range ▼] │
│           [Locale ▼] [Breed ▼] [Partner ▼]                │
│                                                            │
│  Name        Email         Dog      Status    MRR    Since│
│  ──────────────────────────────────────────────────────── │
│  Ashley C.   a@email.com   Luna     Active    $3.33  Jan 5│
│  Mark T.     m@email.com   Max      Trial     —      Mar 1│
│  Sarah K.    s@email.com   Bella    Expired   —      Dec 3│
│  ...                                                       │
│                                                            │
│  [Export CSV]                                              │
└──────────────────────────────────────────────────────────┘
```

### Individual User Detail

Clicking a user shows their complete profile:

```
┌──────────────────────────────────────────────────────────┐
│  ASHLEY C.                                     [Actions ▼]│
│  a@email.com · iOS · en-US · San Francisco                │
│  Joined: Jan 5, 2026 · Source: Influencer (@dogmomlife)   │
│                                                            │
│  ── DOG PROFILE ──                                         │
│  Luna · Golden Retriever · 6 months                        │
│  Challenges: Potty, Biting, Leash                          │
│  Experience: First-time owner                              │
│                                                            │
│  ── SUBSCRIPTION ──                                        │
│  Status: Active (Annual)                                   │
│  Started: Jan 8, 2026 · Renews: Jan 8, 2027               │
│  Revenue: $39.99 total · LTV: $39.99                       │
│  Trial: 3-day (converted Day 2)                            │
│                                                            │
│  ── ENGAGEMENT ──                                          │
│  Good Boy Score: 67                                        │
│  Streak: 42 days (current)                                 │
│  Exercises completed: 89 · Plan week: 8                    │
│  Tricks mastered: 4 · Chat messages: 234                   │
│  Last active: 2 hours ago                                  │
│                                                            │
│  ── ATTRIBUTION ──                                         │
│  Install source: Instagram                                 │
│  UTM: source=instagram, medium=influencer,                 │
│       campaign=dogmomlife_jan26                            │
│  Referral code used: DOGMOM2026                            │
│  Referrals sent: 3 (1 converted)                           │
│                                                            │
│  ── TIMELINE ──                                            │
│  [Scrollable event log with all key events]                │
│  Mar 4  Exercise completed: Leash Direction Changes        │
│  Mar 3  Streak milestone: 42 days                          │
│  Mar 3  Achievement: "Leash Legend"                         │
│  Mar 2  Chat: 4 messages (topic: leash reactivity)         │
│  Mar 1  Exercise completed: Heel Introduction              │
│  ...                                                       │
│                                                            │
│  ── ADMIN ACTIONS ──                                       │
│  [Grant Premium] [Extend Trial] [Reset Password]           │
│  [Add Note] [Export Data] [Delete Account]                 │
│  [Send Custom Push] [Comp Partner Code]                    │
└──────────────────────────────────────────────────────────┘
```

### Admin Actions on Users

| Action | Use Case | Implementation |
|--------|----------|----------------|
| Grant Premium | Comp access for press, support resolution | Set `premium_override = true` with expiry |
| Extend Trial | Customer support, partner issue | Update `trial_ends_at` in RevenueCat |
| Reset Password | Support request | Trigger Supabase auth password reset email |
| Add Internal Note | Support notes, flags | Store in `AdminNote` table |
| Export User Data | GDPR/CCPA request | Generate JSON export of all user data |
| Delete Account | GDPR/CCPA request | Full data deletion per PRD-14 |
| Send Custom Push | One-off communication | OneSignal targeted send |
| Refund | Billing dispute | Initiate via RevenueCat (links to App Store/Google) |

---

## 7. Engagement & Retention Dashboard

### Retention Curves

- **Day 1, 3, 7, 14, 30, 60, 90 retention** by install cohort (weekly cohorts)
- **Segmented**: by channel, by plan, by breed, by locale, by partner
- **Benchmark overlay**: show target retention curves alongside actual

### Engagement Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| DAU | Unique users active today | Growth |
| WAU | Unique users active this week | Growth |
| MAU | Unique users active this month | Growth |
| DAU/MAU ratio | Daily engagement / monthly base (stickiness) | 25%+ |
| Avg. session length | Time in app per session | 5-10 min |
| Avg. sessions/day | How many times per day users open | 1.5+ |
| Exercise completion rate | Exercises completed / available | 40%+ |
| Daily training completion | Users who completed all today's exercises / active users | 30%+ |
| Chat messages/day | Total Buddy messages across all users | Growth |
| Chat messages per user/week | Avg messages per active user | 5+ |
| Streak distribution | Histogram of current streak lengths | Shift right over time |
| GBS distribution | Histogram of current scores | Shift right over time |

### Churn Analysis

- **Churn rate** (monthly): cancelled + expired / total subscribers
- **Churn by cohort**: which install month has highest churn
- **Churn by channel**: paid vs organic vs partner vs referral
- **Churn by plan**: annual vs monthly (monthly always higher)
- **Churn reasons**: from cancellation survey (PRD-06) — pie chart
- **Time-to-churn**: histogram of subscription duration before cancellation
- **Predictive churn signals**: users who stopped training, dropped streak, low GBS — flag as "at risk"

### At-Risk Users

Auto-generated list of users showing churn signals:

```
AT-RISK USERS (134 users)

Signals:
- No exercise completion in 5+ days while on active subscription
- Streak broken after 14+ day streak
- GBS declining for 2+ consecutive weeks
- Chat usage dropped to 0 after previously active

[Name]    [Dog]     [Signals]                [Last Active]  [Action]
Sarah K.  Bella     Streak broken (was 23)   5 days ago     [Send nudge]
Mike R.   Cooper    No exercises 7 days      7 days ago     [Send nudge]
...
```

---

## 8. Training & Content Analytics

### Training Plan Performance

| Metric | Definition |
|--------|-----------|
| Plan generation success rate | Successful plans / attempts |
| Avg exercises completed per user per week | Weekly engagement depth |
| Exercise skip rate | Exercises skipped / total assigned |
| Exercise completion rate by category | Which categories get done vs skipped |
| Avg rating per exercise | 1-5 star post-exercise rating |
| Most skipped exercises | Ranked list (indicates content quality issues) |
| Most loved exercises | Highest rated (double down on these) |
| Adaptation trigger rate | How often the plan adapts per user |
| Week-over-week progression | % of users advancing on schedule |
| Plan graduation rate | Users who complete Week 12 / users who started |

### Trick Library Performance

| Metric | Definition |
|--------|-----------|
| Trick started rate | Users who start any trick / active post-Week-4 users |
| Trick completion rate | Tricks completed (Level 3) / tricks started |
| Most popular tricks | Ranked by starts |
| Highest completion tricks | Ranked by Level 3 rate |
| Trick share rate | Shares / completions |
| Post-graduation trick engagement | Trick completions per month for graduated users |

### Content Management

View all exercises, tricks, and breed profiles. Edit content, add new exercises, manage translations.

```
EXERCISES (162)                                [+ Add Exercise]

[Search] [Filter: category ▼] [Filter: difficulty ▼]

Title                    Category     Diff  Avg Rating  Completions  Skip Rate
─────────────────────────────────────────────────────────────────────────────
Cue Word Introduction    Potty        1 🐾   4.6        3,420        2%
Redirect & Replace       Biting       2 🐾   4.3        2,890        5%
Lure to Sit              Commands     1 🐾   4.8        4,120        1%
Loose Leash Basics       Leash        2 🐾   3.9        1,890        12% ⚠️
...

[Click row → Edit exercise content, view per-language translations, see detailed analytics]
```

Flag exercises with low ratings (< 3.5) or high skip rates (> 15%) for content review.

---

## 9. AI Chat (Buddy) Analytics

| Metric | Definition |
|--------|-----------|
| Total chat sessions/day | Daily session count |
| Total messages/day | Message volume |
| Avg messages per session | Conversation depth |
| Free vs premium chat distribution | Message volume by tier |
| Avg response time | Time from user message to Buddy response |
| Chat satisfaction (if rated) | Post-chat thumbs up/down |
| Topic distribution | Auto-categorized: training, health, behavior, general, off-topic |
| Safety escalation rate | Messages triggering safety response / total messages |
| Cost per conversation | LLM API cost / conversations |
| Free message limit hit rate | Users hitting 3/day cap / free users who chat |
| Chat-to-upgrade rate | Users who upgrade after hitting chat limit |

### Chat Quality Monitoring

- **Random sample review**: Surface 20 random conversations/day for quality spot-check
- **Flagged conversations**: Auto-flag for: safety triggers, low satisfaction rating, very short sessions (user left quickly), error responses
- **Response language check**: Flag responses that don't match user's set locale

---

## 10. Partner Program Dashboard

Extends from PRD-19. Admin-side management.

### Partner Overview

```
PARTNERS (87 active)                           [+ Add Partner]

[Search] [Filter: tier ▼] [Filter: status ▼] [Filter: type ▼]

Business           Tier    Type      Installs  Conv.  Revenue   Comm.  Status
────────────────────────────────────────────────────────────────────────────
Golden Acres       T2      Breeder   34        14     $462      $97    Active
Happy Tails        T4      Shelter   120       42     $1,386    —      Active
Pawfect Pups       T1      Breeder   8         3      $99       $17    Active
PetLand NYC        T3      Store     45        28     $924      —      Active
...

Total partner-attributed revenue this month: $4,830
Total commissions due: $1,290
```

### Partner Actions

| Action | Use Case |
|--------|----------|
| Approve/Reject application | Tier 2-4 manual review |
| Change tier | Upgrade partner (e.g., Tier 1 → Tier 2 after volume proves out) |
| Suspend partner | Suspected abuse, quality issue |
| Terminate partner | Policy violation |
| Generate bundle codes | Tier 3 wholesale code generation |
| Override commission rate | Special deals |
| View partner detail | Full stats, payout history, attributed users |
| Process manual payout | Edge case payout outside normal cycle |

---

## 11. Push & Email Analytics

### Push Notifications (OneSignal)

| Metric | Definition |
|--------|-----------|
| Push opt-in rate | Users with push enabled / total users |
| Delivery rate | Delivered / sent |
| Open rate (by sequence) | Opens / delivered, per notification type |
| Click rate | Clicks / opens |
| Notification-driven sessions | App opens within 5 min of notification |
| Unsubscribe rate | Users disabling push / total push-enabled |

### Email (Customer.io)

| Metric | Definition |
|--------|-----------|
| Deliverability rate | Delivered / sent |
| Open rate (by sequence) | Opens / delivered, per email sequence |
| Click rate (by sequence) | Clicks / delivered |
| Unsubscribe rate | Unsubs / delivered |
| Bounce rate | Bounces / sent |
| Spam complaint rate | Complaints / delivered (MUST stay < 0.1%) |
| Email-attributed conversions | Conversions tracked to email click |

### Combined View

Side-by-side comparison: which channel drives more engagement per notification type (training reminder, streak risk, win-back, etc.).

---

## 12. A/B Tests & Feature Flags

### Active Experiments

```
EXPERIMENTS (6 active)                         [+ Create Experiment]

Name                     Type       Variants  Users    Metric      Status
──────────────────────────────────────────────────────────────────────────
Paywall price test       Superwall  3         4,200    Rev/view    Running (Day 8)
  $29.99: $0.42/view | $39.99: $0.51/view ✓ | $49.99: $0.48/view
  
Trial length test        Superwall  2         1,800    Conv. rate  Running (Day 5)
  3-day: 38% | 7-day: 34%
  
CTA copy test            Superwall  2         2,100    Tap rate    Running (Day 3)
  "Start Free Trial": 62% | "Train Luna Now": 68% ✓

Home screen layout       PostHog    2         3,400    Compl. rate Running (Day 12)
  Current: 41% | New card design: 44% ✓

Chat suggested prompts   PostHog    2         1,200    Msg/session Running (Day 6)
  3 prompts: 2.1 | 5 prompts: 2.8 ✓

Push copy test           OneSignal  2         2,800    Open rate   Running (Day 4)
  Standard: 18% | With GBS: 22% ✓
```

### Feature Flags

```
FEATURE FLAGS (12)                             [+ Create Flag]

Flag                      Status    % Rollout  Created
─────────────────────────────────────────────────────────
trick_library_v2          Active    25%        Feb 15
new_gbs_calculation       Active    10%        Feb 28
community_feed            Inactive  0%         Mar 1
breed_encyclopedia        Active    100%       Jan 20
partner_dashboard_v2      Active    50%        Feb 22
voice_chat_beta           Inactive  0%         Mar 3
...
```

Admin can:
- Create/edit/delete feature flags
- Set rollout percentage (0-100%)
- Target by user segment (locale, plan, cohort, breed)
- View metrics for flagged vs non-flagged cohorts
- Kill switch: instantly set to 0% if issues detected

---

## 13. Alerts & Monitoring

### Configurable Alerts

| Alert | Threshold | Channel |
|-------|-----------|---------|
| Daily revenue drops >20% vs 7-day avg | Auto-calculated | Email + Slack |
| Churn rate exceeds 6% monthly | 6% | Email |
| Trial conversion drops below 30% | 30% | Email + Slack |
| Push opt-in drops below 60% | 60% | Email |
| App crash rate exceeds 1% | 1% | Slack (immediate) |
| Buddy AI response errors exceed 5% | 5% | Slack (immediate) |
| Email spam complaint rate exceeds 0.05% | 0.05% | Email (urgent) |
| Partner commission payout fails | Any failure | Email |
| RevenueCat webhook failures | 3+ in 1 hour | Slack |
| New 1-star App Store review | Any | Slack |

### Alert Configuration

```
AlertRule {
  id: UUID
  name: string
  metric: string                // "daily_revenue", "churn_rate", etc.
  condition: enum (above / below / change_pct)
  threshold: float
  window: string                // "1h", "24h", "7d"
  channels: array of string     // ["email", "slack"]
  recipients: array of string   // email addresses or Slack channels
  enabled: boolean
  last_triggered: timestamp (nullable)
  cooldown_hours: integer       // don't re-trigger within X hours
  created_at: timestamp
}
```

---

## 14. Health & Vaccination Analytics

| Metric | Definition |
|--------|-----------|
| Health tracker adoption | Users with 1+ health entry / total active |
| Vaccination completion rate | On-time vaccinations logged / due vaccinations |
| Overdue vaccination rate | Overdue vaccinations / total due |
| Weight tracking adoption | Users with 2+ weight entries / total active |
| Vet visit logging rate | Users who logged 1+ vet visit / active 3+ months |
| Health reminder effectiveness | Reminders sent → action taken (vaccination logged) |

---

## 15. Data Model

### Admin-Specific Tables

```
AdminUser {
  id: UUID
  email: string
  name: string
  role: enum (owner / admin / viewer)
  permissions: JSON
  last_login: timestamp
  created_at: timestamp
}

AdminNote {
  id: UUID
  admin_user_id: UUID (FK)
  target_type: enum (user / partner / exercise / general)
  target_id: UUID (nullable)
  note: text
  created_at: timestamp
}

AlertRule {
  id: UUID
  name: string
  metric: string
  condition: enum (above / below / change_pct)
  threshold: float
  window: string
  channels: array of string
  recipients: array of string
  enabled: boolean
  cooldown_hours: integer
  last_triggered: timestamp (nullable)
  created_at: timestamp
}

AlertEvent {
  id: UUID
  alert_rule_id: UUID (FK)
  metric_value: float
  threshold: float
  message: string
  channels_notified: array of string
  created_at: timestamp
}

ChannelCost {
  id: UUID
  channel: string
  period: date
  cost: float
  currency: string
  notes: string (nullable)
  entered_by: UUID (FK)
  created_at: timestamp
}

DailyMetricSnapshot {
  id: UUID
  date: date
  metric_name: string          // "mrr", "dau", "churn_rate", "trial_conversion", etc.
  metric_value: float
  dimensions: JSON (nullable)  // {"locale": "en", "plan": "annual", "channel": "organic"}
  created_at: timestamp
}
```

### Metric Snapshot Cron

A daily cron job (runs at 00:05 UTC) calculates and stores all key metrics in `DailyMetricSnapshot`. This enables fast historical queries without real-time recalculation.

```ts
// Vercel Cron: runs daily
const dailyMetrics = [
  { name: 'mrr', query: calculateMRR },
  { name: 'dau', query: calculateDAU },
  { name: 'mau', query: calculateMAU },
  { name: 'trial_conversion_rate', query: calculateTrialConversion },
  { name: 'churn_rate', query: calculateChurnRate },
  { name: 'ltv', query: calculateLTV },
  { name: 'arpu', query: calculateARPU },
  // ... 30+ metrics
];

for (const metric of dailyMetrics) {
  const value = await metric.query();
  await supabase.from('daily_metric_snapshots').insert({
    date: today,
    metric_name: metric.name,
    metric_value: value
  });
}
```

Additionally calculate with dimensions for segmented views:
- By locale (en, es, fr, de, pt-BR, it)
- By plan (annual, monthly, lifetime, free)
- By channel (organic, paid, influencer, partner, referral)
- By platform (ios, android)

---

## 16. Integration Points

### With RevenueCat
- Revenue, MRR, ARR, subscription lifecycle, trial data
- Pulled via RevenueCat REST API (scheduled every 15 minutes)
- Webhook events for real-time subscription changes

### With PostHog
- Engagement events, funnels, retention cohorts
- Pulled via PostHog API for dashboard widgets
- Feature flags managed via PostHog API

### With Supabase
- Direct database queries for user/partner/content data
- Admin tables live in same Supabase project (separate schema: `admin`)

### With OneSignal
- Push delivery and engagement stats
- Pulled via OneSignal API

### With Customer.io
- Email delivery, open, click, unsubscribe data
- Pulled via Customer.io API

### With Superwall
- Paywall impressions, conversions, revenue per view
- Experiment results
- Pulled via Superwall API

### With Stripe Connect
- Partner payout status, processing, failures
- Pulled via Stripe API

### With Adjust/AppsFlyer
- Install attribution, UTM data, channel performance
- Pulled via attribution platform API

---

## 17. Edge Cases

| Scenario | Handling |
|----------|----------|
| RevenueCat API down | Show cached data with "Last updated: X" timestamp. Alert via Slack. |
| PostHog API rate limited | Increase cache TTL. Queue retries. Show stale data with indicator. |
| Metric calculation produces anomalous result (e.g., negative MRR) | Validate before storing. If outside 3 standard deviations, flag for manual review. Don't display unverified anomalies. |
| Admin accidentally deletes a user | Soft delete with 30-day recovery window. Hard delete requires owner confirmation. |
| Multiple admins editing same feature flag | Last-write-wins with audit log. Show "last modified by [name] at [time]." |
| Partner disputes commission calculation | Admin can view full attribution chain: QR scan → install → trial → conversion → commission. Transparent audit trail. |
| Dashboard loads slowly (too much data) | Paginate all tables. Pre-aggregate metrics in DailyMetricSnapshot. Cache expensive queries (5 min for real-time, 1 hour for cohorts). |
| Time zone confusion in metrics | ALL metrics stored in UTC. Dashboard shows in admin's local timezone with UTC option. Cohort boundaries at UTC midnight. |
| Currency conversion for international revenue | Display in USD (primary) with option to view in original currency. Use daily exchange rates from an API (or RevenueCat normalized values). |
| Admin account compromised | Role-based access (no public signup). Magic link + 2FA (TOTP). Session expiry: 24 hours. Audit log of all admin actions. |

---

## 18. Dependencies

| Dependency | Purpose | Fallback |
|------------|---------|----------|
| Next.js + Vercel | Dashboard frontend + hosting | Self-hosted Node app |
| Supabase | Primary data store + auth | Required — no fallback |
| RevenueCat API | Revenue and subscription data | RevenueCat dashboard (manual) |
| PostHog API | Engagement events and cohorts | PostHog dashboard (manual) |
| OneSignal API | Push notification analytics | OneSignal dashboard (manual) |
| Customer.io API | Email analytics | Customer.io dashboard (manual) |
| Superwall API | Paywall experiment data | Superwall dashboard (manual) |
| Stripe Connect API | Partner payout data | Stripe dashboard (manual) |
| Adjust/AppsFlyer API | Attribution data | Attribution dashboard (manual) |
| Vercel Cron | Daily metric calculation | Supabase pg_cron |
| Vercel KV (Redis) | Dashboard query caching | Direct DB queries (slower) |
| Slack webhook | Alert notifications | Email-only alerts |

---

## 19. Acceptance Criteria

### Dashboard Home
- [ ] KPI overview loads in < 3 seconds with current day's data
- [ ] MRR, ARR, new users, trials, conversions display correctly
- [ ] Churn rate calculates correctly (monthly)
- [ ] LTV calculates correctly (ARPU / churn rate)
- [ ] Trend sparklines show 30-day direction
- [ ] All numbers match source system totals (RevenueCat, PostHog)

### Revenue
- [ ] MRR waterfall chart renders correctly
- [ ] Revenue breakdown by plan, channel, geography works
- [ ] Trial funnel shows accurate conversion rates
- [ ] Cohort LTV heatmap displays correctly
- [ ] Data refreshes every 15 minutes from RevenueCat

### Acquisition
- [ ] UTM parameters captured and stored on all tracked installs
- [ ] Channel performance table calculates CAC when costs are entered
- [ ] LTV:CAC ratio calculates per channel
- [ ] Influencer and partner leaderboards populated from attribution data

### User Management
- [ ] User search works by name, email, dog name, breed, partner code
- [ ] Filters work (status, plan, channel, locale, breed, date range)
- [ ] User detail page shows all profile, subscription, engagement, attribution data
- [ ] Admin actions work: grant premium, extend trial, add note, export data, delete
- [ ] User timeline shows chronological events

### Engagement & Retention
- [ ] Retention curves display by cohort with day 1/3/7/14/30/60/90 markers
- [ ] DAU, WAU, MAU, DAU/MAU ratio calculate correctly
- [ ] Churn analysis segments by cohort, channel, plan
- [ ] At-risk user list auto-generates based on inactivity signals

### Partners
- [ ] Partner list with search, filter, and performance metrics
- [ ] Partner actions (approve, reject, suspend, terminate) work
- [ ] Commission calculations match expected values
- [ ] Bundle code generation and tracking work

### Alerts
- [ ] Configurable alert rules can be created, edited, enabled/disabled
- [ ] Alerts fire within 15 minutes of threshold breach
- [ ] Alerts deliver to configured channels (email, Slack)
- [ ] Cooldown prevents duplicate alerts

### General
- [ ] Authentication works (email + magic link + optional 2FA)
- [ ] Role-based access enforced (viewer cannot edit)
- [ ] All admin actions logged in audit trail
- [ ] Dashboard works on desktop browsers (Chrome, Safari, Firefox)
- [ ] Mobile-responsive (readable on phone, not necessarily full functionality)
- [ ] Daily metric snapshots calculated and stored by cron job
- [ ] CSV export works for all major tables
