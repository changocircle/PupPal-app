# PRD #11: Multi-Dog Management

## PupPal — Every Pup Gets Their Own Plan

**Document version**: 1.0
**Priority**: P2 — Premium-only. ~20-30% of dog owners have 2+ dogs. Multi-dog doubles switching cost and is a high-intent conversion trigger.

---

## 1. Overview

Multi-dog lets premium users create independent profiles and training plans for multiple dogs. Each dog has fully isolated: onboarding profile, training plan, trick progress, gamification (XP, streak, GBS, achievements), health records, growth journal, and Buddy context.

### Success Metrics

| Metric | Target |
|--------|--------|
| Multi-dog adoption (premium) | 15-25% add second dog |
| Multi-dog retention vs single | 1.5x at month 3 |
| Conversion from multi-dog gate | 5-10% of conversions |

---

## 2. Architecture: Per-Dog Isolation

```
User (1)
  ├── Dog A (fully independent)
  │   ├── Training Plan, Gamification, Chat, Health, Journal, Tricks
  └── Dog B (fully independent)
      ├── Training Plan, Gamification, Chat, Health, Journal, Tricks
```

**Shared across dogs**: User account, subscription, notification preferences, referral code, vet contacts.

**Independent per dog**: Everything else. `dog_id` is FK on virtually every table.

---

## 3. Dog Switcher

Home screen header shows active dog photo + name + dropdown arrow. Tap opens bottom sheet listing all dogs with photo, breed, current week, score. Checkmark on active dog. "+ Add Another Dog" button at bottom.

Switching: bottom sheet closes, brief transition, ALL data refreshes, Buddy context switches, active dog stored in Zustand + AsyncStorage.

---

## 4. Adding a New Dog (Mini-Onboarding)

Shortened 5-screen flow (no auth, no paywall — already premium):
1. Name
2. Photo + breed detection
3. Age (birthday/gotcha date)
4. Challenges (multi-select)
5. Plan generation loading → ready

~60 seconds vs 8 screens for first dog.

### Data Model

```
Dog {
  id: UUID
  user_id: UUID
  name: string
  photo_url: string (nullable)
  breed: string
  breed_confirmed: boolean
  birthdate: date (nullable)
  gotcha_date: date (nullable)
  age_at_onboarding_weeks: integer
  sex: enum (male/female/unknown)
  weight_current: float (nullable)
  challenges: array of string
  is_active: boolean
  onboarding_completed: boolean
  created_at: timestamp
  updated_at: timestamp
  archived_at: timestamp (nullable)
}
```

---

## 5. Per-Dog Feature Behavior

**Training Plan**: Independent plans. Different breeds/ages = different plans. One dog Week 8, another Week 2.

**Gamification**: Independent XP, streak, GBS, achievements. Training Luna doesn't count for Max's streak.

**AI Chat**: Buddy context adapts to active dog. Chat history per-dog. Buddy CAN discuss non-active dogs if asked by name: "How's Max doing?" → "Max is on Week 2! Want to switch?"

**Health**: Independent records. Vet contacts shared.

**Growth Journal**: Independent timelines, photos, recaps per dog.

**Tricks**: Progress per dog. Pack unlocks per dog.

---

## 6. Notifications

Always specify which dog: "Luna's training is ready" / "Max's vaccination is due." If both due: separate notifications (default) or combined ("Luna and Max both have training today"). Streaks independent — miss one dog, that dog's streak at risk.

---

## 7. Free vs Premium

Free: 1 dog. Premium: unlimited dogs. Gate on "+ Add Another Dog": `feature_gate_multi_dog`.

**Downgrade handling**: All dogs and data retained. Only primary (most recently active) dog accessible. Others show "Upgrade to access {name}."

---

## 8. Dog Management

**Edit**: Name, photo, birthdate, breed, sex. Breed change warns about plan regeneration.

**Archive**: Soft delete. Hidden from switcher, data preserved, journal accessible under "Archived Dogs." Sensitive handling for passed dogs: "We understand. {name}'s memories are preserved."

**Delete**: Permanent purge of all data. Double confirmation required. Database rows + storage files deleted.

---

## 9. API Endpoints

```
GET /api/dogs                          — List all dogs
POST /api/dogs                         — Create dog
GET /api/dogs/{id}                     — Dog profile
PUT /api/dogs/{id}                     — Update profile
POST /api/dogs/{id}/set-active         — Switch active dog
POST /api/dogs/{id}/archive            — Archive
POST /api/dogs/{id}/unarchive          — Unarchive
DELETE /api/dogs/{id}                  — Permanent delete
POST /api/dogs/{id}/regenerate-plan    — Regen plan after breed change
```

---

## 10. Edge Cases

| Scenario | Handling |
|----------|----------|
| Downgrade with 2+ dogs | Keep all data. Lock non-primary dogs with upgrade gate. |
| Delete primary dog | Next dog becomes primary. No dogs = return to onboarding. |
| Buddy asked about non-active dog | Discusses them, offers to switch. |
| Add dog offline | Queue. Plan generation requires network. |
| Archive all dogs | Empty state: "Add a dog to get started." |
| Two dogs same breed/age | Fine. Plans adapt independently from progress. |

---

## 11. Acceptance Criteria

- [ ] Dog switcher in home header, switching refreshes all data
- [ ] Mini-onboarding (5 screens) creates new dog with plan
- [ ] All features per-dog isolated
- [ ] Buddy context switches, can discuss any dog by name
- [ ] Notifications specify which dog
- [ ] Streaks independent per dog
- [ ] Free users gated from second dog
- [ ] Downgrade retains data, locks non-primary
- [ ] Archive preserves data, sensitive UX
- [ ] Delete permanently purges with double confirmation
- [ ] Active dog persists across restarts
