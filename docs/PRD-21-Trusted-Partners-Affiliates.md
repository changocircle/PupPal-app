# PRD #21: Trusted Partners & Affiliate Program

## PupPal — Curated Recommendations That Help Dogs (and Make Money)

**Document version**: 1.0
**Feature owner**: Ashley
**Status**: Draft
**Priority**: P2 — Affiliate revenue is a secondary monetization stream, but more importantly, recommending the right products at the right moment makes PupPal more valuable. When Buddy recommends the perfect treat for leash training a stubborn Husky, that's not an ad — it's personalized expert advice. If PupPal earns a commission, great. The user got a genuinely useful recommendation they trust because Buddy suggested it.

---

## 1. Overview & Purpose

The Trusted Partners program is PupPal's curated affiliate recommendation system. It connects users with vetted, high-quality pet products and services at the moments when they're most relevant — during training, health events, milestones, and daily care.

### This Is NOT an Ad Network

PupPal will never:
- Sell ad space inside the app
- Show banner ads or interstitials
- Let brands pay for placement without editorial approval
- Recommend products PupPal hasn't vetted
- Prioritize revenue over user trust

### This IS a Recommendation Engine

PupPal will:
- Curate a shortlist of best-in-class partners across key categories
- Surface recommendations contextually (when they're genuinely helpful)
- Be transparent about affiliate relationships ("We may earn a commission")
- Only recommend products the team would use with their own dogs
- Remove partners who get consistent negative feedback from users

### Why Now (and Why It Matters for Acquisition)

Acquirers look at revenue diversification. A subscription app with $1M ARR from subscriptions alone is valued differently from one with $1M subscriptions + $200K affiliate revenue + clear scaling potential. Affiliate revenue signals:
- High user trust (they buy what you recommend)
- Multiple monetization vectors (not dependent on one revenue stream)
- Partnership ecosystem (moat, switching costs)
- Potential for B2B deals (brands want access to your audience)

### Revenue Potential

Conservative estimate at 20K active users:
- 5% of users click a recommendation per month = 1,000 clicks
- 10% of clicks convert to purchase = 100 purchases
- Average commission per purchase: $5-15
- Monthly affiliate revenue: $500-1,500
- At 100K users: $2,500-7,500/month

This grows significantly with contextual recommendations (higher relevance = higher click-through) and with brand partnerships (flat monthly sponsorship fees in addition to per-click commissions).

### Success Metrics

| Metric | Target | How Measured |
|--------|--------|-------------|
| Recommendation click-through rate | 3-5% per impression | PostHog |
| Click-to-purchase conversion | 8-15% | Affiliate platform |
| Monthly affiliate revenue | $500+ at 20K users | Affiliate platforms |
| User satisfaction with recommendations | 4.0+/5.0 rating | In-app feedback |
| Partner removal rate (quality control) | < 10% annually | Admin tracking |
| Revenue per active user from affiliates | $0.05-0.15/month | Calculated |

---

## 2. Partner Categories

### Category 1: Pet Insurance

**Why it matters**: Vet bills are the #1 financial anxiety for new puppy owners. Insurance recommendations are genuinely high-value.

| Partner | Commission | Why |
|---------|-----------|-----|
| Lemonade Pet | $25-50 per policy | Digital-first, fast claims, aligns with PupPal brand. Target demographic overlap (young, tech-savvy pet owners). Strong brand recognition. |
| Spot Pet Insurance | $20-40 per policy | Strong coverage options, good breed-specific plans |
| Healthy Paws | $30-50 per policy | Highest-rated pet insurance, no caps on payouts |

**Placement moments**:
- Onboarding: after dog profile is created (age, breed captured) → "Does [Name] have pet insurance?"
- Health tracker: when vet visit is logged → "Vet visits add up. Pet insurance can help."
- Buddy: when user asks about vet costs or health concerns → contextual recommendation
- Breed encyclopedia: health predisposition section → "Golden Retrievers are prone to hip dysplasia. Insurance can cover treatment."

### Category 2: Dog Food & Nutrition

| Partner | Commission | Why |
|---------|-----------|-----|
| The Farmer's Dog | $40-60 per subscription | Premium fresh food, breed/age customization, high AOV |
| Ollie | $30-50 per subscription | Fresh food, strong DTC brand |
| Chewy (affiliate program) | 4-8% per order | Widest selection, covers all price points |

**Placement moments**:
- Onboarding challenge "Feeding & Nutrition" selected → recommend nutrition partners
- Training exercises involving treat selection → "For training treats, we recommend..."
- Buddy chat about nutrition, weight, dietary questions
- Weekly recap: "Nutrition tip of the week" section with product link

### Category 3: Training Supplies

| Partner | Commission | Why |
|---------|-----------|-----|
| Amazon Associates | 3-5% per order | Everything — crates, leashes, treat pouches, clickers |
| Kong (direct or via Amazon) | 4-8% | Gold standard for chew toys and enrichment |
| PetSafe | 5-10% per sale | Training collars, harnesses, containment |
| Chewy | 4-8% per order | Training treat bundles, supplies |

**Placement moments**:
- Exercise requires specific supplies (crate, clicker, leash, treats) → product recommendation card below supplies list
- Buddy recommends specific products when discussing training tools
- Trick completion → "Want to teach [Name] more tricks? A clicker makes it easier."

### Category 4: DNA Testing

| Partner | Commission | Why |
|---------|-----------|-----|
| Embark | $15-25 per kit | Most comprehensive breed + health DNA test. Best for mixed breeds. |
| Wisdom Panel | $10-20 per kit | More affordable option, good breed accuracy |

**Placement moments**:
- Onboarding: breed detection low confidence or "Mixed" result → "Want to know [Name]'s exact breeds? DNA testing can tell you."
- Breed encyclopedia: mixed breed section
- Buddy: when user mentions uncertainty about breed
- Settings: dog profile → "Add DNA results" option

### Category 5: Health & Wellness

| Partner | Commission | Why |
|---------|-----------|-----|
| PetPlate or Honest Kitchen | $20-30 per subscription | Supplements, wellness products |
| Fi or Whistle | $10-20 per collar | GPS smart collars — safety + activity tracking |
| Wild One | 8-12% per order | Premium harnesses, leashes, carriers |

**Placement moments**:
- Health tracker: vaccination reminder → wellness product bundle recommendation
- Weight tracking: if puppy off growth curve → nutrition supplement recommendation
- Milestone: first walk → harness/leash recommendation

### Category 6: Pet Services

| Partner | Commission | Why |
|---------|-----------|-----|
| Rover | $15-25 per booking | Dog walking, boarding, daycare |
| Wag | $10-20 per booking | Dog walking |
| Petco (grooming) | Per referral | Grooming services |

**Placement moments**:
- Training challenge "Separation Anxiety" → "Need someone to watch [Name]? Rover is a trusted option."
- Buddy: when user mentions travel, work schedule, being away
- Milestone: socialization exercises → "Doggy daycare is great for socialization"

---

## 3. User Stories

- **US-1**: As a user doing a leash training exercise that requires a specific harness, I want to see a recommended harness so I don't have to research products separately.
- **US-2**: As a user who just set up [Name]'s health tracker, I want to know about pet insurance options so I can protect against unexpected vet bills.
- **US-3**: As a user with a mixed-breed dog, I want a DNA test recommendation so I can learn more about [Name]'s breed makeup and customize training.
- **US-4**: As a user, I want to browse all PupPal's recommended products in one place so I can see what's available.
- **US-5**: As a user, I want to know when PupPal earns a commission so I can trust that recommendations are genuine.
- **US-6**: As a user, I want to rate recommendations so that PupPal improves its suggestions over time.

---

## 4. Recommendation Surfaces

### Surface 1: Contextual Cards (Inline)

The primary recommendation method. Recommendations appear naturally within the app experience.

**In exercise detail screen**:
When an exercise lists required supplies (treats, crate, clicker, leash), show a recommendation card below the supplies section:

```
┌─────────────────────────────────────────┐
│  📦 SUPPLIES FOR THIS EXERCISE          │
│                                          │
│  • High-value training treats            │
│  • Treat pouch                           │
│  • 6-foot leash                          │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │ 🐾 Buddy's Pick                  │    │
│  │                                    │    │
│  │ [Product image]                    │    │
│  │ Zuke's Mini Naturals              │    │
│  │ Training Treats                    │    │
│  │ ★★★★★ 4.8 (12K+ reviews)         │    │
│  │ "Perfect size for training. Most  │    │
│  │  Golden Retrievers go crazy for   │    │
│  │  the chicken flavor."             │    │
│  │                                    │    │
│  │  $9.99 on Chewy                   │    │
│  │  [Shop Now →]                     │    │
│  │                                    │    │
│  │  ♡ Save  |  Affiliate link ⓘ     │    │
│  └──────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**Design rules**:
- Card is clearly separated from exercise content (different background, labeled "Buddy's Pick")
- Recommendation is breed-personalized ("Most Golden Retrievers go crazy for...")
- Affiliate disclosure: small ⓘ icon that expands to "PupPal may earn a commission when you shop through our links. We only recommend products we trust."
- Dismissible: user can tap X to hide (don't show again for this exercise)
- Max 1 recommendation per exercise screen

**In Buddy chat**:
When a user asks about products, food, or equipment, Buddy can include a recommendation:

```
User: "What treats should I use for training Luna?"

Buddy: "For Golden Retrievers, I recommend small, soft treats that 
you can break apart quickly. Luna will respond best to high-value 
treats like chicken or beef.

My top pick: Zuke's Mini Naturals — they're the perfect training 
size and most Golden owners love them.

[🐾 Shop on Chewy — $9.99 →]

Pro tip: keep a treat pouch on your hip during sessions so you 
can reward instantly!"
```

**Rules for Buddy chat recommendations**:
- Only when the user asks about products/recommendations (never unprompted)
- Max 1 product per message
- Buddy explains WHY the product is good for their specific dog
- Affiliate link is a button, not inline text
- Buddy never says "I'm recommending this because we earn a commission" — that undermines trust. The ⓘ disclosure handles this.

**In health tracker**:
When specific health events occur:

```
┌─────────────────────────────────────────┐
│  💉 UPCOMING VACCINATION                 │
│  Rabies — Due in 7 days                  │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │ 🛡️ Protect Luna's Future         │    │
│  │                                    │    │
│  │ Vet visits average $50-300.       │    │
│  │ Pet insurance can cover 80-90%.   │    │
│  │                                    │    │
│  │ Lemonade Pet Insurance            │    │
│  │ From $12/month for Golden         │    │
│  │ Retrievers                        │    │
│  │                                    │    │
│  │ [Get a Quote →]                   │    │
│  │                                    │    │
│  │ Affiliate link ⓘ                  │    │
│  └──────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### Surface 2: Trusted Partners Hub

A dedicated tab or section in the app where users can browse all partner recommendations.

**Access**: Profile → Trusted Partners (or a dedicated tab if warranted by engagement data)

```
┌──────────────────────────────────────────┐
│  🐾 TRUSTED PARTNERS                     │
│  Products and services Buddy recommends   │
│                                            │
│  ┌─ INSURANCE ──────────────────────────┐ │
│  │ [Lemonade]  [Spot]  [Healthy Paws]   │ │
│  │ Starting from $12/mo for Luna         │ │
│  │ [Compare Plans →]                     │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌─ NUTRITION ──────────────────────────┐ │
│  │ [Farmer's Dog]  [Ollie]  [Chewy]    │ │
│  │ Fresh food customized for Goldens     │ │
│  │ [Explore →]                           │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌─ TRAINING SUPPLIES ──────────────────┐ │
│  │ Top picks for Luna's training         │ │
│  │ [Treats]  [Leashes]  [Crates]  [Toys]│ │
│  │ [Shop All →]                          │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌─ DNA TESTING ────────────────────────┐ │
│  │ [Embark]  [Wisdom Panel]             │ │
│  │ Discover Luna's full breed profile    │ │
│  │ [Learn More →]                        │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌─ HEALTH & WELLNESS ──────────────────┐ │
│  │ [Fi Collar]  [Wild One]  [Supplements]│ │
│  │ Track Luna's activity and health      │ │
│  │ [Explore →]                           │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌─ PET SERVICES ───────────────────────┐ │
│  │ [Rover]  [Wag]                        │ │
│  │ Walking, boarding, daycare             │ │
│  │ [Find Near You →]                     │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  ⓘ PupPal earns a commission from some   │
│  partner purchases. We only recommend     │
│  products we trust for your dog.          │
└──────────────────────────────────────────┘
```

### Surface 3: Partner Detail Page

When a user taps a partner from any surface:

```
┌──────────────────────────────────────────┐
│  ← Back                                  │
│                                            │
│  [Partner logo]                            │
│  LEMONADE PET INSURANCE                    │
│  ★★★★★ 4.7 on App Store                   │
│                                            │
│  "The easiest pet insurance we've found.  │
│  Great for first-time puppy parents."      │
│  — Buddy 🐾                                │
│                                            │
│  ── WHY WE RECOMMEND THIS ──              │
│  ✓ 80% reimbursement on vet bills         │
│  ✓ Claims processed in seconds via app    │
│  ✓ No breed exclusions                    │
│  ✓ Wellness add-on available              │
│                                            │
│  ── FOR GOLDEN RETRIEVERS ──              │
│  Avg monthly premium: $35-55              │
│  Common covered conditions:               │
│  hip dysplasia, allergies, cancer          │
│                                            │
│  ┌────────────────────────────┐            │
│  │    Get a Free Quote →      │            │
│  └────────────────────────────┘            │
│                                            │
│  Was this helpful?  [👍]  [👎]             │
│                                            │
│  ⓘ Affiliate link — PupPal may earn       │
│  a commission.                             │
└──────────────────────────────────────────┘
```

**Key design elements**:
- PupPal's editorial voice ("Why we recommend this") — not the brand's marketing copy
- Breed-personalized information (pricing, common conditions for their breed)
- Single CTA → opens external link (Safari/Chrome in-app browser)
- Feedback mechanism (thumbs up/down)
- Clear affiliate disclosure

### Surface 4: Milestone & Achievement Tie-Ins

When users hit specific milestones, include relevant partner recommendations in the celebration:

| Milestone | Recommendation |
|-----------|---------------|
| First exercise completed | "Get the right training treats — they make all the difference" → treat recommendation |
| Week 1 completed | "Time to level up Luna's gear" → harness/leash recommendation |
| First trick mastered | "Celebrate with a new toy!" → Kong/enrichment toy |
| Plan graduated (Week 12) | "Luna is trained! Protect her future" → insurance recommendation |
| 30-day streak | "You've invested 30 days in Luna. Invest in her health too." → wellness/insurance |

**Rules**: Max 1 partner recommendation per milestone celebration. User can dismiss. Don't overshadow the milestone achievement itself.

---

## 5. Affiliate Infrastructure

### Link Management

All affiliate links route through PupPal's link server for tracking and management:

```
User taps "Shop Now"
  → https://puppal.app/go/{partner_slug}/{product_slug}?ref={user_id}
    → Server logs click event
    → 301 redirect to partner's affiliate URL with PupPal's affiliate tag
```

**Why not direct affiliate links in the app?**
- If a partner changes their affiliate program or URL structure, PupPal can update the redirect without an app update
- Centralized click tracking (don't depend on partner's reporting)
- Can A/B test partner landing pages
- Can swap partners per category without code changes

### Link Server

Simple Vercel Edge Function:

```ts
// /api/go/[partner]/[product]
export default async function handler(req, res) {
  const { partner, product } = req.query;
  const userId = req.query.ref;
  
  // Log click
  await supabase.from('affiliate_clicks').insert({
    partner_slug: partner,
    product_slug: product,
    user_id: userId,
    user_agent: req.headers['user-agent'],
    clicked_at: new Date()
  });
  
  // Look up redirect URL
  const { data } = await supabase
    .from('affiliate_partners')
    .select('affiliate_url')
    .eq('slug', partner)
    .single();
  
  // Redirect
  res.redirect(301, data.affiliate_url);
}
```

### Affiliate Platform Integration

Different partners use different affiliate platforms:

| Platform | Partners | Integration |
|----------|----------|-------------|
| Impact.com | Lemonade, many DTC brands | API for conversion tracking |
| ShareASale | Various pet brands | API for conversion tracking |
| Amazon Associates | Amazon products | Product Advertising API |
| Chewy Affiliates | Chewy | Tracking pixel + API |
| Direct | Embark, The Farmer's Dog | Custom tracking links |

### Revenue Tracking

```
AffiliateConversion {
  id: UUID
  click_id: UUID (FK to AffiliateClick)
  partner_id: UUID
  user_id: UUID
  order_value: float (nullable)    // if reported by partner
  commission: float
  commission_status: enum (pending / approved / paid / rejected)
  partner_transaction_id: string    // partner's order ID
  converted_at: timestamp
  approved_at: timestamp (nullable)
  paid_at: timestamp (nullable)
}
```

Most affiliate platforms have a 30-60 day approval window before commissions are confirmed. Track separately.

---

## 6. Personalization Engine

### How Recommendations Are Personalized

Recommendations are selected based on the user's dog profile and context:

```ts
const getRecommendation = (context: RecommendationContext): PartnerRecommendation => {
  const { breed, age_weeks, challenges, plan_week, exercise_category, surface } = context;
  
  // 1. Filter by relevance to current context
  let candidates = allRecommendations.filter(r => 
    r.contexts.includes(surface) &&
    r.relevant_categories.includes(exercise_category)
  );
  
  // 2. Filter by breed compatibility
  candidates = candidates.filter(r => 
    !r.excluded_breeds.includes(breed) &&
    (r.recommended_breeds.length === 0 || r.recommended_breeds.includes(breed))
  );
  
  // 3. Filter by age appropriateness
  candidates = candidates.filter(r =>
    age_weeks >= r.min_age_weeks && age_weeks <= (r.max_age_weeks || 999)
  );
  
  // 4. Filter out already dismissed/purchased
  candidates = candidates.filter(r =>
    !user.dismissedRecommendations.includes(r.id) &&
    !user.purchasedPartners.includes(r.partner_id)
  );
  
  // 5. Score and rank
  candidates = candidates.map(r => ({
    ...r,
    score: calculateRelevanceScore(r, context)
  })).sort((a, b) => b.score - a.score);
  
  // 6. Return top recommendation
  return candidates[0] || null;
};
```

### Breed-Specific Messaging

Each recommendation has breed-specific copy variants:

```
PartnerRecommendation {
  ...
  breed_copy: {
    "golden_retriever": "Most Golden Retriever owners love these — Goldens are highly food-motivated, making these perfect for training.",
    "french_bulldog": "Great for Frenchies — small enough to eat quickly between reps.",
    "german_shepherd": "German Shepherds need high-value rewards. These are the go-to for GSD trainers.",
    "_default": "A training favorite — soft, small, and irresistible to most puppies."
  }
}
```

---

## 7. Content Management

### Partner Database

Managed via Admin Dashboard (PRD-20):

```
AffiliatePartner {
  id: UUID
  name: string                     // "Lemonade Pet Insurance"
  slug: string                     // "lemonade"
  category: enum (insurance / nutrition / training_supplies / dna_testing / health_wellness / services)
  logo_url: string
  website_url: string
  affiliate_url: string            // base URL with PupPal's affiliate tag
  affiliate_platform: string       // "impact", "shareasale", "amazon", "direct"
  affiliate_id: string             // PupPal's ID on the affiliate platform
  commission_type: enum (flat / percentage)
  commission_value: float          // $25 or 0.05 (5%)
  editorial_summary: text          // PupPal's voice describing the partner
  why_we_recommend: array of string  // bullet points
  breed_copy: JSON                 // breed-specific recommendation copy
  relevant_contexts: array of string  // where this can be shown
  relevant_categories: array of string  // exercise categories
  recommended_breeds: array of string  // empty = all breeds
  excluded_breeds: array of string
  min_age_weeks: integer (nullable)
  max_age_weeks: integer (nullable)
  display_priority: integer        // manual ranking within category
  status: enum (active / paused / removed)
  feedback_score: float (nullable) // avg thumbs up/down
  total_clicks: integer
  total_conversions: integer
  total_revenue: float
  added_at: timestamp
  updated_at: timestamp
}
```

### Product Recommendations

Individual products within a partner (e.g., specific treats on Chewy):

```
AffiliateProduct {
  id: UUID
  partner_id: UUID (FK)
  name: string                     // "Zuke's Mini Naturals — Chicken"
  slug: string
  product_url: string              // direct link (appended to partner affiliate URL)
  image_url: string
  price: float (nullable)          // display price (may vary)
  price_display: string            // "$9.99" or "From $12/mo"
  category: string                 // sub-category
  buddy_pick: boolean              // featured recommendation
  buddy_note: string               // "Perfect size for training sessions"
  breed_copy: JSON
  exercise_ids: array of UUID      // exercises where this product is relevant
  status: enum (active / out_of_stock / removed)
  created_at: timestamp
  updated_at: timestamp
}
```

---

## 8. Frequency & Display Rules

### Exposure Limits

- **Max 1 partner recommendation per screen** (exercise, health entry, chat message)
- **Max 3 partner impressions per app session** (across all surfaces)
- **Max 1 insurance recommendation per week** (high-value but can feel pushy)
- **Max 1 recommendation per chat conversation** (Buddy should not feel salesy)
- **Trusted Partners Hub**: unlimited browsing (user-initiated)

### Dismissal Behavior

- User taps X on a recommendation → don't show that specific recommendation for 30 days
- User taps X three times on the same category → stop showing that category for 90 days
- User taps "Not interested in partner recommendations" (in Settings) → stop all contextual recommendations. Hub still accessible.

### Free vs Premium

| Surface | Free Users | Premium Users |
|---------|-----------|---------------|
| Exercise supply recommendations | ✅ | ✅ |
| Health tracker recommendations | ✅ | ✅ |
| Buddy chat recommendations | ✅ (when asked) | ✅ (when asked) |
| Trusted Partners Hub | ✅ | ✅ |
| Milestone tie-ins | ❌ (not enough milestones on free) | ✅ |

Partner recommendations are NOT a premium feature — they're available to all users. This maximizes affiliate revenue reach and provides value to free users.

---

## 9. Affiliate Disclosure & Compliance

### FTC Requirements (US)

The FTC requires clear and conspicuous disclosure of affiliate relationships. PupPal's approach:

**On every recommendation**:
- Small ⓘ icon next to affiliate links
- Tapping ⓘ shows: "PupPal may earn a commission when you shop through our links. We only recommend products we've vetted and trust for your dog."

**In Trusted Partners Hub**:
- Footer disclosure: "PupPal earns a commission from some partner purchases. All recommendations are editorially selected — partners cannot pay for placement."

**In Terms of Service**:
- Full affiliate disclosure section

**In Buddy Chat**:
- If Buddy recommends a product with an affiliate link, no inline disclosure needed (FTC guidance allows disclosure at the link destination). But the ⓘ icon is present on the product button.

### EU/GDPR Considerations

- Affiliate click tracking requires consent under GDPR
- Include affiliate tracking in the general analytics consent (PRD-17)
- If user declines tracking: affiliate links still work, but PupPal can't track the click (lost attribution, not lost functionality)

---

## 10. Data Model

### Click & Conversion Tracking

```
AffiliateClick {
  id: UUID
  user_id: UUID
  partner_id: UUID
  product_id: UUID (nullable)
  surface: enum (exercise / health / chat / hub / milestone / breed_encyclopedia)
  context: JSON                    // exercise_id, health_event, etc.
  clicked_at: timestamp
}

AffiliateConversion {
  id: UUID
  click_id: UUID (FK, nullable)    // may not always be trackable
  partner_id: UUID
  user_id: UUID (nullable)
  order_value: float (nullable)
  commission: float
  commission_status: enum (pending / approved / paid / rejected)
  partner_transaction_id: string
  converted_at: timestamp
  approved_at: timestamp (nullable)
  paid_at: timestamp (nullable)
}

AffiliateImpression {
  id: UUID
  user_id: UUID
  partner_id: UUID
  product_id: UUID (nullable)
  surface: string
  context: JSON
  action: enum (viewed / clicked / dismissed)
  created_at: timestamp
}

AffiliateUserPreference {
  user_id: UUID (FK)
  recommendations_enabled: boolean (default true)
  dismissed_partners: array of UUID
  dismissed_categories: array of string
  dismissed_until: JSON            // { partner_id: date, category: date }
  updated_at: timestamp
}
```

---

## 11. Integration Points

### With Training Plan (PRD #03)
- Exercise supply lists → contextual product recommendations
- Exercise completion → milestone-based recommendations
- Breed profile data → breed-specific product copy

### With AI Chat (PRD #02)
- Buddy can recommend products when users ask about supplies, food, insurance
- Context injection includes: which partners are active, user's purchase history, dismissed recommendations
- Buddy never proactively pushes products (only when asked or highly relevant)

### With Health Tracker (PRD #05)
- Vaccination events → insurance recommendations
- Weight tracking → nutrition recommendations
- Vet visit logged → insurance/wellness recommendations

### With Gamification (PRD #04)
- Milestone achievements → celebration + relevant product recommendation
- Streak milestones → gear/wellness recommendations

### With Breed Encyclopedia (PRD #12)
- Breed health predispositions → insurance recommendations
- Breed care needs → supply recommendations
- Breed nutrition → food recommendations

### With Onboarding (PRD #01)
- Post-onboarding (once plan is generated): "Does [Name] have pet insurance?" → Lemonade recommendation
- Challenge selection → relevant supply recommendations for those challenges

### With Admin Dashboard (PRD #20)
- Partner management: add/edit/remove partners and products
- Affiliate revenue tracking: clicks, conversions, revenue by partner, by surface, by user segment
- Recommendation performance: CTR, conversion rate, revenue per impression by surface and context
- Partner health: feedback scores, dismissal rates

### With Localization (PRD #17)
- Partner availability varies by country (Lemonade US-only, some partners EU-only)
- Recommendations filtered by user's region
- Editorial copy translated per supported language
- Pricing shown in local currency where available

---

## 12. Analytics Events

```
// Impressions
affiliate_recommendation_shown    { partner_id, product_id, surface, context }
affiliate_recommendation_dismissed { partner_id, product_id, surface, reason }

// Clicks
affiliate_link_clicked            { partner_id, product_id, surface, context }
affiliate_hub_opened              { }
affiliate_hub_category_viewed     { category }
affiliate_partner_detail_viewed   { partner_id }

// Feedback
affiliate_recommendation_rated    { partner_id, product_id, rating: up | down }

// Conversions (from partner API webhooks)
affiliate_conversion_reported     { partner_id, order_value, commission }
affiliate_conversion_approved     { partner_id, commission }

// Preferences
affiliate_preferences_changed     { recommendations_enabled, categories_changed }

// Revenue
affiliate_revenue_daily           { partner_id, clicks, conversions, revenue }
```

---

## 13. Edge Cases

| Scenario | Handling |
|----------|----------|
| Partner discontinues affiliate program | Set partner status to "paused." All recommendations stop showing. Replace with next-best partner in category. |
| Product goes out of stock | Product status → "out_of_stock." Stop showing. Auto-check via API weekly. |
| User taps affiliate link but partner website is down | Redirect fails gracefully. Show "This partner's site is temporarily unavailable. Try again later." Log error. |
| User completes purchase but conversion not tracked | Some attribution loss is expected (cookie blocking, incognito). Track click-to-conversion rate per partner to identify issues. |
| Partner raises prices significantly | Review and update display pricing. If value proposition changes, re-evaluate recommendation. |
| User is in a country where partner doesn't operate | Filter by user region. If no partners in their region for a category, don't show the category. |
| Same partner recommended on multiple surfaces in one session | Session cap (3 impressions total). Deduplicate: if shown on exercise screen, don't repeat in health tracker same session. |
| User provides negative feedback on a partner | Log feedback. If partner drops below 3.0 average rating, flag for review. If below 2.5, auto-pause and review. |
| COPPA compliance (if user is under 13) | Don't show affiliate recommendations to users who might be minors. Age verification not currently in app — treat all users as adults unless known otherwise. |
| Affiliate link tracking blocked by privacy settings | Links still work (redirect to partner). PupPal loses click attribution. Accept this — user privacy > tracking. |

---

## 14. Partner Vetting Process

Before any partner is added to PupPal:

1. **Product quality check**: Team tests the product/service personally (or thoroughly researches reviews)
2. **Brand alignment**: Does this partner's brand and values align with PupPal's (premium, caring, trustworthy)?
3. **Commission fairness**: Is the commission reasonable? (Not so low it's not worth it, not so high it suggests poor value for user)
4. **User reviews**: Check App Store/Trustpilot/BBB ratings — minimum 4.0 stars
5. **Refund/cancel policy**: Partner must have a fair refund policy (no trapping users)
6. **Breed safety**: Products must be safe for all breeds PupPal supports (no size-inappropriate toys, no controversial training tools)
7. **Editorial independence**: Partners CANNOT pay to change their editorial copy or display priority

### Removal Criteria

Remove a partner if:
- Average user feedback drops below 2.5/5
- Multiple user reports of bad experience
- Partner changes terms in ways that harm users
- Product quality declines
- Partner engages in deceptive practices
- Partner discontinues affiliate program without notice

---

## 15. Dependencies

| Dependency | Purpose | Fallback |
|------------|---------|----------|
| Supabase | Partner/product database, click tracking | Required |
| Vercel Edge Functions | Affiliate link redirect server | Direct affiliate links in app (lose tracking flexibility) |
| Impact.com / ShareASale | Affiliate conversion tracking | Manual reconciliation with partners |
| Amazon Product Advertising API | Amazon product data (images, prices) | Static product data (manual updates) |
| PostHog (PRD #13) | Recommendation analytics, A/B testing | Supabase queries |
| Admin Dashboard (PRD #20) | Partner management interface | Direct Supabase edits (painful) |
| Localization (PRD #17) | Multi-language recommendation copy | English-only (limits international revenue) |

---

## 16. Acceptance Criteria

- [ ] Trusted Partners Hub accessible from Profile with all 6 categories
- [ ] Partner detail page shows editorial summary, breed-specific info, single CTA
- [ ] Contextual recommendations appear in exercise detail when supplies are listed
- [ ] Contextual recommendations appear in health tracker at vaccination/vet events
- [ ] Buddy recommends products when users ask about supplies/food/insurance
- [ ] All affiliate links route through puppal.app/go/ redirect server
- [ ] Click events logged for every affiliate link tap
- [ ] Affiliate disclosure (ⓘ) present on every recommendation
- [ ] Disclosure text accessible on tap
- [ ] Recommendation frequency caps enforced (1 per screen, 3 per session, 1 insurance/week)
- [ ] Dismissal behavior works (X hides for 30 days, 3 dismissals hides category for 90 days)
- [ ] User can disable recommendations in Settings
- [ ] Recommendations personalized by breed, age, and context
- [ ] Breed-specific copy displays correctly for top 10 breeds
- [ ] Recommendations filtered by user's region
- [ ] Feedback (thumbs up/down) works and feeds partner quality score
- [ ] Partner management in Admin Dashboard works (add, edit, pause, remove)
- [ ] Affiliate revenue tracking in Admin Dashboard shows clicks, conversions, revenue
- [ ] All analytics events fire correctly
- [ ] FTC affiliate disclosure compliance verified
