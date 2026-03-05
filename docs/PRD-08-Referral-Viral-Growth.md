# PRD #08: Referral & Viral Growth System

## PupPal — The Organic Growth Engine

**Document version**: 1.0
**Feature owner**: Ashley
**Status**: Draft
**Priority**: P1 — Paid acquisition is expensive. Referrals are free, high-trust, and convert at 3-5x the rate of ads. Dog people talk to dog people. This system turns every user into a distribution channel.

---

## 1. Overview & Purpose

Three growth mechanisms, each amplifying the other:

1. **In-App Referral Program**: Users invite friends → both get rewarded → viral loop
2. **Influencer Attribution**: Track which influencers/creators drive installs → compensate correctly → scale what works
3. **Organic Sharing**: Achievement cards, trick videos, growth photos, Good Boy Score milestones → every share is a free ad

Dog content is inherently viral. Pet Instagram accounts have some of the highest engagement rates on the platform. PupPal leverages this by making every milestone a shareable, branded moment that introduces PupPal to the sharer's entire social network.

### Success Metrics

| Metric | Target |
|--------|--------|
| Referral send rate | 15%+ of users share at least 1 invite |
| Referral conversion (invite → install) | 20-30% |
| Referral to paid conversion | 15-25% (higher than organic) |
| Viral coefficient (K-factor) | 0.3-0.5 (each user brings 0.3-0.5 new users) |
| Organic share rate | 10%+ of milestone events generate a share |
| Influencer attribution accuracy | 95%+ (installs correctly attributed) |
| Referral program awareness | 60%+ of active users know it exists |

---

## 2. In-App Referral Program

### How It Works

Every user gets a unique referral code and shareable link. When a friend installs PupPal via the link and starts a trial, both users get rewarded.

### Referral Rewards

| Action | Referrer Gets | Referee Gets |
|--------|--------------|--------------|
| Friend installs PupPal | 50 XP + "Sharing is Caring" achievement progress | — |
| Friend starts free trial | 100 XP | 1 extra free Buddy message/day (4 total during trial) |
| Friend converts to paid | 1 free month added to subscription OR 200 XP (if lifetime) | — |

**Why these rewards**:
- XP is immediate gratification (free to give, valuable to user)
- Extra Buddy message is a meaningful benefit for the referee without cutting into revenue
- Free month for paid conversion is the big incentive — pure revenue share, only triggered when PupPal actually earns money
- Never give discounts to referrers (trains users to game the system)

### Referral Link Format

```
https://puppal.app/r/{referral_code}

Example: https://puppal.app/r/LUNA2024
```

Referral codes are:
- Auto-generated: 8-character alphanumeric (e.g., `A3KF92XL`)
- Optionally customizable: user can set a vanity code (e.g., `LUNA`, `MAXTHEDOG`)
- Case-insensitive
- Unique per user (not per dog)

### Deep Link Flow

1. Friend taps referral link on phone
2. If PupPal installed: app opens with referral context
3. If not installed: redirect to App Store / Play Store with referral code in URL params
4. Expo Router deep link handler captures referral code
5. Code stored locally (AsyncStorage) before onboarding
6. After account creation, referral code attached to new user record
7. Referral credited to referrer

### Deferred Deep Linking

The critical challenge: user taps link → goes to App Store → installs → opens app. The referral context is lost because the App Store breaks the chain.

**Solution**: Use Expo's native deep linking + a web redirect page:

```
https://puppal.app/r/{code}
  → Web page checks if app installed
    → If yes: open app with puppal://referral/{code}
    → If no: redirect to App Store with campaign parameter
      → On first app open: check clipboard OR use Apple Search Ads attribution
      → Fallback: manual code entry during onboarding
```

**Backup: Manual code entry**
During onboarding (after Screen 1 "Meet Buddy"), small "Have a referral code?" link. Tap opens input field. Validates code against database.

```
┌─────────────────────────────┐
│   Have a referral code?      │  ← Subtle text link
│                              │
│   ┌──────────────────────┐   │
│   │  Enter code           │   │
│   └──────────────────────┘   │
│   [Apply]                    │
│                              │
│   ✓ Referred by Luna's mom! │  ← Success state
└─────────────────────────────┘
```

### Referral Data Model

```
UserReferral {
  id: UUID
  user_id: UUID                  // the referrer
  referral_code: string (unique) // their shareable code
  custom_code: string (nullable) // vanity code if set
  total_shares: integer          // times the link was shared
  total_installs: integer        // attributed installs
  total_trials: integer          // trials started from referrals
  total_conversions: integer     // paid conversions from referrals
  total_rewards_earned: integer  // total XP from referrals
  free_months_earned: integer    // months added to subscription
  created_at: timestamp
}

ReferralEvent {
  id: UUID
  referrer_user_id: UUID
  referee_user_id: UUID (nullable)  // null until account created
  referral_code: string
  status: enum (link_shared / installed / trial_started / converted / expired)
  platform: enum (ios / android / web)
  share_channel: string (nullable)  // instagram, whatsapp, imessage, etc.
  installed_at: timestamp (nullable)
  trial_started_at: timestamp (nullable)
  converted_at: timestamp (nullable)
  referrer_rewarded: boolean
  referee_rewarded: boolean
  created_at: timestamp
}
```

### Referral Program UI

**Access Point 1: Profile/Settings**
```
┌─────────────────────────────┐
│  Invite Friends              │
│                              │
│  ┌─────────────────────────┐ │
│  │ Share PupPal and earn    │ │
│  │ free premium months!     │ │
│  │                          │ │
│  │ Your code: LUNA2024      │ │
│  │ [Copy] [Share Link]      │ │
│  │                          │ │
│  │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │ │
│  │                          │ │
│  │ 📊 Your Referrals        │ │
│  │ Friends invited: 8       │ │
│  │ Trials started: 4        │ │
│  │ Converted: 2             │ │
│  │ Months earned: 2 🎉      │ │
│  └─────────────────────────┘ │
│                              │
│  HOW IT WORKS                │
│  1. Share your link          │
│  2. Friend starts trial      │
│  3. Friend subscribes →      │
│     you get a free month!    │
│                              │
│  Customize your code →       │
└─────────────────────────────┘
```

**Access Point 2: Share Moments**
After any shareable milestone (achievement, streak, trick, GBS), the share card includes the user's referral link automatically.

**Access Point 3: Buddy**
Buddy occasionally mentions referrals: "[Name] is doing so well! Know any other puppy parents who could use a Buddy? Share your invite link! 🐾"

### Share Card with Referral

When a user shares an achievement, the branded card includes:

```
┌─────────────────────────────┐
│  🏆 SIT HAPPENS!            │
│                              │
│  Luna mastered the Sit       │
│  command!                    │
│                              │
│  Good Boy Score: 42          │
│  🔥 12-day streak           │
│                              │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    │
│  Train your puppy with AI   │
│  puppal.app/r/LUNA2024       │
│                              │
│  🐾 PupPal                   │
└─────────────────────────────┘
```

The referral link is embedded in the card image AND as the link text when shared to platforms that support link previews.

---

## 3. Influencer Attribution System

### Why Influencers Matter

Dog influencers (Instagram, TikTok, YouTube) are PupPal's highest-leverage paid acquisition channel. A single dog training creator with 100K followers can drive thousands of installs. But you need:
- Accurate attribution (which influencer drove which install?)
- Per-influencer conversion tracking (who drives installs that convert to paid?)
- Commission calculation (pay per install? per conversion? flat fee + bonus?)

### Influencer Link Format

```
https://puppal.app/c/{campaign_code}

Example: https://puppal.app/c/ZAKTHEDOGTRAINER
```

Campaign codes are:
- Created in admin dashboard (or via API)
- Assigned to a specific influencer/campaign
- Track impressions (link clicks), installs, trials, conversions separately
- Support UTM parameters for additional tracking: `?utm_source=instagram&utm_medium=story&utm_campaign=zak_march`

### Influencer Deep Link Flow

Same as referral deep link but with campaign tracking:

1. Follower taps influencer's link
2. Web redirect page logs click (impression)
3. Redirect to App Store / Play Store
4. On app install + first open: campaign code captured
5. Attribution stored on user record
6. All downstream events (trial, conversion, retention) attributed to campaign

### Campaign Data Model

```
Campaign {
  id: UUID
  code: string (unique)          // "ZAKTHEDOGTRAINER"
  name: string                   // "Zak George - March 2026"
  type: enum (influencer / affiliate / paid_ad / organic / partnership)
  influencer_name: string (nullable)
  influencer_platform: string (nullable)  // instagram, tiktok, youtube
  influencer_handle: string (nullable)
  commission_type: enum (flat_fee / per_install / per_conversion / revenue_share)
  commission_amount: float (nullable)     // $5 per install, 20% revenue share, etc.
  budget: float (nullable)
  start_date: date
  end_date: date (nullable)
  active: boolean
  created_at: timestamp
}

CampaignEvent {
  id: UUID
  campaign_id: UUID
  event_type: enum (impression / install / trial_started / converted / churned)
  user_id: UUID (nullable)
  platform: enum (ios / android)
  device_info: JSON (nullable)
  created_at: timestamp
}

-- On users table:
attributed_campaign_id: UUID (nullable)
attributed_referral_code: string (nullable)
attribution_source: enum (organic / referral / campaign / unknown)
attributed_at: timestamp (nullable)
```

### Attribution Priority

If a user has both a referral code AND a campaign code:
1. Campaign code takes priority for business attribution (influencer gets credit)
2. Referrer still gets XP reward (both can be tracked)
3. Log both for analytics

### Influencer Dashboard (Admin)

Not in-app for v1. Use a simple Supabase table view or build a basic admin page:

```
Campaign: ZAKTHEDOGTRAINER
Period: March 1-31, 2026

Link clicks:     2,450
Installs:          890  (36% click-to-install)
Trials:            534  (60% install-to-trial)
Conversions:       187  (35% trial-to-paid)
Revenue:        $7,468  ($39.99 × 187)
Commission:     $1,494  (20% revenue share)
CPA:             $7.99  (commission / conversion)
ROI:              400%
```

---

## 4. Organic Sharing Engine

### Every Milestone Is a Share Moment

PupPal generates shareable branded cards for:

| Moment | Card Content |
|--------|-------------|
| Achievement unlock | Badge icon + achievement name + dog name + stat |
| Streak milestone (7/14/30/60/90) | Flame icon + streak count + dog name |
| Level up | Level badge + new title + dog name |
| GBS milestone (every 10 points) | Score gauge + score + breed comparison |
| Trick mastered (Level 3) | Trick name + "mastered!" + dog name + photo if available |
| Weekly challenge completed | Challenge name + completion badge |
| Plan graduation (Week 12) | Graduation cap + full stats summary |
| Growth Journal monthly recap | Before/after photo collage + stat changes |

### Share Card Generation

Cards are generated server-side (Supabase Edge Function) as images:

```ts
// POST /api/share/generate
{
  type: "achievement",         // or streak, level_up, gbs, trick, etc.
  data: {
    achievement_name: "Sit Happens",
    dog_name: "Luna",
    dog_photo_url: "...",
    stat_value: "42",
    stat_label: "Good Boy Score",
    streak: 12,
    referral_code: "LUNA2024"
  }
}
// Returns: { image_url: "https://..." }
```

### Card Design Specs

**Instagram Stories optimized** (1080×1920):
- PupPal logo top-left
- Achievement/milestone visual centered
- Dog name + stat prominent
- Referral link bottom: "puppal.app/r/CODE"
- "Get PupPal" watermark

**Twitter/Instagram feed optimized** (1200×675):
- Horizontal layout
- Same elements, rearranged for landscape

### Share Flow

1. Milestone occurs → celebration overlay
2. "Share" button on overlay
3. System generates card image (cached if already generated)
4. Native share sheet opens (iOS/Android)
5. User selects platform (iMessage, Instagram, WhatsApp, etc.)
6. Card shared with referral link
7. Analytics: `share_initiated`, `share_completed` with platform

### Share Tracking

```
ShareEvent {
  id: UUID
  user_id: UUID
  dog_id: UUID
  share_type: enum (achievement / streak / level_up / gbs / trick / challenge / graduation / growth_recap)
  share_item_id: string          // achievement_id, trick_id, etc.
  card_image_url: string
  referral_code_included: boolean
  platform: string (nullable)    // detected from share sheet if possible
  shared_at: timestamp
}
```

---

## 5. Viral Coefficient Optimization

### K-Factor Calculation

```
K = invites_sent_per_user × conversion_rate_per_invite

Target: K = 0.3-0.5
Meaning: Every 10 users bring 3-5 new users
```

### Levers to Increase K

**Increase invites sent**:
- More shareable moments (achievements, tricks, growth photos)
- Higher quality share cards (people share beautiful content)
- Buddy prompts referrals at natural moments
- Referral rewards are compelling (free months)
- Referral program is easy to find and use

**Increase conversion per invite**:
- Share cards are beautiful and branded (not spammy)
- Referral link goes to optimized landing page (not just App Store)
- Social proof on landing page ("Join 10K+ puppy parents")
- Referee gets benefit (extra Buddy message)
- Deep link works seamlessly (no friction)

### Referral Landing Page

```
https://puppal.app/r/{code}
```

Shows a brief mobile-optimized page before redirect:

```
┌─────────────────────────────┐
│  🐾 PupPal                   │
│                              │
│  [Referrer]'s puppy          │
│  [Name] is crushing          │
│  training!                   │
│                              │
│  ┌──────────────────────┐    │
│  │ [Achievement card     │    │
│  │  preview if shared    │    │
│  │  from a milestone]    │    │
│  └──────────────────────┘    │
│                              │
│  AI-powered puppy training   │
│  that actually works.        │
│                              │
│  ✓ Personalized plan         │
│  ✓ AI mentor available 24/7  │
│  ✓ 30+ tricks to teach       │
│                              │
│  ┌───────────────────────┐   │
│  │  Get PupPal Free →    │   │
│  └───────────────────────┘   │
│                              │
│  4.8★ · 10K+ puppy parents  │
└─────────────────────────────┘
```

This page is a simple static site (Vercel or Cloudflare Pages) that:
- Renders the referrer's milestone card if shared from one
- Shows social proof
- Redirects to App Store / Play Store on CTA tap
- Passes referral code through to app

---

## 6. Anti-Fraud & Abuse Prevention

### Self-Referral Prevention
- Referral code cannot be applied to same device that generated it (device fingerprint)
- Same Apple ID / Google account cannot be both referrer and referee
- IP-based rate limiting: max 5 referral installs from same IP in 24 hours

### Fake Account Prevention
- Referral reward (XP) only granted after referee completes at least 1 exercise (proves real usage)
- Free month reward only granted after referee's PAID subscription (not trial start)
- Referral code has max 100 uses per month (prevents mass distribution abuse)

### Influencer Fraud Prevention
- Campaign installs cross-referenced with App Store/Google Play install attribution
- Suspicious patterns flagged: burst installs from same region, no exercise completions, immediate uninstalls
- Commission withheld for 30 days (chargeback window)

---

## 7. API Endpoints

```
// Referral
GET /api/referral/my-code                — Get current user's referral code + stats
POST /api/referral/customize-code        — Set vanity code
POST /api/referral/apply                 — Apply referral code during onboarding
GET /api/referral/stats                  — Referral dashboard data
POST /api/referral/validate/{code}       — Check if code is valid

// Campaign/Attribution
POST /api/attribution/log                — Log campaign click/impression
POST /api/attribution/assign             — Assign campaign to new user
GET /api/admin/campaigns                 — List all campaigns (admin)
POST /api/admin/campaigns                — Create campaign (admin)
GET /api/admin/campaigns/{id}/stats      — Campaign performance (admin)

// Sharing
POST /api/share/generate                 — Generate share card image
POST /api/share/log                      — Log share event
```

---

## 8. Analytics Events

```
// Referral
referral_code_viewed          { source: profile/share_card/buddy }
referral_link_shared          { platform, context }
referral_code_applied         { code, source: deep_link/manual }
referral_install_attributed   { referrer_id, platform }
referral_trial_attributed     { referrer_id }
referral_conversion_attributed { referrer_id, revenue }
referral_reward_granted       { reward_type: xp/free_month, amount }
referral_code_customized      { old_code, new_code }

// Campaign
campaign_impression           { campaign_id, platform, source }
campaign_install              { campaign_id, platform }
campaign_trial                { campaign_id }
campaign_conversion           { campaign_id, revenue }

// Sharing
share_card_generated          { type, milestone_id }
share_initiated               { type, platform }
share_completed               { type, platform }
```

---

## 9. Edge Cases

| Scenario | Handling |
|----------|----------|
| Referral code expired or invalid | "This code isn't valid. You can still get PupPal free!" |
| User tries to use their own code | "This is your code! Share it with friends to earn rewards." |
| Referee already has account | "This account already exists. Referral code can only be applied to new accounts." |
| Referrer account deleted | Referee still gets benefit. Referrer rewards voided. |
| Multiple referral codes applied | First code wins. Second code rejected: "A referral code has already been applied." |
| Referral link clicked on desktop | Show "Open on your phone to download PupPal" with QR code. |
| Campaign and referral code both present | Campaign gets business attribution. Referrer still gets XP reward. |
| Influencer creates fraudulent installs | 30-day commission holdback. Flag patterns. Manual review before payout. |
| User customizes code to something offensive | Profanity filter on custom codes. Reject with "That code isn't available." |
| Referral reward: free month for lifetime subscriber | Grant 200 XP instead (can't add months to lifetime). |

---

## 10. Dependencies

| Dependency | Purpose | Fallback |
|------------|---------|----------|
| Expo deep linking | Referral link handling | Manual code entry |
| Referral landing page (web) | Pre-App-Store redirect | Direct App Store link |
| Supabase Edge Functions | Share card generation | Client-side card (lower quality) |
| RevenueCat (PRD #06) | Conversion attribution | Manual tracking |
| Gamification (PRD #04) | XP rewards | Referral works without XP |
| Share sheet (React Native) | Native sharing | Copy link fallback |

---

## 11. Acceptance Criteria

- [ ] Every user gets unique referral code on account creation
- [ ] Referral link opens app (if installed) or App Store (if not)
- [ ] Manual code entry works during onboarding
- [ ] Referral code correctly attributed to new user record
- [ ] XP rewards granted to referrer on install + trial start
- [ ] Free month granted to referrer on referee paid conversion
- [ ] Referee gets extra Buddy message/day during trial
- [ ] Vanity code customization works with profanity filter
- [ ] Referral stats accurate in profile screen
- [ ] Campaign links track impressions, installs, trials, conversions
- [ ] Campaign attribution stored on user record
- [ ] Share cards generate with correct content and referral link
- [ ] Share cards optimized for Instagram Stories (1080×1920)
- [ ] Native share sheet opens with card + link
- [ ] Self-referral prevention blocks same device/account
- [ ] Rate limiting prevents abuse (5 installs/IP/day, 100 uses/month)
- [ ] Buddy mentions referrals naturally (max 1x/week)
- [ ] All analytics events fire correctly
- [ ] Referral landing page renders on web with app store redirect
