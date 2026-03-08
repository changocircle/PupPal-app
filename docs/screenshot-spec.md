# PupPal - App Store Screenshot Spec

Screenshots are required for 3 iPhone sizes. iPad is optional but recommended for visibility in search.

All screenshots use portrait orientation. Capture with a clean status bar (iOS Simulator: time 9:41, full battery, no notifications).

---

## Required Sizes

| Device | Resolution | Required |
|--------|-----------|---------|
| 6.7" iPhone 15 Pro Max | 1290 x 2796 px | Required |
| 6.5" iPhone 14 Plus / 11 Pro Max | 1284 x 2778 px | Required |
| 5.5" iPhone 8 Plus | 1242 x 2208 px | Required |
| iPad Pro 12.9" (6th gen) | 2048 x 2732 px | Recommended |

> **Capture tip:** Start with 6.7" (iPhone 15 Pro Max simulator). App Store Connect allows reusing 6.7" for 6.5" if needed, but capturing both sizes is best practice.

---

## Screenshot 1 — Welcome / Hero

**Caption:** "Meet Buddy, your AI puppy trainer"

**Screen:** Onboarding welcome screen (screen 1 of 8). Buddy illustration centered, tagline and "Get Started" CTA visible.

**State:**
- Fresh app launch, no account
- Buddy float animation mid-cycle (great for static)
- Clean status bar

**Notes:** First impression. Coral/cream palette and Buddy illustration should pop. Consider a branded wordmark overlay.

---

## Screenshot 2 — Breed Detection

**Caption:** "AI identifies your breed in seconds"

**Screen:** Breed detection result screen after photo analysis.

**State:**
- Use a Golden Retriever or Labrador photo (highly recognizable)
- Result showing: "Golden Retriever - 94% confidence"
- Breed card expanded with traits summary

**Notes:** This is the wow-factor screenshot. Lead with the confidence score front and center.

---

## Screenshot 3 — Personalized Training Plan

**Caption:** "Your 12-week plan, built for your pup"

**Screen:** Training plan overview (week grid). Weeks 1-2 active, weeks 3-12 locked (premium prompt).

**State:**
- Dog: "Mochi", 10 weeks old, Golden Retriever
- Week 1 complete (checkmark), Week 2 in progress
- 2-3 exercise cards visible for current week

**Notes:** Should feel comprehensive but approachable. Highlight today's exercises.

---

## Screenshot 4 — Daily Training (Today Tab)

**Caption:** "Train in 10 minutes a day"

**Screen:** Home / Today tab with GBS gauge and today's session.

**State:**
- GBS score: 78
- Today's exercises: 3 visible, first completed (green checkmark)
- Streak: Day 5 visible
- Buddy's daily message at top

**Notes:** The GBS gauge is a key differentiator. Make sure it's clearly visible. Mood: "momentum is building."

---

## Screenshot 5 — Buddy Chat

**Caption:** "Ask Buddy anything, any time"

**Screen:** Buddy chat with a real conversation in progress.

**State:**
- User message: "My puppy keeps jumping up on guests, what should I do?"
- Buddy response: 4-5 lines of warm, expert advice (stage manually)
- Buddy avatar visible (happy/waving expression)
- Message count: "Unlimited" (premium state)
- Keyboard NOT visible (full conversation shows)

**Sample Buddy response to stage:**
> "Jumping up is super common at this age and it means your pup is excited to see people (great sign!). The key is making the behavior unrewarding: turn away and ignore completely when they jump, then ask for a 'sit' and reward the moment four paws hit the floor. Consistency is everything here. ..."

**Notes:** This sells the AI-mentor value prop. Buddy must look warm and expert.

---

## Screenshot 6 — Health Dashboard

**Caption:** "Every vet visit, vaccine, and weight in one place"

**Screen:** Health tab vaccination list view.

**State:**
- Dog: 12 weeks old
- DA2PP #1: Complete (green)
- DA2PP #2: Due in 3 days (amber)
- Rabies: Upcoming at 16 weeks (blue)
- 1 recent health note visible

**Notes:** Vaccination status badges should be clearly color-coded and readable.

---

## Screenshot 7 — Trick Library

**Caption:** "Master 50+ tricks at your own pace"

**Screen:** Tricks tab main view with 6 pack grid.

**State:**
- Pack 1 (Essentials): 3/6 tricks mastered, progress shown
- Pack 2: Unlocked, 0 started
- Packs 3-6: Locked (premium)
- "Shake" trick highlighted as free/mastered

**Notes:** Grid should feel like an achievement board, visually satisfying.

---

## Screenshot 8 — Achievements

**Caption:** "Every milestone deserves a celebration"

**Screen:** Achievements tab / gamification grid.

**State:**
- 8-10 achievements earned (gold/filled): First Session, 3-Day Streak, First Trick Mastered, Breed Detected, Health Profile Complete
- 4-6 locked achievements (greyed out)
- XP total: "1,240 XP"
- Level: "Level 4"

**Notes:** Earned achievements should feel celebratory. Gold icons, not grey. Visual variety matters.

---

## Screenshot 9 — Onboarding Quiz (Challenges)

**Caption:** "Tell us what you're working on"

**Screen:** Onboarding challenges selection screen (step 5 of 8).

**State:**
- 3 challenges selected: "Biting and nipping", "Jumping up", "Leash pulling"
- Progress indicator: step 5 of 8
- "Continue" button active at bottom

**Notes:** Shows the personalization story. Selected items need clear visual contrast against unselected.

---

## Screenshot 10 — Premium Paywall

**Caption:** "Unlock everything, free for 7 days"

**Screen:** Paywall / subscription screen.

**State:**
- Annual plan: prominent, highlighted, "$39.99/year", "Most Popular" badge
- Monthly plan: secondary, "$9.99/month"
- Annual savings callout: "Save 67% vs monthly"
- "Start Free Trial" CTA: full-width, coral button
- "No charge today. Cancel anytime." fine print visible

**Notes:** Annual plan must be visually dominant. Feature list above CTA: Unlimited Buddy chat, Full 12-week plan, All trick packs, Health tracking.

---

## Recommended Screenshot Order

1. Welcome / Buddy intro (hero, first impression)
2. Breed Detection (wow factor)
3. Personalized Plan (value delivery)
4. Daily Training (daily habit loop)
5. Buddy Chat (AI differentiator)
6. Health Dashboard (utility)
7. Trick Library (breadth of content)
8. Achievements (engagement / gamification)
9. Onboarding Quiz (personalization story)
10. Premium Paywall (conversion)

---

## Capture Instructions

### iOS Simulator Setup
```bash
# Start app in simulator
npx expo start --ios

# Set clean status bar time to 9:41
# Simulator > Device > Override Status Bar

# Take screenshot
# Simulator menu: File > Save Screen (Cmd+S) saves to Desktop
```

### Status Bar Best Practice
- Time: 9:41 AM
- Battery: Full (100%)
- Signal: Full
- No notification icons

### Verify Dimensions
```bash
# Check screenshot is correct size
file screenshot.png
# or with ImageMagick:
identify screenshot.png
```

### RocketSim (Recommended)
RocketSim adds a clean status bar override and optional device frame overlay directly from the simulator. Available at rocketism.app (~$20/year). Saves significant post-processing time.

---

## Mockup Generation

After capturing raw screenshots, run the mockup script to add device frames and branded backgrounds:

```bash
# Install dependency (one-time)
npm install sharp

# Run generator
node scripts/generate-mockups.js
```

Input: `docs/screenshots/{6.7,6.5,5.5}/`
Output: `docs/mockups/{6.7,6.5,5.5}/`

See `scripts/generate-mockups.js` for full setup instructions and device frame sourcing.

---

## iPad Note

`supportsTablet: false` is set in `app.json`, so the app runs in 2x iPhone mode on iPad. iPad screenshots are optional for v1. If needed later, update `supportsTablet: true` and audit the layout.
