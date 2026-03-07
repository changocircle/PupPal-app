# PRD #19: Kennel & Breeder Partnership Program

## PupPal — Getting Users at the Exact Moment They Need You Most

**Document version**: 1.0
**Feature owner**: Ashley
**Status**: Draft
**Priority**: P2 — This is PupPal's highest-intent acquisition channel. When someone walks out of a breeder or kennel with a new puppy, they are panicking about potty training within 24 hours. If PupPal is in their hands at that exact moment, conversion rates will be 3-5x higher than any ad. This is a mid-term growth play — requires partnerships and operational infrastructure, but the unit economics are exceptional.

---

## 1. Overview & Purpose

The Kennel & Breeder Partnership Program is a B2B2C distribution channel where breeders, kennels, shelters, and pet stores recommend PupPal to every new puppy owner at the point of purchase/adoption.

### How It Works

1. **Breeder signs up** for PupPal's partner program (simple web form)
2. **Breeder gets** a unique partner code, QR cards/flyers, and a partner dashboard
3. **Breeder gives** new puppy buyers a card with a QR code: "Scan to start your puppy's free training plan"
4. **Buyer scans** the QR code → PupPal onboarding with partner code pre-applied
5. **Buyer converts** → PupPal pays the breeder a commission or the breeder adds PupPal to their package price

### Why This Works

- **Timing**: New puppy owners need training help RIGHT NOW. Not next week. Today.
- **Trust transfer**: "My breeder recommended this" is the most powerful endorsement in the dog world. Breeders are trusted authorities.
- **Zero CAC for PupPal**: The breeder does the selling. PupPal only pays when a user converts to paid.
- **Win-win-win**: Breeder earns passive income and looks like they provide exceptional aftercare. Buyer gets a free trial of a training app at the perfect moment. PupPal gets a high-intent user at zero upfront cost.
- **Scale potential**: There are ~10,000 registered breeders in the US alone, plus thousands of pet stores, shelters, and rescue organizations. Even 500 active partners sending 5 users/month = 2,500 high-intent installs/month.

### Success Metrics

| Metric | Target | How Measured |
|--------|--------|-------------|
| Active partners (sending 1+ user/month) | 200+ within 12 months | Partner dashboard |
| Monthly installs from partners | 1,000+ within 12 months | Attribution tracking |
| Partner-referred trial start rate | 70%+ (vs 40-60% organic) | RevenueCat by source |
| Partner-referred trial-to-paid conversion | 50%+ (vs 35-45% organic) | RevenueCat by source |
| Partner revenue share paid out | Tracking only (cost of channel) | Finance |
| Partner NPS | 50+ | Quarterly survey |
| Average users sent per active partner/month | 5+ | Partner dashboard |
| Partner retention (still active after 6 months) | 60%+ | Partner status tracking |

---

## 2. User Stories

### Breeder/Partner Stories

- **PS-1**: As a breeder, I want to sign up easily and get marketing materials quickly so I can start recommending PupPal to my puppy buyers.
- **PS-2**: As a breeder, I want to see how many of my buyers used PupPal and how much commission I've earned so I can track the value of the partnership.
- **PS-3**: As a breeder, I want branded materials (cards, flyers) that look professional so they match the quality of my breeding program.
- **PS-4**: As a breeder, I want to bundle PupPal into my puppy package at a wholesale price so I can offer it as a premium add-on.
- **PS-5**: As a shelter, I want to give every adopter a training app recommendation so we reduce return rates from behavioral issues.

### Buyer/User Stories

- **US-1**: As a new puppy owner, I want to scan a QR code from my breeder and immediately get a personalized training plan so I can start training on day one.
- **US-2**: As a new puppy owner referred by my breeder, I want an extended free trial so I have more time to see the value before paying.
- **US-3**: As a new puppy owner, I want my breeder's recommendation to feel genuine, not like I'm being sold something.

---

## 3. Partnership Tiers

### Tier 1: Referral Partner (Default)

For individual breeders, small kennels, and hobby breeders.

| Element | Details |
|---------|---------|
| Sign-up | Web form (name, kennel name, website, breeds, estimated puppies/year) |
| Approval | Auto-approved (basic validation) |
| Partner code | Auto-generated: `KENNEL-{name}-{random}` (e.g., `KENNEL-GOLDENACRES-X7K2`) |
| Materials | Digital: PDF flyer, QR code card (print-at-home), email template |
| Buyer benefit | Extended 7-day free trial (vs standard 3-day) |
| Partner reward | 25% revenue share on first-year subscription of every referred user who converts |
| Dashboard | Basic: installs, trials, conversions, earnings, payout history |
| Payout | Monthly via Stripe Connect (minimum $25 threshold) |
| Support | Email support, partner FAQ |

### Tier 2: Premium Partner

For established breeders, kennels with 20+ puppies/year, and pet stores.

| Element | Details |
|---------|---------|
| Sign-up | Application (reviewed within 48 hours) |
| Approval | Manual review (verify business, website, volume) |
| Partner code | Custom vanity code: `KENNEL-{chosen_name}` |
| Materials | Digital + physical: 100 branded QR cards shipped free, counter display stand, branded puppy packet insert |
| Buyer benefit | Extended 14-day free trial + 1 free Buddy chat session (even post-trial) |
| Partner reward | 30% revenue share on first-year subscription |
| Dashboard | Full: installs, trials, conversions, earnings, breed breakdown, monthly trends |
| Payout | Monthly via Stripe Connect (no minimum) |
| Support | Dedicated partner email + quarterly check-in |
| Bonus | Featured in PupPal's "Recommended Breeders" directory (if launched) |

### Tier 3: Bundle Partner

For breeders and pet stores who want to include PupPal in their puppy purchase price.

| Element | Details |
|---------|---------|
| Model | Breeder purchases PupPal annual subscriptions at wholesale ($19.99/unit, 50% off retail) |
| Minimum order | 10 units per quarter |
| Delivery | Unique redemption codes (one per puppy buyer) |
| Buyer experience | Scan code → full premium access activated immediately (no trial, no paywall) |
| Partner margin | Breeder charges whatever they want above $19.99 (typically bundles into puppy price) |
| Payout | PupPal receives wholesale price upfront |
| Dashboard | Full dashboard + redemption tracking per code |

### Tier 4: Shelter/Rescue Partner (Non-Commercial)

Shelters and rescues don't sell puppies for profit. Different model.

| Element | Details |
|---------|---------|
| Sign-up | Application (verify 501(c)(3) status or equivalent) |
| Approval | Manual review |
| Partner code | `RESCUE-{name}` |
| Materials | Digital + physical (cards shipped free, no minimum) |
| Adopter benefit | 30-day free trial (extended from 3-day) |
| Partner reward | No revenue share — this is a CSR/goodwill play |
| Dashboard | Basic: installs, trials, adoption success stories |
| PupPal benefit | Positive PR, shelter partnerships, potential co-marketing |
| Bonus | "PupPal Shelter Partner" badge for their website/social |

---

## 4. Partner Onboarding Flow

### Step 1: Partner Landing Page

```
https://puppal.app/partners
```

**Page content**:
- Hero: "Give every puppy a training plan on day one"
- Value props: increase buyer satisfaction, reduce return calls, earn passive income
- Tier comparison (simple table)
- "Apply Now" CTA → partner application form
- Testimonials (when available)
- FAQ section

### Step 2: Application Form

**Tier 1 (auto-approved)**:
- Full name
- Kennel/business name
- Email
- Website or social media (optional)
- Breeds they work with (multi-select)
- Estimated puppies placed per year
- Country
- How they heard about PupPal
- Accept partner terms

**Tier 2/3/4 (manual review)**:
- All of the above, plus:
- Business registration / 501(c)(3) documentation
- Estimated monthly volume
- Preferred vanity code
- Shipping address (for physical materials)

### Step 3: Approval & Setup

- Tier 1: Instant approval → welcome email with code, materials, dashboard access
- Tier 2-4: Review within 48 hours → approval email → materials shipped within 5 business days

### Step 4: Welcome Kit

**Digital (all tiers)**:
- Partner code and QR code (as image file)
- Print-ready PDF: QR card (business card size)
- Print-ready PDF: A5 flyer for puppy packets
- Email template: partner can forward to buyers
- Social media post templates (Instagram, Facebook)
- Partner guide: "How to Recommend PupPal to Your Puppy Buyers"

**Physical (Tier 2+ only)**:
- 100x branded QR cards (thick cardstock, PupPal + partner co-branded)
- 1x counter display stand with QR code
- 1x puppy packet insert (A6 card with QR code + Buddy illustration)

---

## 5. Partner Attribution & Tracking

### QR Code / Deep Link Flow

```
Partner QR card
  → https://puppal.app/p/{partner_code}
    → Mobile: redirect to App Store / Play Store with attribution params
    → Desktop: show "Download PupPal" page with QR code

App Store install
  → First app open: check for stored attribution (via Adjust/AppsFlyer)
  → If partner_code present: store on user profile
  → Onboarding begins with partner context:
    - Extended trial length (7, 14, or 30 days depending on tier)
    - Partner code stored on user record
    - RevenueCat attribute: source = "partner", partner_code = "{code}"
```

### Attribution Data Flow

```
1. QR scan → puppal.app/p/{code} → attribution SDK stores code
2. App install → SDK reads attribution → stored in Supabase + RevenueCat
3. Trial start → RevenueCat logs with partner attribution
4. Conversion → RevenueCat webhook → Supabase calculates commission
5. Monthly → Commission aggregated → Stripe Connect payout
```

### Attribution Window

- 30 days from QR scan to install (standard attribution window)
- No limit from install to conversion (if they install via partner link, partner gets credit regardless of when they convert)
- Attribution is first-touch: if a user sees an ad AND scans a partner QR, partner gets credit (they were the first touchpoint in the real world)

### Handling Attribution Conflicts

| Scenario | Resolution |
|----------|-----------|
| Partner QR + influencer code both present | Partner QR takes priority (real-world > digital) |
| Partner QR + friend referral link | Partner QR takes priority. Friend still gets XP (PRD-08) |
| Multiple partner QR scans | First partner gets credit |
| User reinstalls after attribution window | Re-check stored partner code. If present, maintain attribution |

---

## 6. Partner Dashboard

### Access

```
https://partners.puppal.app
```

Simple web app (Next.js or static site + Supabase auth). Partners log in with email + magic link.

### Dashboard — Tier 1 (Basic)

```
┌──────────────────────────────────────────────────┐
│  Welcome, Golden Acres Kennel                     │
│  Partner code: KENNEL-GOLDENACRES-X7K2            │
│                                                    │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐    │
│  │ INSTALLS   │ │ TRIALS     │ │ CONVERSIONS│    │
│  │    34       │ │    28      │ │    14       │    │
│  │ all time    │ │ 82% rate   │ │ 50% rate   │    │
│  └────────────┘ └────────────┘ └────────────┘    │
│                                                    │
│  💰 EARNINGS                                       │
│  This month:    $45.00                             │
│  All time:      $187.50                            │
│  Next payout:   April 1 ($45.00)                   │
│                                                    │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─             │
│                                                    │
│  📦 MATERIALS                                      │
│  [Download QR Card PDF]                            │
│  [Download Flyer PDF]                              │
│  [Copy Partner Link]                               │
│  [Download Email Template]                         │
│                                                    │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─             │
│                                                    │
│  ⚙️ SETTINGS                                       │
│  [Edit Profile]  [Payout Settings]  [Support]      │
└──────────────────────────────────────────────────┘
```

### Dashboard — Tier 2+ (Full)

Everything above, plus:

```
│  📊 MONTHLY TRENDS                                 │
│  [Line chart: installs, trials, conversions        │
│   over last 6 months]                              │
│                                                    │
│  🐕 BREED BREAKDOWN                                │
│  Golden Retriever:   18 installs (53%)             │
│  Labrador:           10 installs (29%)             │
│  Goldendoodle:        6 installs (18%)             │
│                                                    │
│  📈 CONVERSION FUNNEL                              │
│  QR Scans → Installs → Trials → Paid              │
│   120    →    34     →   28   →  14               │
│                                                    │
│  🎟️ BUNDLE CODES (Tier 3 only)                     │
│  [Generate New Codes]                              │
│  Active codes: 8 / 10 (2 unredeemed)              │
│  Code: PPGA-001  Status: Redeemed  User: Active   │
│  Code: PPGA-002  Status: Pending                   │
│  ...                                               │
```

---

## 7. Commission & Payout System

### Revenue Share Calculation

```
Commission = subscription_price × revenue_share_rate × (1 - apple_google_fee)

Example (Tier 1, annual plan):
  $39.99 × 25% × 70% (after Apple's 30%) = $7.00 per conversion

Example (Tier 2, annual plan):
  $39.99 × 30% × 70% = $8.40 per conversion

Example (Tier 1, monthly plan):
  $9.99 × 25% × 70% = $1.75 per conversion (first month only)
```

### Commission Rules

- Commission paid on first payment only (not renewals) — keeps it simple and predictable
- Trial conversions only (not free-tier users who later upgrade independently)
- Attribution must be within the attribution window
- Refunded subscriptions: commission clawed back
- Commission calculated after Apple/Google fee (net revenue share)

### Payout Infrastructure

**Stripe Connect** (Express accounts):
- Partner signs up for Stripe Express during onboarding
- Monthly payouts on the 1st (for previous month's commissions)
- Minimum payout: $25 (Tier 1) / $0 (Tier 2+)
- Payout currencies: USD, EUR, GBP, BRL (matches partner's bank)
- Tax forms: Stripe handles 1099 generation for US partners

### Payout Data Model

```
PartnerPayout {
  id: UUID
  partner_id: UUID
  period_start: date
  period_end: date
  total_conversions: integer
  total_revenue: float        // gross subscription revenue attributed
  commission_rate: float      // 0.25 or 0.30
  platform_fee_rate: float    // 0.30 (Apple/Google)
  commission_amount: float    // net commission
  adjustments: float          // refund clawbacks
  payout_amount: float        // final payout
  stripe_transfer_id: string (nullable)
  status: enum (pending / processing / paid / failed)
  paid_at: timestamp (nullable)
  created_at: timestamp
}
```

---

## 8. Buyer Experience (User-Facing)

### QR Code Scan → Onboarding

When a buyer scans the partner QR code:

1. **Landing page** (2 seconds): "Your breeder recommends PupPal! Get a free personalized training plan for your new puppy."
   - Shows partner/kennel name: "Recommended by Golden Acres Kennel"
   - "Download Free" CTA → App Store / Play Store
   - Partner code auto-stored via attribution SDK

2. **App opens**: Standard onboarding (PRD-01) with two differences:
   - Screen 1: Buddy says "Welcome! I see you're coming from [Kennel Name] — great choice! Let's get your new puppy set up."
   - Screen 8 (Paywall): Extended trial shown instead of standard 3-day:
     - Tier 1 referral: 7-day trial
     - Tier 2 referral: 14-day trial
     - Tier 3 bundle: No paywall (premium pre-activated)
     - Tier 4 shelter: 30-day trial

3. **Partner attribution visible**: In Settings → Subscription, show "Referred by [Kennel Name]" (builds trust, reminds user of the recommendation source)

### Bundle Code Redemption (Tier 3)

Buyer receives a unique code (physical card or email from breeder):

```
Redemption code: PPGA-LUNA-2026

Redeem at: puppal.app/redeem
```

1. Open `puppal.app/redeem` → enter code → redirect to App Store
2. OR: In app → Settings → "Redeem Code" → enter code
3. Code validates → premium activated immediately (no trial, no paywall)
4. Full onboarding still runs (need dog profile data)
5. Code can only be redeemed once

---

## 9. Partner Recruitment Strategy

### Phase 1: Seed Partners (Pre-Launch / Launch Month)

Target: 20-30 partners across popular breeds.

**Outreach channels**:
- AKC Marketplace breeder listings (public contact info)
- Instagram: search #[breed]breeder, #[breed]puppies
- Facebook breeder groups (Golden Retriever Breeders of America, etc.)
- Direct outreach to breeders with active websites and social presence

**Pitch template**:

```
Subject: Free training app for your puppy buyers (earn $7+ per puppy)

Hi [Breeder Name],

I'm building PupPal — an AI-powered puppy training app that gives 
every puppy a personalized 12-week training plan based on their 
breed, age, and challenges.

I'd love to partner with [Kennel Name]. Here's how it works:

1. We send you free QR cards to include in your puppy packets
2. Your buyers scan the code and get an extended free trial
3. When they subscribe, you earn 25-30% of the first year ($7-8 per puppy)

It's completely free for you — no cost, no obligation. Your 
buyers get better-trained puppies (which means fewer "I can't handle 
this puppy" calls for you), and you earn passive income.

Interested? Sign up in 2 minutes: puppal.app/partners

Happy to chat if you have questions!

— Ashley, Founder @ PupPal
```

### Phase 2: Shelter Partnerships (Month 2-3)

Shelters are high-volume but non-commercial. Benefits to PupPal:
- Positive PR and social impact story
- High-volume installs (large shelters place 100+ dogs/month)
- Content marketing: "PupPal partners with [Shelter] to reduce returns"
- Shelter adopters often have the most acute training needs (behavioral issues)

**Target**: Top 50 shelters in US by volume (ASPCA, Humane Society branches, local large shelters).

### Phase 3: Pet Store Partnerships (Month 4-6)

Independent pet stores (NOT chains like PetSmart — those require corporate deals). Target stores that sell puppies or host adoption events.

### Phase 4: Vet Clinic Partnerships (Month 6-12)

Vets see every new puppy within the first weeks. A QR code in the waiting room or in the puppy's first-visit packet is a natural touchpoint. Different pitch: PupPal's health tracker helps puppy owners remember vaccination schedules (reduces missed appointments).

---

## 10. Data Model

### Partner Profile

```
Partner {
  id: UUID
  name: string                    // Contact person name
  business_name: string           // Kennel / shelter / store name
  email: string
  phone: string (nullable)
  website: string (nullable)
  social_url: string (nullable)
  partner_type: enum (breeder / kennel / shelter / pet_store / vet_clinic / other)
  tier: enum (tier_1 / tier_2 / tier_3 / tier_4)
  partner_code: string (unique)   // e.g., "KENNEL-GOLDENACRES-X7K2"
  vanity_code: string (nullable, unique)  // e.g., "GOLDENACRES"
  breeds: array of string         // breeds they work with
  estimated_volume_monthly: integer  // estimated puppies placed/month
  country: string
  region: string (nullable)
  stripe_connect_id: string (nullable)
  commission_rate: float          // 0.25 or 0.30
  status: enum (pending / active / suspended / terminated)
  approved_at: timestamp (nullable)
  approved_by: string (nullable)
  materials_shipped: boolean
  materials_shipped_at: timestamp (nullable)
  shipping_address: JSON (nullable)
  notes: text (nullable)          // Internal notes
  created_at: timestamp
  updated_at: timestamp
}
```

### Partner Attribution on User

```
-- Added to User table
partner_id: UUID (nullable, FK)
partner_code: string (nullable)
partner_attributed_at: timestamp (nullable)
partner_tier: string (nullable)
partner_trial_days: integer (nullable)  // extended trial from partner
```

### Bundle Redemption Codes

```
BundleCode {
  id: UUID
  partner_id: UUID (FK)
  code: string (unique)          // e.g., "PPGA-LUNA-2026"
  batch_id: string               // groups codes from same purchase
  status: enum (active / redeemed / expired / revoked)
  redeemed_by: UUID (nullable, FK to User)
  redeemed_at: timestamp (nullable)
  expires_at: timestamp           // codes expire after 6 months
  created_at: timestamp
}
```

### Partner Events

```
PartnerEvent {
  id: UUID
  partner_id: UUID
  event_type: enum (
    qr_scanned / link_clicked /
    install_attributed / trial_started / trial_converted /
    subscription_cancelled / subscription_refunded /
    bundle_code_redeemed /
    payout_processed / payout_failed
  )
  user_id: UUID (nullable)
  revenue: float (nullable)
  commission: float (nullable)
  event_data: JSON (nullable)
  created_at: timestamp
}
```

---

## 11. Integration Points

### With Onboarding (PRD #01)
- Partner code detected → Buddy acknowledges partner/kennel on Screen 1
- Extended trial length applied at paywall (Screen 8)
- Partner code stored on user profile

### With Paywall & Subscriptions (PRD #06)
- Extended trial durations configured per partner tier
- RevenueCat attribute: `partner_code`, `partner_tier`
- Conversion events trigger commission calculation

### With Referral System (PRD #08)
- Partner attribution and referral attribution can coexist (different purposes)
- Partner gets commission, referrer gets XP — both tracked independently
- Partner QR takes priority over referral link if both present

### With Analytics (PRD #13)
- Partner-attributed installs, trials, conversions as separate segments
- Partner ROI dashboard in admin (PRD-20)
- Cohort comparison: partner-referred vs organic vs influencer vs paid

### With Email Sequences (PRD #18)
- Partner-referred users get a slightly different Day 0 email: "Your breeder [Kennel Name] set you up with PupPal!"
- Extended trial reminders adjust to 7/14/30-day timelines instead of 3-day

### With Admin Dashboard (PRD #20)
- Partner management section: approve/reject, view all partners, performance overview
- Commission payouts overview
- Partner-attributed revenue as a channel in acquisition dashboards

---

## 12. Analytics Events

```
// Partner program
partner_signup_started         { partner_type, source }
partner_signup_completed       { partner_id, tier, partner_type }
partner_approved               { partner_id, tier, approved_by }
partner_rejected               { partner_id, reason }
partner_materials_downloaded   { partner_id, material_type }
partner_materials_shipped      { partner_id }

// Attribution
partner_qr_scanned             { partner_code }
partner_link_clicked           { partner_code, source }
partner_install_attributed     { partner_code, partner_id, user_id }
partner_trial_started          { partner_code, trial_days, plan_type }
partner_trial_converted        { partner_code, plan_type, revenue, commission }
partner_subscription_cancelled { partner_code, duration_days }
partner_subscription_refunded  { partner_code, commission_clawed_back }

// Bundle
bundle_codes_generated         { partner_id, count, batch_id }
bundle_code_redeemed           { partner_id, code, user_id }

// Payouts
partner_payout_calculated      { partner_id, amount, conversions }
partner_payout_processed       { partner_id, amount, stripe_transfer_id }
partner_payout_failed          { partner_id, amount, error }

// Dashboard
partner_dashboard_login        { partner_id }
partner_dashboard_materials_downloaded { partner_id, material }
```

---

## 13. Edge Cases

| Scenario | Handling |
|----------|----------|
| Partner code expired or invalid | Show standard onboarding (no extended trial). Log `partner_code_invalid`. |
| User installs without partner QR but later enters partner code manually | Allow manual code entry in Settings → "Enter Referral/Partner Code." Apply partner attribution retroactively. Extended trial only applies if within first 24 hours. |
| Breeder sells puppy to someone who already has PupPal | Existing user cannot double-redeem. Partner still gets attribution credit if user is on free tier and converts. |
| Bundle code redeemed by someone who already has premium | Code consumed but no change to subscription. Notify partner: "Code redeemed by existing subscriber." |
| Partner requests code change (vanity code) | Allow one change per 90 days. Update all materials, old code redirects to new code for 180 days. |
| Refund within first 14 days | Commission clawed back. Partner notified in dashboard. |
| Partner reaches payout threshold mid-month | Payout still processed on 1st of next month (no mid-month payouts). |
| Stripe Connect onboarding abandoned | Partner can still use referral features (tracking works). Payouts accumulate until Stripe setup complete. Reminder emails at Day 7, 14, 30. |
| Shelter partner refers 100+ users/month | Monitor for abuse. Shelters should only refer adopters, not run PupPal ads. If suspicious, review and potentially cap. |
| Partner terminated (bad behavior) | Deactivate code immediately. Existing attributed users keep their trials/subscriptions. Pending payouts: honor earned commissions, then terminate. |
| International partner (non-US) | Stripe Connect supports 40+ countries. Materials translated per PRD-17 if partner's market language is supported. Commissions in partner's local currency. |
| Partner's breeder website goes offline | No impact on PupPal attribution. QR codes still work. Partner status remains active. |

---

## 14. Dependencies

| Dependency | Purpose | Fallback |
|------------|---------|----------|
| Stripe Connect | Partner payouts | Manual bank transfers (painful, don't do this) |
| Adjust or AppsFlyer | Partner QR → install attribution | UTM + deferred deep link (less reliable) |
| Supabase | Partner profiles, events, commissions | Required — no fallback |
| Next.js or static site | Partner dashboard + landing page | Simple Retool admin (less polished) |
| Print vendor | Physical QR cards and materials (Tier 2+) | Partners print their own from PDF |
| Customer.io (PRD #18) | Partner welcome emails, payout notifications | Manual emails (terrible at scale) |
| RevenueCat | Subscription attribution + extended trials | Direct StoreKit (lose attribution) |
| PostHog (PRD #13) | Partner channel analytics | Supabase queries |

---

## 15. Acceptance Criteria

- [ ] Partner landing page live at puppal.app/partners
- [ ] Partner application form collects all required fields per tier
- [ ] Tier 1 applications auto-approved and welcome email sent with code + materials
- [ ] Tier 2-4 applications queued for manual review with admin notification
- [ ] Partner QR codes generate correctly and link to puppal.app/p/{code}
- [ ] QR scan → App Store → install → partner code attributed on user profile
- [ ] Extended trial length correctly applied per partner tier (7, 14, or 30 days)
- [ ] Buddy acknowledges partner on onboarding Screen 1
- [ ] Paywall shows correct extended trial duration
- [ ] Bundle codes generate in batches and are unique per code
- [ ] Bundle code redemption activates premium immediately
- [ ] Bundle codes expire after 6 months if unredeemed
- [ ] Partner dashboard accessible via partners.puppal.app with magic link auth
- [ ] Dashboard shows correct install, trial, conversion, and earnings data
- [ ] Commission calculated correctly (revenue × rate × net of platform fee)
- [ ] Stripe Connect onboarding works for partners
- [ ] Monthly payouts process automatically on the 1st
- [ ] Payout minimum enforced ($25 for Tier 1, $0 for Tier 2+)
- [ ] Refund clawbacks deducted from next payout
- [ ] Partner code attribution takes priority over influencer/referral codes
- [ ] Partner-referred cohort trackable in PostHog
- [ ] All partner events logged correctly
- [ ] Partner materials (PDF flyer, QR card, email template) downloadable from dashboard
- [ ] Partner status can be suspended/terminated from admin dashboard (PRD-20)
