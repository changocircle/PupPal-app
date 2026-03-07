# PRD #22 — Multi-Dog Pricing & Pack Plans
## PupPal — Fair pricing for every pack. Seamless for every owner.

| | |
|---|---|
| **Document version** | 1.0 |
| **Status** | Draft — Ready for Engineering Review |
| **Priority** | P1 — Ships with or shortly after PRD-11 Multi-Dog |
| **Owner** | Product |
| **Date** | March 2026 |

---

## 1. Overview & Strategic Intent

PupPal is built for dog owners, not spreadsheets. But the reality is simple: a user with four dogs uses roughly four times the AI compute — four training plans, four Buddy contexts, four sets of health tracking, four streaks. If a power user with a full pack pays the same as someone with one puppy, the business model breaks as the platform scales.

This PRD solves that problem without making users feel taxed. The goal is pricing that is:

- **Genuinely fair** — more dogs = more value delivered, so a modest increment is earned
- **Framed as a deal, not a charge** — every tier makes the per-dog cost go *down*, not up
- **Presented at the right moment** — relevant, low-friction, and never a surprise
- **Invisible when it doesn't matter** — single-dog users never see or feel this complexity

> **The core principle:** Every tier costs more than Solo, but every tier costs *less per dog*. Users with multiple dogs should feel like PupPal is the most generous option they've found — not that we're nickel-and-diming their pack.

---

## 2. Pricing Architecture

### 2.1 The Four Tiers

| | 🐕 Solo | 🐕🐕 Duo | 🐾 Pack | ★ Pack+ |
|---|---|---|---|---|
| **Dogs** | 1 | 2 | Up to 4 | Unlimited |
| **Annual** | $39.99/yr | $54.99/yr | $64.99/yr | $74.99/yr |
| **Monthly** | $9.99/mo | $13.99/mo | $16.99/mo | $19.99/mo |
| **Per dog/yr** | $39.99 | **$27.50 each** | **$16.25 each** | **< $15 each** |
| **Trial** | 3-day free | 3-day free | 3-day free | 3-day free |
| **Best for** | Single dog owners | Two dogs | Multi-dog households | Breeders / Trainers |

**Pricing rationale:**

- **Solo → Duo: +$15/yr.** Incremental cost of second dog's AI compute. Framed as "your second dog for $1.25/month." No rational owner refuses this.
- **Duo → Pack: +$10/yr.** Third and fourth dogs are each cheaper than the second. Feels like a loyalty discount.
- **Pack → Pack+: +$10/yr.** Unlimited dogs — targets breeders, fosters, multi-dog trainers. Aspirational tier with trainer mode coming in v2.

> **Why not per-dog billing?** Metered billing creates anxiety. Users worry about adding a second dog "costing them." Flat tiers remove that friction entirely. The user knows exactly what they pay, forever. Predictability = trust.

---

### 2.2 Feature Comparison

| Feature | Solo | Duo | Pack | Pack+ |
|---|---|---|---|---|
| AI Training Plans (Buddy) | ✓ | ✓ per dog | ✓ per dog | ✓ per dog |
| Training plan weeks | All 12 | All 12 | All 12 | All 12 |
| AI Chat (Buddy) messages | Unlimited | Unlimited | Unlimited | Unlimited |
| Gamification per dog | ✓ | ✓ | ✓ | ✓ |
| Health & Vaccination tracker | ✓ | ✓ per dog | ✓ per dog | ✓ per dog |
| Growth Journal | ✓ | ✓ per dog | ✓ per dog | ✓ per dog |
| Tricks library | All packs | All packs | All packs | All packs |
| Multi-dog switcher | — | ✓ | ✓ | ✓ |
| Dog profiles | 1 | 2 | Up to 4 | Unlimited |
| API credit pool | Standard | 2× Standard | 4× Standard | 8× Standard |
| Priority AI response | — | — | ✓ | ✓ |
| Pack Dashboard | — | — | ✓ | ✓ |
| Trainer mode *(future)* | — | — | — | ✓ |

> **Note:** All tiers include the full PupPal premium feature set. The only difference between tiers is how many dogs are included and the API credit pool size. We never gate training plan quality, Buddy access, or health tracking features behind tier upgrades.

---

### 2.3 API Credit Pools

The AI compute allocation scales with the tier:

- **Solo:** 1× standard daily pool (~100 Buddy messages, daily plan generation, health reminders)
- **Duo:** 2× standard pool, split across both dogs
- **Pack:** 4× standard pool, distributed across up to 4 active dogs
- **Pack+:** 8× standard pool — breeders and professionals need headroom

The pool resets daily at midnight local time. Dogs that haven't been interacted with in 7+ days do not consume from the pool.

This is **invisible to the user** — they will never see credit counts or limits in the UI. Rate limiting only triggers at extreme usage (>5× normal) and surfaces as a gentle *"Buddy needs a rest — try again in a few hours"* message, never as a hard wall.

---

## 3. User Experience & Flows

The upgrade experience should feel like a moment of discovery, not a paywall. Every flow is designed around one principle: **show the user the value before asking for the money.**

---

### 3.1 The Single-Dog User (Solo) — Zero Friction

A user with one dog should never encounter multi-dog pricing language, upgrade prompts, or tier comparisons. Their experience is identical to v1. The pricing architecture is completely hidden unless they choose to add a dog.

---

### 3.2 Adding a Second Dog — The Duo Upgrade Flow

**Entry point:** User taps `+ Add Another Dog` in the dog switcher bottom sheet (PRD-11).

**Flow — currently on Solo:**

1. Tap `+ Add Another Dog`
2. Bottom sheet slides up with a warm, full-screen "Add your second pup" card — not a paywall
3. Card shows: dog illustration, headline *"Ready to add your second dog?"*, value prop *("Two dogs, two plans, one app")*, and the price delta front and centre: *"Just $1.25/mo more — or $15/yr"*
4. Two CTAs: **"Upgrade & Add Dog"** (primary) and **"Maybe later"** (ghost text link)
5. On "Upgrade & Add Dog": Superwall presents the Duo paywall card — minimal, no redundant explanation, just the plan + confirm CTA
6. Purchase completes → mini-onboarding for second dog starts immediately (PRD-11 flow)
7. Welcome moment: *"Luna is in! Your pack is growing 🐾"*

**Flow — currently on a trial:**

Users in their 3-day trial on Solo see the same card but with copy: *"When your trial converts, we'll start you on Duo for $54.99/yr. You'll be charged the difference."* Clear, honest, no surprises.

> **UX principle: don't interrupt the intent.** The user came to add a dog. The upgrade is a 10-second detour, not a dead end. The mini-onboarding starts the moment the purchase completes — no app restart, no "go back and try again." The dog gets added.

---

### 3.3 Adding a Third or Fourth Dog — Pack Upgrade

Same pattern as the Duo flow. When a Duo user taps `+ Add Another Dog`:

- Card headline: *"Three's a pack. Upgrade to Pack."*
- Value prop: *"Up to 4 dogs. Just $10 more per year than Duo — that's your third and fourth dog for a fiver each."*
- Annual plan featured prominently. Monthly also shown, no pressure.
- On upgrade: 3rd dog mini-onboarding starts immediately.

---

### 3.4 The Pack Dashboard (Pack & Pack+ only)

The Pack Dashboard is the centrepiece of the multi-dog experience — it's what makes "Pack" feel premium and earned, not just an arbitrary tier name.

Accessible from home screen via a **"Pack Overview"** card (sits above Today's Training when 2+ dogs exist):

- **All-dogs-at-a-glance:** photo, name, current week, streak, GBS score in a horizontal scrollable row
- **"Who needs attention today?"** — surfaces any dog whose streak is at risk or has a health reminder due
- **Pack GBS:** a composite score across all dogs, with the lowest-scoring dog called out (*"Your pack is at 74. Max is dragging you down 😅"*)
- **Monthly Pack Recap:** auto-generated card summarising all dogs' progress — shareable

For **Duo users** (2 dogs), the Pack Dashboard is accessible but shows a soft lock on Pack GBS and Pack Recap with a one-tap upgrade prompt. Creates aspiration without frustration.

---

### 3.5 Buddy's Role in Upgrade Discovery

Buddy naturally encounters multi-dog conversations. These are warm, organic upsell moments — not scripted sales pitches.

**Buddy upgrade trigger examples:**

- User mentions *"my other dog"* in chat → Buddy responds helpfully AND adds: *"It sounds like you've got a full house! Want to add them to PupPal? I can set up a separate plan for them."*
- User asks about training two dogs simultaneously → Buddy explains the approach AND: *"By the way, both dogs can have their own profiles here — want me to help you set that up?"*
- User asks *"can I track Max and Luna?"* → Buddy: *"Absolutely! With Duo, both Max and Luna get their own everything. Tap here to add Luna."*

These moments are always conversational, never interruptive. Buddy never says "upgrade now" — Buddy says *"I can help with that."*

---

### 3.6 Upgrade Triggers Map

| Trigger | Surface | Copy | Target tier |
|---|---|---|---|
| User adds 2nd dog | Dog switcher bottom sheet | *"Add Luna for just $15/yr more"* | Duo |
| User adds 3rd dog | After 2nd dog onboards | *"Got 3 dogs? Pack plan covers them all"* | Pack |
| User completes Week 4 (2nd dog) | Post-session card | *"Both dogs are crushing it. Save with Pack."* | Pack |
| Settings → Subscription | Any time | *"Manage your pack plan"* | Any |
| Settings → Add dog (already on 2) | Account settings | *"Upgrade to Pack — 4 dogs, one price"* | Pack |
| Buddy chat mentions a second dog | Chat surface | *"Sounds like you have a full house! Want to add them?"* | Duo |
| Push notification (day 14 active) | Push | *"Did you know your second pup could join for $1.25/mo extra?"* | Duo |

---

## 4. Paywall Design — Pack Plans

Pack paywalls follow PupPal's existing paywall design language (PRD-06) but with a distinct tone: they **celebrate the user's expanding pack** rather than gatekeeping features.

---

### 4.1 Add-Dog Upgrade Card (pre-paywall)

This is not a paywall — it's a value proposition screen that precedes the formal purchase flow. Shown inline when user taps `+ Add Another Dog`.

**Layout:**
- Full bottom sheet (85% screen height). No close X for first 1.5 seconds.
- Top: warm illustration of two dogs (or three, for Pack). No stock photos.
- Headline (large): *"Add [Dog Name]'s new best friend?"* OR *"Your pack is growing 🐾"*
- Subheadline: current plan → new plan with clear price delta. *"You're on Solo ($39.99/yr). Add Dog 2 for just $15 more per year."*
- Per-dog cost breakdown: *"= $27.50 per dog per year. That's less than a bag of treats."*
- Single CTA: **"Add Dog & Upgrade"** → IAP purchase confirmation
- Ghost link: **"Not now"** (closes sheet, no guilt messaging)

---

### 4.2 Formal Plan Selection (Superwall)

After the add-dog card, Superwall shows only the relevant upgrade (e.g. Solo → Duo user sees only the Duo card). This removes decision paralysis.

**Exception:** If user arrives from Settings → Manage Subscription, show all four tiers in a single comparison screen so they can fully evaluate.

---

### 4.3 Copy Principles

- Always lead with the **per-dog cost**, not the total price. *"$1.25/mo per dog"* lands better than *"$54.99/yr"*
- Use the **dog's actual name** wherever possible: *"Add Luna for $1.25/mo more"*
- Never say "upgrade" in a way that implies the current plan is insufficient. **"Add to your plan"** > *"upgrade your plan"*
- Always include reassurance: *"All dogs' data is always yours. Downgrade anytime."*

---

## 5. Technical Implementation

### 5.1 RevenueCat Product Configuration

| Product ID | Tier | Annual | Monthly | Notes |
|---|---|---|---|---|
| `puppal_solo_annual` / `monthly` | Solo | $39.99/yr | $9.99/mo | Existing products. No change. |
| `puppal_duo_annual` / `monthly` | Duo | $54.99/yr | $13.99/mo | New. 2-dog cap. |
| `puppal_pack_annual` / `monthly` | Pack | $64.99/yr | $16.99/mo | New. 4-dog cap. |
| `puppal_packplus_annual` / `monthly` | Pack+ | $74.99/yr | $19.99/mo | New. Unlimited dogs. |
| `puppal_lifetime` | Solo Lifetime | $79.99 | — | Existing. Upgrade path deferred to v2. |

**Entitlement structure:**
- `premium` — granted by ALL product IDs (existing, no change)
- `duo` — granted by `puppal_duo_*`
- `pack` — granted by `puppal_pack_*`
- `pack_plus` — granted by `puppal_packplus_*`

**Extended `useTier()` hook:**

```ts
const useTier = () => {
  // Returns: 'none' | 'solo' | 'duo' | 'pack' | 'pack_plus'
  const { data: customerInfo } = useQuery(...);
  if (!customerInfo?.entitlements?.active?.['premium']) return 'none';
  if (customerInfo?.entitlements?.active?.['pack_plus']) return 'pack_plus';
  if (customerInfo?.entitlements?.active?.['pack']) return 'pack';
  if (customerInfo?.entitlements?.active?.['duo']) return 'duo';
  return 'solo';
};
```

---

### 5.2 Dog Limit Enforcement

Dog limits are enforced at the **API layer**, not just the client. The `POST /api/dogs` endpoint:

1. Fetches user's current tier from RevenueCat (cached, <5min stale)
2. Counts existing non-archived dogs for this user
3. If `count >= tier_limit` → returns `402` with `{ error: 'dog_limit_reached', current_tier: 'solo', upgrade_tier: 'duo' }`
4. Client receives `402` → triggers add-dog upgrade card flow

**Tier limits:** `solo = 1`, `duo = 2`, `pack = 4`, `pack_plus = 9999`

---

### 5.3 API Credit Pool Management

Credit pools managed by the Edge Function layer. Each dog has a `daily_credits_used` counter, reset by midnight cron.

```
solo:      1 × BASE_DAILY_CREDITS
duo:       2 × BASE_DAILY_CREDITS  (shared across dogs)
pack:      4 × BASE_DAILY_CREDITS
pack_plus: 8 × BASE_DAILY_CREDITS
```

`BASE_DAILY_CREDITS` covers ~100 Buddy messages + 2 plan generation calls per dog per day — well above P99 usage for a normal owner.

---

### 5.4 Superwall Configuration

**New placements to configure:**

| Placement ID | Shown when |
|---|---|
| `add_dog_solo_to_duo` | Solo user tries to add dog 2 |
| `add_dog_duo_to_pack` | Duo user tries to add dog 3 |
| `add_dog_pack_to_packplus` | Pack user tries to add dog 5+ |
| `settings_pack_comparison` | Settings → full tier comparison |

**User attributes passed for personalisation:**

```ts
Superwall.setUserAttributes({
  dog_count: dogs.length,
  current_tier: tier,            // 'solo' | 'duo' | 'pack'
  next_tier: getNextTier(tier),
  dog_names: dogs.map(d => d.name).join(', '),
  price_delta_annual: getPriceDelta(tier, 'annual'),
  price_delta_monthly: getPriceDelta(tier, 'monthly'),
});
```

---

### 5.5 Data Model Changes

```sql
-- Add to users table:
subscription_tier  enum ('none','solo','duo','pack','pack_plus')  DEFAULT 'none'
dog_limit          integer  DEFAULT 1  -- denormalised for fast API checks

-- New table:
DogCreditUsage {
  id              UUID
  user_id         UUID
  dog_id          UUID
  date            date
  credits_used    integer  DEFAULT 0
  created_at      timestamp
  UNIQUE(user_id, dog_id, date)
}
```

---

## 6. Messaging, Framing & Brand Voice

How we talk about multi-dog pricing is as important as the pricing itself. These principles guard against the "nickel-and-diming" perception.

### 6.1 Language to use ✓

| Say this | Because |
|---|---|
| *"Your pack"* | Positions multiple dogs as aspirational, not costly |
| *"$1.25/mo more"* | Relative to what they already pay, not the absolute price |
| *"Per dog it works out to..."* | Frames the deal, not the cost |
| *"Add [name] to your plan"* | Their dog, their choice, their plan |
| *"Room for two"* | Warm, not clinical |

### 6.2 Language to avoid ✗

| Don't say | Why not |
|---|---|
| *"Upgrade required"* | Sounds like a wall |
| *"Your current plan doesn't support..."* | Makes them feel restricted |
| *"Pay for additional dogs"* | Transactional, cold |
| *"You've reached your dog limit"* | Jarring error tone |

### 6.3 Emotional tone by moment

| Moment | Tone |
|---|---|
| Add-dog prompt | Warm excitement. This is a celebration, not an invoice. |
| Paywall confirmation | Clear and confident. No apology. *"Here's what you get."* |
| Post-upgrade | Celebratory. *"Your pack is complete. Let's get [name] started."* |
| Downgrade state | Gentle and reassuring. *"All your dogs are safe here. Come back any time."* |

---

## 7. A/B Testing Plan

| Test | Variants | Primary metric |
|---|---|---|
| Duo price sensitivity | $49.99 vs $54.99 vs $59.99 annual | Revenue per paywall view |
| Upsell copy at add-dog | *"Add for $15/yr"* vs *"Add for $1.25/mo"* vs *"Upgrade your pack"* | Upgrade tap rate |
| Upsell timing | Before mini-onboarding vs after vs at plan-gen | Conversion rate + add-dog completion rate |
| Pack Dashboard early access | Show teaser locked vs hide entirely | Pack conversion from existing multi-dog Solo users |
| Annual vs monthly lead | Annual card first vs Monthly card first at pack paywall | Annual selection rate |

All A/B tests run through Superwall. Minimum 200 exposures per variant before reading results. Primary decision metric is **revenue per paywall view**, not raw conversion rate.

---

## 8. Analytics & Success Metrics

### 8.1 Key Events

| Event | Properties | Notes |
|---|---|---|
| `pack_plan_paywall_shown` | `trigger, current_tier, dog_count` | When a pricing upgrade paywall appears |
| `pack_plan_tier_selected` | `tier, annual_vs_monthly, source` | User taps a tier card |
| `pack_plan_upgraded` | `from_tier, to_tier, price, dog_count` | Successful purchase |
| `pack_plan_dismissed` | `trigger, tier_shown, time_on_screen` | User closes without purchasing |
| `add_dog_upsell_shown` | `dog_count, current_tier` | Upsell shown when adding a dog |
| `add_dog_upsell_tapped` | `dog_count, current_tier` | User taps upgrade from add-dog flow |
| `add_dog_upsell_dismissed` | `dog_count, current_tier` | User skips and stays on current plan |
| `pack_dashboard_viewed` | `dog_count, active_dogs` | Pack Dashboard screen opened |

### 8.2 Success Metrics

| Metric | Baseline | Target | Source |
|---|---|---|---|
| Duo/Pack/Pack+ adoption (of multi-dog users) | — | 60%+ | RevenueCat |
| Upgrade rate at add-dog flow | — | 25–35% | PostHog |
| ARPU lift vs Solo plan users | $39.99/yr | $52+ avg | RevenueCat |
| Multi-dog retention vs single-dog at month 3 | 1.5× target | 1.8× | PostHog |
| Churn rate — Pack/Pack+ users | <5% (Solo) | <3% | RevenueCat |
| Pack Dashboard weekly engagement | — | 40%+ of Pack users | PostHog |
| NPS — multi-dog pricing question | — | >40 on pricing fairness | Surveys |

### 8.3 Dashboard

A dedicated **"Pack Monetisation"** PostHog dashboard tracking:

- Funnel: `add_dog_tapped` → `upsell_shown` → `tier_selected` → `upgraded`
- Tier distribution over time (% Solo / Duo / Pack / Pack+ of active subscribers)
- ARPU by cohort (Solo onboard vs Pack onboard)
- Churn rate by tier
- Pack Dashboard engagement (proxy for Pack tier stickiness)

---

## 9. Edge Cases & Failure States

| Scenario | Handling |
|---|---|
| User on Solo adds a 2nd dog | Gate with seamless Duo upgrade prompt mid-flow. Mini-onboarding pauses, upgrade presented inline, then continues instantly on success. |
| User on Duo adds a 3rd dog | Show Pack upgrade at the point of the 3rd dog add. Same inline pattern. |
| User downgrades from Duo → Solo | All dog data retained. Non-primary dogs locked but visible. Banner: *"Luna's profile is saved. Upgrade anytime to access."* |
| User on Pack cancels | All dog profiles preserved. Only first/primary dog accessible. Win-back sequence references all dog names. |
| User has 4 dogs, upgrades from Solo mid-cycle | Pro-rate remaining period. They see exactly what they owe. No hidden fees. |
| User transfers to new device | RevenueCat syncs tier. All dogs restored via Supabase. No data loss. |
| Family sharing (Apple) | Tier shared with family. All family members use one pack plan. |
| Failed payment on Pack plan | Grace period maintained. Subtle banner: *"Payment needs attention — your pack's training is safe for now."* |
| User has 1 dog on Duo | Valid state — they paid for future-proofing. No forced downgrade. Message: *"Room for one more pup any time."* |

---

## 10. Rollout Plan

Multi-dog pricing ships with or immediately after PRD-11. There is no version of the multi-dog feature that ships without the pricing model — they are co-dependent.

### Phase 1 — Foundation (with PRD-11)
- [ ] RevenueCat: configure Duo, Pack, Pack+ products in App Store Connect and Google Play
- [ ] Entitlements: `duo`, `pack`, `pack_plus` created in RevenueCat dashboard
- [ ] `useTier()` hook + dog limit enforcement at API layer
- [ ] Add-dog upgrade card UI (Duo and Pack variants)
- [ ] Superwall: `add_dog_solo_to_duo` and `add_dog_duo_to_pack` placements
- [ ] Basic analytics: all 8 events wired up

### Phase 2 — Pack Dashboard (v1.1)
- [ ] Pack Dashboard screen: all-dogs overview, who needs attention, Pack GBS
- [ ] Pack Dashboard teaser/lock for Duo users
- [ ] Monthly Pack Recap card (auto-generated, shareable)
- [ ] Buddy integration: natural multi-dog upsell moments in chat

### Phase 3 — Optimisation
- [ ] A/B tests running: price points, copy, timing
- [ ] Win-back flows extended for multi-dog lapsed users
- [ ] Pack+ positioning for breeder/trainer market
- [ ] Lifetime plan upgrade path scoped (deferred)

---

## 11. Acceptance Criteria

- [ ] Solo user with 1 dog sees zero change in experience — no tier language, no pack UI
- [ ] Tapping `+ Add Another Dog` on Solo plan shows add-dog upgrade card, not a raw paywall
- [ ] Add-dog card prominently shows per-dog cost delta (*"$1.25/mo more"*)
- [ ] Purchase completes → mini-onboarding starts immediately, no manual re-navigation
- [ ] API returns `402` with correct payload if dog count exceeds tier limit
- [ ] `useTier()` returns correct tier for all four product IDs
- [ ] Duo tier enforces 2-dog cap; Pack enforces 4-dog cap; Pack+ has no practical cap
- [ ] Downgrade: all dogs' data preserved, non-primary dogs locked with correct upgrade prompt
- [ ] Pack Dashboard visible to Pack and Pack+ users; teaser shown to Duo users
- [ ] All 8 analytics events fire and appear in PostHog
- [ ] Superwall placements load in <500ms and show correct personalised dog names
- [ ] Win-back copy for cancelled Pack users references all dogs by name
- [ ] No user-visible "credit" or "limit" language anywhere in the UI
- [ ] All A/B test variants render correctly in Superwall

---

*PupPal — Every pup gets their own plan. 🐾*
