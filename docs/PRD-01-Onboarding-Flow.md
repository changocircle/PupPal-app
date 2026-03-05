# PRD #01: Onboarding Flow

## PupPal — Lemonade + Cal AI Hybrid Onboarding

**Document version**: 1.0
**Feature owner**: Ashley
**Status**: Draft
**Priority**: P0 — Build first. Nothing else works without this.

---

## 1. Overview & Purpose

The onboarding flow is PupPal's single most important conversion mechanism. It serves three purposes simultaneously:

1. **Collect personalization data** — breed, age, name, challenges, experience level — to generate a tailored training plan.
2. **Create emotional investment (sunk cost)** — by the time the user reaches the paywall, they've spent 2-3 minutes entering personal info about their dog and seen a custom plan built just for them.
3. **Deliver the "magic moment"** — breed detection from a photo is PupPal's equivalent of Cal AI's food scan. It proves the AI is real and valuable before asking for money.

**Design philosophy**: Lemonade's one-question-per-screen conversational UI + Cal AI's deep personalization quiz + paywall at the end. The user talks to Buddy (AI mentor character), not a form.

### Success Metrics

| Metric | Target | How Measured |
|--------|--------|-------------|
| Onboarding completion rate (start to paywall) | 65-75% | Analytics funnel |
| Trial start rate (paywall shown to trial started) | 40-60% | Superwall analytics |
| Photo upload rate | 70%+ | Screen-level analytics |
| Time to complete full flow | 90-150 seconds | Session timing |
| Drop-off per screen | No screen >20% drop-off | Per-screen funnel |
| Onboarding to Day 1 retention | 80%+ | Cohort analysis |

---

## 2. User Stories

- **US-1**: As a new user, I want to feel like I'm having a conversation with a friendly mentor, not filling out a form, so that the experience feels personal and engaging.
- **US-2**: As a new user, I want to upload a photo of my puppy and see breed detection happen instantly, so that I'm impressed by the AI and trust it can help me.
- **US-3**: As a new user, I want to see a personalized training plan for MY specific dog before being asked to pay, so that I understand exactly what I'm getting.
- **US-4**: As a new user, I want the trial terms to be clear and non-threatening (no payment now, reminder before billing), so that I feel safe starting a trial.
- **US-5**: As a returning user who abandoned onboarding, I want to resume where I left off, so I don't have to re-enter information.

**US-6**: As a user who dismisses the paywall, I want to receive a compelling exit offer, so that I have a reason to reconsider.

**US-7**: As a user in a non-English speaking country, I want pricing that reflects my local market, so the app feels accessible.

---

## 3. Detailed Screen-by-Screen Flow

### Screen 1: Welcome / Meet Buddy

**Layout**:
- Top 40%: Buddy character illustration (warm, friendly illustrated dog — think Lemonade's Maya but as a golden-toned dog character). Buddy should feel premium, not cartoonish. Subtle idle animation (ears perk, tail wag).
- Middle: Speech bubble from Buddy: "Hey! I'm Buddy, your puppy's personal mentor. I'll create a custom training plan just for your pup."
- Bottom: Single CTA button — "Let's Go!" (filled, primary color)
- Below CTA: "Already have an account? Sign in" (text link)

**Behavior**:
- Buddy's greeting animates in (typewriter effect or fade-in, 0.5s)
- No input required — single tap to proceed
- If user has previously abandoned onboarding, show "Welcome back! Let's pick up where we left off" and skip to their last incomplete screen
- No progress bar (Lemonade principle — branching logic makes progress bars misleading)

**Data collected**: None
**Analytics events**: `onboarding_started`, `screen_1_viewed`

---

### Screen 2: Puppy's Name

**Layout**:
- Top: Buddy character (smaller, persistent across all screens from here)
- Buddy speech bubble: "First things first — what's your puppy's name?"
- Center: Large text input field, auto-focused, keyboard appears immediately
- Placeholder text: "e.g., Luna, Max, Bella..."
- Bottom: "Continue" button (disabled until 1+ characters entered)

**Behavior**:
- Auto-capitalize first letter
- Min 1 character, max 30 characters
- Strip leading/trailing whitespace on submit
- On submit, Buddy reacts with personalized response: "I love that! [Name] is a great name 🐾" (0.5s animation, then auto-advance after 1s)
- Store name in local state AND persist to backend immediately (for resume capability)
- Keyboard should not obscure the input field

**Validation**:
- No special characters except hyphens and apostrophes (for names like "O'Malley" or "Bear-Bear")
- Profanity filter (basic — reject obvious slurs, don't over-filter)
- If empty and user taps continue: shake animation on input field

**Edge cases**:
- User enters emoji: Strip emoji, allow remaining text. If only emoji, show gentle prompt "Buddy needs a name he can pronounce! 😄"
- User enters very long name: Truncate display in future screens with ellipsis after 15 chars
- User goes back and changes name: Update everywhere, including any previously generated content

**Data collected**: `puppy_name` (string)
**Analytics events**: `screen_2_viewed`, `puppy_name_entered`

---

### Screen 3: Photo Upload

**Layout**:
- Buddy speech bubble: "Now let's see that adorable face! Upload a photo of [Name]."
- Center: Large photo upload area (dashed border, camera icon)
  - Two options: "Take Photo" (opens camera) / "Choose from Library" (opens photo picker)
- Below upload area: "Skip for now" (subtle text link — not prominent, but available)
- Bottom: "Continue" button (appears after photo selected or skip tapped)

**Behavior — Photo uploaded path (primary)**:
1. User selects/takes photo
2. Photo preview appears in the upload area (circular crop preview)
3. Loading state: Buddy says "Analyzing [Name]'s photo..." with a subtle scanning animation overlay on the photo (think: gentle pulse or scan line moving across)
4. Breed detection API call fires (target: <3 seconds response)
5. **THE MAGIC MOMENT**: Buddy reacts excitedly — "A [Detected Breed]! Amazing choice. I've trained hundreds of [breed]s and I know exactly what [Name] needs."
   - If mixed breed detected: "Looks like [Name] is a [Breed 1]/[Breed 2] mix! That's a wonderful combination — let me tailor your plan for both sides."
   - If breed uncertain: "What a unique pup! [Name] looks like they might be a [best guess]. Does that sound right?" with options: "Yes!" / "Actually, [Name] is a..." (opens breed selector)
6. Photo stored for profile, breed stored for plan generation
7. Auto-advance after 1.5s pause (let the moment land)

**Behavior — Skip path**:
1. User taps "Skip for now"
2. Buddy: "No worries! You can always add a photo later. What breed is [Name]?"
3. Show breed selector: searchable list of common breeds + "Mixed breed" + "I don't know"
   - If "Mixed breed": Show two breed selectors — "What breeds are in the mix?"
   - If "I don't know": "That's okay! I'll give you a general plan and we can refine it as we learn more about [Name]."
4. Continue to next screen

**Breed detection implementation notes**:
- Use a breed detection ML model (on-device if possible for speed, or fast API call)
- Return top 3 predictions with confidence scores
- If top prediction > 70% confidence: show as definitive
- If top prediction 40-70%: show as suggestion with confirmation prompt
- If top prediction < 40%: show top 2-3 as options and let user pick, or offer breed selector
- Support 200+ AKC-recognized breeds + common mixes
- Store: `detected_breed`, `confirmed_breed`, `confidence_score`, `photo_url`

**Edge cases**:
- User uploads non-dog photo: Buddy says "Hmm, I'm having trouble finding a pup in this photo. Try another one with [Name] clearly visible?" Offer retry + skip
- User uploads photo with multiple dogs: "I see a few pups! Which one is [Name]?" with tap-to-select regions, OR fall back to breed selector
- Camera permission denied: Show explanation screen — "PupPal needs camera access to identify [Name]'s breed" with link to settings
- Photo library permission denied: Same pattern
- API/model timeout (>5s): Fall back to breed selector — "I'm having trouble with the photo right now. What breed is [Name]?"
- Very dark/blurry photo: "This photo is a bit hard to see. Try one with better lighting?" Offer retry + skip

**Data collected**: `puppy_photo` (image URL), `detected_breed` (string), `confirmed_breed` (string), `breed_confidence` (float), `detection_method` (enum: photo_detected, photo_confirmed, manual_select, skipped)
**Analytics events**: `screen_3_viewed`, `photo_upload_started`, `photo_upload_completed`, `breed_detected`, `breed_confirmed`, `breed_manually_selected`, `photo_skipped`

---

### Screen 4: Puppy's Age

**Layout**:
- Buddy speech bubble: "How old is [Name]?"
- Center: Age picker — two modes:
  - Under 6 months: Week selector (8 weeks, 9 weeks... 24 weeks)
  - 6+ months: Month selector (6 months, 7 months... 24 months, 2+ years)
- Toggle or smart default: If breed is typically a puppy breed purchase (French Bulldog, Golden Retriever), default to weeks. If rescue/adult breed patterns, default to months.
- Bottom: "Continue" button

**Behavior**:
- On age selection, Buddy reacts contextually:
  - 8-10 weeks: "Perfect timing! This is the ideal age to start — [Name]'s brain is a sponge right now."
  - 11-16 weeks: "Great age! We're right in the prime socialization window for [Name]."
  - 4-6 months: "Adolescence is kicking in! Don't worry — this is totally normal and we've got a plan."
  - 6-12 months: "The teenage phase! [Name] might be testing boundaries but we'll get through it together."
  - 1-2+ years: "[Name]'s got some habits by now, but it's never too late. Old dogs CAN learn new tricks! 😄"
- Auto-advance after Buddy's reaction (1s pause)

**Edge cases**:
- User selects "I don't know" (for rescues): Buddy says "No problem! Based on [Name]'s photo, I'd estimate about [X] months. We can adjust as you learn more." Use breed detection + photo to estimate if possible, otherwise default to 4 months as a reasonable starting point.

**Data collected**: `puppy_age_weeks` (integer — all ages normalized to weeks for plan calculation), `age_input_method` (enum: weeks, months, years, estimated)
**Analytics events**: `screen_4_viewed`, `age_selected`

---

### Screen 5: Training Challenges

**Layout**:
- Buddy speech bubble: "What's been your biggest challenge with [Name]? Pick all that apply."
- Center: Grid of selectable tiles (2 columns, 4 rows), each with:
  - Icon (emoji or custom illustration)
  - Short label
  - Tiles: 
    1. 🚽 Potty training
    2. 🦷 Biting & nipping
    3. 🎾 Basic commands
    4. 🏃 Leash pulling
    5. 😰 Separation anxiety
    6. 🐕 Socializing with dogs/people
    7. 🌙 Sleeping through the night
    8. 🍽️ Feeding & nutrition
  - Selected state: filled background + checkmark
- Bottom: "Continue" button (enabled after 1+ selection)

**Behavior**:
- Multi-select — user can pick as many as apply
- Tiles have subtle haptic feedback on tap (iOS)
- Buddy reacts based on selections:
  - 1 selection: "Got it! I'll make [challenge] our top priority."
  - 2-3 selections: "Totally normal for a [age] [breed]! I'll build your plan around these."
  - 4+ selections: "Sounds like [Name] is keeping you busy! Don't worry — we'll tackle everything step by step."
- Order of selected challenges determines priority weighting in the generated plan

**Edge cases**:
- User tries to continue with 0 selected: Shake the tile grid gently + Buddy says "Pick at least one so I can customize your plan!"
- All 8 selected: Valid — Buddy acknowledges and prioritizes by breed/age relevance

**Data collected**: `challenges` (array of enum values), `challenge_count` (integer), `challenge_order` (array — order selected for priority)
**Analytics events**: `screen_5_viewed`, `challenge_selected` (per tile), `challenge_deselected` (per tile), `challenges_submitted`

---

### Screen 6: Owner Experience Level

**Layout**:
- Buddy speech bubble: "Last question! How much dog experience do you have?"
- Center: Three large selectable cards (stacked vertically):
  1. 🐣 "First-time puppy parent" — "This is my first dog"
  2. 🐕 "Had dogs before" — "Not my first rodeo, but want to do it right"
  3. 🎓 "Experienced trainer" — "I know the basics, looking for advanced guidance"
- Single-select — tapping one deselects others

**Behavior**:
- On selection, Buddy reacts:
  - First-time: "Welcome to the club! I'll make sure to explain everything clearly. You've got this. 💪"
  - Had dogs before: "Awesome, you've got a head start! I'll focus on what's specific to [Name] and [breed]."
  - Experienced: "Nice! I'll skip the basics and jump right into the good stuff for [breed] specifically."
- This selection affects: language complexity in training plans, whether basic concepts are explained vs assumed, pacing of the plan, and AI chat personality calibration
- Auto-advance after reaction (1s)

**Data collected**: `experience_level` (enum: first_time, intermediate, experienced)
**Analytics events**: `screen_6_viewed`, `experience_selected`

---

### Screen 7: Personalized Plan Reveal (The Magic Moment)

**Layout — Loading State (2-3 seconds)**:
- Full screen takeover with premium feel
- Buddy animation: working/thinking (shuffling papers, typing, etc.)
- Text sequence (typewriter effect, cycling through):
  - "Analyzing [breed] training data..."
  - "Accounting for [Name]'s age..."
  - "Building your custom plan..."
  - "Almost ready..."
- Subtle progress indicator (not a bar — think pulsing dots or animated circles)

**Layout — Plan Reveal**:
- Transition: Smooth reveal animation (slide up or fade in)
- Top: "[Name]'s Personalized Training Plan" (large heading)
- Buddy speech bubble: "Here's your custom plan! Based on [Name]'s breed, age, and your goals, here's what we'll accomplish together."
- Plan card (scrollable, premium design):
  
  **Section 1: Quick Wins (Week 1-2)**
  - 3-4 specific milestones based on challenges selected
  - Example: "Potty training basics — [breed]s typically get this in ~14 days"
  - Example: "Bite inhibition foundations — reducing nipping by 50%"
  
  **Section 2: Core Training (Week 3-6)**
  - Progressive milestones
  - Example: "Reliable sit, down, and stay commands"
  - Example: "Comfortable alone for 30+ minutes"
  
  **Section 3: Advanced Goals (Week 7-12)**
  - Breed-specific achievements
  - Example: "Off-leash recall in controlled environments"
  - Example: "Calm greetings with strangers and other dogs"
  
  **Section 4: Good Boy Score Preview**
  - Visual chart showing projected score progression
  - Current: 0 → Week 4: 45 → Week 8: 72 → Week 12: 90+
  - "Your [breed] can reach a Good Boy Score of 90+ in about 12 weeks!"
  
  **Section 5: Health Timeline**
  - Based on age: upcoming vaccination dates, teething window, spay/neuter window
  - "[Name] has a vet visit due in approximately [X] weeks"

- Bottom: "Start [Name]'s Journey" CTA button → proceeds to paywall

**Behavior**:
- The loading animation is INTENTIONAL — even if the plan generates in <1 second, always show the loading state for 2-3 seconds minimum. This is the Cal AI trick: perceived effort = perceived value.
- Plan content is generated based on: breed, age, challenges, experience level
- Plan should feel specific and personalized — use the dog's name, breed name, and specific challenge references throughout. Never generic.
- The health timeline should be accurate for the breed and age
- Scroll depth tracking: measure how far users scroll through the plan

**Edge cases**:
- Plan generation fails: Show a simpler "starter plan" template based on breed/age with a message "We'll refine this as we learn more about [Name]"
- User taps back from this screen: Allow it, but track it — high back-rate here indicates the plan isn't compelling enough

**Data collected**: `plan_generated` (boolean), `plan_generation_time_ms` (integer), `plan_scroll_depth` (float 0-1)
**Analytics events**: `screen_7_viewed`, `plan_loading_started`, `plan_revealed`, `plan_scroll_depth`, `plan_cta_tapped`

---

### Screen 8: Paywall

**Layout** (managed via Superwall — this is the default; A/B test aggressively):
- Top: Small recap — "[Name]'s plan is ready!"
- Buddy speech bubble: "Start your free trial and let's begin training today!"
- Trial timeline visual (horizontal):
  - Day 0 (today): "Full access starts" (green dot)
  - Day 2: "We'll send a reminder" (yellow dot)
  - Day 3: "Trial ends — cancel anytime before" (red dot)
- Pricing options (radio/card select):
  - **Annual** (PRE-SELECTED, highlighted with "Best Value" badge):
    - "$39.99/year"
    - "$3.33/month"
    - "Save 67%"
  - **Monthly** (dimmed slightly):
    - "$9.99/month"
    - No badge
- Reassurance line: "✓ No payment due now · ✓ Cancel anytime · ✓ Reminder before billing"
- Feature checklist (brief):
  - ✓ Unlimited AI Mentor Chat with Buddy
  - ✓ Personalized training plan for [Name]
  - ✓ Health & vaccination tracker
  - ✓ XP, streaks & achievements
  - ✓ Photo progress journal
- CTA: "Start Free Trial" (large, primary, prominent)
- Below CTA: "Restore Purchase" (small text link) | "Terms" | "Privacy"
- Social proof (if available): "Join [X] puppy parents training with PupPal"
- Close/dismiss: Small X in top corner or "Not now" text below everything

**Behavior**:
- Annual plan pre-selected by default (test monthly-default variant)
- "Start Free Trial" initiates Apple/Google subscription flow
- On successful subscription: 
  - Animate Buddy celebration
  - Transition to first training session / home screen
  - Track: plan type, price, trial status
- On subscription flow cancelled (user backed out of Apple/Google prompt):
  - Return to paywall, do not dismiss
  - Track cancellation

**Behavior — Paywall dismissed (X tapped or "Not now")**:
1. First dismiss: Show exit offer screen
   - Buddy: "Wait! How about a longer trial? Here's 7 days free instead of 3."
   - Extended trial offer with same pricing
   - "Try 7 Days Free" CTA
   - "No thanks" below
2. Second dismiss (or "No thanks" on exit offer):
   - Let user through to free tier
   - Buddy: "No problem! You can explore PupPal and upgrade anytime."
   - Track: `paywall_dismissed_twice`
3. Every subsequent app open for non-subscribers:
   - Show paywall again when they hit a premium feature (AI chat, full plan, etc.)
   - Do NOT show paywall on every app open — only on premium feature access (reduces annoyance)
   - Track which premium feature triggered the re-display

**Superwall A/B test variants to run**:
- Price: $29.99 vs $39.99 vs $49.99 annual
- Price: $7.99 vs $9.99 vs $14.99 monthly
- Trial length: 3-day vs 7-day
- Pre-selected plan: Annual vs Monthly
- Exit offer: Extended trial vs discount (20% off first year) vs lifetime offer ($79.99)
- Social proof presence vs absence
- Feature list: 5 items vs 3 items vs none
- CTA copy: "Start Free Trial" vs "Train [Name] Now" vs "Unlock [Name]'s Plan"
- Layout: Timeline visual vs no timeline

**Data collected**: `paywall_presented` (boolean), `plan_selected` (enum: monthly, annual), `trial_started` (boolean), `subscription_price` (float), `subscription_currency` (string), `exit_offer_shown` (boolean), `exit_offer_accepted` (boolean), `paywall_variant_id` (string — from Superwall)
**Analytics events**: `screen_8_viewed`, `plan_toggled`, `trial_started`, `trial_cancelled`, `paywall_dismissed`, `exit_offer_shown`, `exit_offer_accepted`, `exit_offer_declined`

---

## 4. Data Model

### OnboardingSession

```
id: UUID (primary key)
user_id: UUID (nullable — assigned after auth)
device_id: string (anonymous tracking before auth)
started_at: timestamp
completed_at: timestamp (nullable)
last_screen_completed: integer (1-8)
abandoned: boolean (default false)
abandoned_at_screen: integer (nullable)

puppy_name: string (nullable)
puppy_photo_url: string (nullable)
detected_breed: string (nullable)
confirmed_breed: string (nullable)
breed_confidence: float (nullable)
detection_method: enum (photo_detected, photo_confirmed, manual_select, skipped)
puppy_age_weeks: integer (nullable)
age_input_method: enum (weeks, months, years, estimated)
challenges: jsonb (array of enum values)
challenge_priority_order: jsonb (array — order selected)
experience_level: enum (first_time, intermediate, experienced)

plan_generated: boolean (default false)
plan_id: UUID (nullable — FK to TrainingPlan)

paywall_presented: boolean (default false)
paywall_variant_id: string (nullable)
plan_selected: enum (monthly, annual, none)
trial_started: boolean (default false)
exit_offer_shown: boolean (default false)
exit_offer_accepted: boolean (default false)

referral_code: string (nullable — if entered via influencer link)
attribution_source: string (nullable)
```

### OnboardingAnalytics (event stream)

```
id: UUID
session_id: UUID (FK to OnboardingSession)
event_name: string
event_data: jsonb
screen_number: integer
timestamp: timestamp
```

---

## 5. Referral Code Integration

If the user arrives via an influencer link (e.g., puppal.app/ref/LUNA or a deep link with ?code=LUNA):

- Store the referral code immediately on session start
- On Screen 8 (Paywall): 
  - Auto-apply code: "Code LUNA applied — 7-day free trial!" (instead of standard 3-day)
  - Show who referred them if available: "Recommended by @lunas_adventures"
- On trial start: Credit the referral to the influencer's account for payout tracking
- If user manually enters a code: Add a "Have a code?" link on the paywall screen

---

## 6. Resume & Recovery Logic

**App killed during onboarding**:
- All data persists after each screen completion (not just at the end)
- On next app open: detect incomplete onboarding session
- Show Screen 1 with modified Buddy message: "Welcome back! Let's finish setting up [Name]'s plan."
- Skip to first incomplete screen

**Onboarding abandoned (user closed app and hasn't returned in 24+ hours)**:
- Push notification (if permission granted): "[Name]'s personalized plan is almost ready! Let's finish setting it up 🐾"
- After 48 hours: Second push — "Buddy misses [Name]! Come back and start training."
- After 7 days: Email (if collected): "Your puppy training plan is waiting"
- Mark session as abandoned after 14 days of inactivity

**Device change / reinstall**:
- If user created an account (post-paywall): Full data restored from backend
- If no account yet: Start fresh (onboarding data is device-local until account creation)

---

## 7. Accessibility Requirements

- All Buddy speech bubbles: accessible as text to screen readers
- Photo upload: voice-over support for camera/library selection
- Tile selection: proper accessibility labels ("Selected: Potty training" / "Unselected: Biting & nipping")
- Age picker: accessible with VoiceOver gestures
- Minimum touch targets: 44x44pt (Apple HIG)
- Color contrast: All text meets WCAG AA (4.5:1 ratio minimum)
- Animations: Respect "Reduce Motion" system setting — skip Buddy animations, use instant transitions

---

## 8. Dependencies

- **Breed detection model**: On-device Core ML model (preferred for speed) OR fast API endpoint (<3s response)
- **Training plan generation engine**: Backend service that takes breed + age + challenges + experience → generates personalized plan (PRD #03)
- **Superwall SDK**: Paywall management and A/B testing
- **RevenueCat SDK**: Subscription handling for Apple/Google (PRD #06)
- **Push notification permission**: Request AFTER onboarding completion, not during
- **Analytics SDK**: Mixpanel or Amplitude for event tracking
- **Attribution SDK**: Adjust or AppsFlyer for install attribution + referral code tracking

---

## 9. Acceptance Criteria

- [ ] User can complete full onboarding flow (8 screens) in under 3 minutes
- [ ] Buddy character appears on every screen with contextual reactions
- [ ] Photo upload triggers breed detection with result displayed within 3 seconds
- [ ] Breed detection handles: clear photos, blurry photos, multiple dogs, non-dog photos, and skip gracefully
- [ ] All challenge tiles are selectable and multi-select works correctly
- [ ] Personalized plan references dog's name, breed, age, and selected challenges
- [ ] Loading animation displays for minimum 2 seconds regardless of generation speed
- [ ] Paywall displays correct pricing with annual pre-selected
- [ ] Free trial initiates correctly through Apple/Google subscription flow
- [ ] Exit offer appears on first paywall dismiss
- [ ] Referral codes auto-apply and modify trial length
- [ ] Onboarding state persists between app sessions (resume works)
- [ ] All analytics events fire correctly at each screen
- [ ] VoiceOver/accessibility works on all screens
- [ ] Reduced Motion setting disables animations I left off, not start over.
- **US-6**: As a user who dismissed the paywall, I want to still access limited free features so I'm not completely locked out (but motivated to upgrade).
- **US-7**: As a user with multiple dogs, I want to be able to onboard additional dogs later without repeating the full flow.

---

## 3. The Buddy Character

### Who Is Buddy?

Buddy is PupPal's AI mentor character — the face of the onboarding (and later, the in-app chat). Think Lemonade's "Maya" but as a dog.

### Visual Design

- Illustrated dog character — warm, friendly, approachable
- NOT cartoonish/childish — more "friendly illustration" style (think Headspace's visual language)
- Buddy appears as a small avatar in a chat-bubble-style UI at the top of each screen
- Buddy's expression changes based on context: happy/excited when user answers, thoughtful when "building plan," celebratory at milestones
- Consistent across onboarding and in-app chat so users recognize the character

### Buddy's Voice & Tone

- Warm, supportive, slightly playful
- Uses the dog's name constantly after Screen 2
- Short messages — never more than 2 sentences per screen
- Feels like texting a knowledgeable friend, not reading instructions
- Uses occasional emoji (paw prints, hearts, party) but not excessively
- Never condescending or overly cute
- Example: "Nice! 8 weeks is the perfect time to start. [Name] is going to learn so fast."

---

## 4. Screen-by-Screen Flow

### Pre-Onboarding: App Launch (First Open)

**What happens**: App opens to a splash/loading screen, then immediately enters the onboarding flow. No login screen. No account creation. No "Sign up / Log in" choice. The user goes straight into the conversational flow.

**Why**: Lemonade delays registration until after the user has received value. Cal AI does the same — you complete the entire quiz before being asked for anything. Every extra screen before the conversation starts is drop-off.

**Account creation**: Handled silently via Apple Sign-In / Google Sign-In at the paywall step (Screen 8). No email/password forms.

**Edge case**: If user has previously created an account and reinstalls, detect via Apple/Google account and offer "Welcome back! Want to continue where you left off?" before re-entering onboarding.

---

### Screen 1: Meet Buddy

**Layout**:
- Buddy character avatar (large, centered, animated entrance — subtle bounce or fade-in)
- Chat bubble from Buddy: "Hey there! I'm Buddy, your puppy training mentor."
- Second bubble (appears after 0.5s delay): "Let's get to know your pup so I can create the perfect training plan."
- Single CTA button at bottom: "Let's Go"
- Background: Clean, warm gradient or solid color. No clutter.

**Interactions**:
- Tap "Let's Go" to animate to Screen 2
- No back button on this screen (nothing to go back to)

**Analytics event**: `onboarding_started`

**Design notes**:
- The 0.5s delay between bubbles creates the feeling of a real conversation — Buddy is "typing" then responding
- CTA button should be prominent, full-width, bottom of screen
- No skip option — this is the entry point

---

### Screen 2: Pup's Name

**Layout**:
- Buddy avatar (smaller, top of screen, in chat UI style)
- Buddy bubble: "First things first — what's your pup's name?"
- Large text input field, centered, with placeholder text: "Your pup's name"
- Keyboard auto-opens on screen load
- CTA button: "Next" (disabled/grayed until at least 1 character entered)

**Interactions**:
- User types name, CTA activates
- Tap "Next" — Buddy reacts with: "[Name]! I love that. Let's meet [Name]!"
- Brief reaction animation (0.5-0.8s) then transition to Screen 3
- Back button returns to Screen 1

**Validation**:
- Minimum 1 character
- Maximum 30 characters
- Allow letters, numbers, spaces, hyphens, apostrophes
- Strip leading/trailing whitespace

**Data captured**: `dog_name` (string)

**Analytics event**: `onboarding_name_entered` with property `name_length`

**Edge cases**:
- Empty input: CTA remains disabled
- Very long name: Truncate display in future screens with ellipsis if >15 chars
- Special characters: Allow common ones (apostrophes for names like "O'Malley")

---

### Screen 3: Photo Upload (THE MAGIC MOMENT)

**Layout**:
- Buddy bubble: "Let's see that cute face! Upload a photo of [Name]."
- Large photo upload area (centered, rounded rectangle, dashed border)
- Upload area contains: camera icon + "Take Photo or Choose from Library"
- Two tap targets within the upload area: "Camera" and "Photo Library" (or single tap opens system picker)
- Optional small text below: "This helps me identify [Name]'s breed and customize training"
- CTA: Hidden until photo is uploaded
- "Skip for now" link (small, subtle, below upload area)

**Photo Upload Flow**:
1. User taps upload area — system photo picker / camera opens
2. User selects or takes photo
3. Photo appears in the upload area (cropped to square, centered)
4. Loading state: "Analyzing [Name]..." with a subtle scanning animation over the photo (a gentle highlight sweep across the image)
5. Breed detection returns (target: under 2 seconds)
6. Buddy reacts: "A [Breed]! Great choice — I know exactly how to help with [Breed]s. They're [one breed-specific positive trait]."
   - Example: "A Golden Retriever! Great choice — I know exactly how to help with Goldens. They're incredibly smart but can be mouthy as puppies."
   - Example: "A Pomeranian! Great choice — I know exactly how to help with Poms. They're full of personality and surprisingly trainable."
7. Below Buddy's reaction: Detected breed displayed as a tag/chip (e.g., "Golden Retriever") with a small "Not right? Tap to change" link
8. CTA appears: "Next"

**Breed Detection Logic**:
- Primary: AI image recognition (cloud API call — Google Cloud Vision, AWS Rekognition, or custom model)
- Confidence >70%: Show breed directly
- Confidence 40-70%: Show "Looks like a [Breed]?" with confirm/change option
- Confidence <40%: Show "What breed is [Name]?" with searchable dropdown
- Mixed breeds: If detected, show "Looks like a [Breed 1] / [Breed 2] mix!"
- Fallback: If detection fails entirely, show breed selection dropdown

**Skip Flow**:
- If user taps "Skip for now": Show breed selection dropdown (searchable list of all AKC breeds + "Mixed Breed" + "I'm not sure")
- User selects breed manually
- Photo can be added later in profile settings
- Flag user in analytics as `photo_skipped`

**Data captured**:
- `dog_photo` (image file, stored in user's profile)
- `detected_breed` (string, from AI)
- `confirmed_breed` (string, user-confirmed or corrected)
- `breed_confidence` (float, from AI detection)
- `photo_uploaded` (boolean)

**Analytics events**:
- `onboarding_photo_presented`
- `onboarding_photo_uploaded` with `source` (camera/library)
- `onboarding_breed_detected` with `breed`, `confidence`, `was_corrected`
- `onboarding_photo_skipped`

**Edge cases**:
- Photo is not a dog: Buddy says "Hmm, I'm not sure I see a pup there! Want to try another photo?" Allow retry or skip to manual breed selection.
- Photo has multiple dogs: Use the most prominent dog. Buddy: "I see a few friends! I'll focus on the one front and center — looks like a [Breed]?"
- User denies camera/photo permissions: Show in-app prompt explaining why needed. If denied again, fall back to manual breed selection. Don't block onboarding.
- Very dark/blurry photo: If confidence <40%, go to manual selection with "I couldn't get a clear read — what breed is [Name]?"
- Network failure during AI detection: Show brief loading, fall back to manual selection. Never show an error. Log the failure.

**Design notes**:
- The scanning animation over the photo is THE KEY moment. This is the equivalent of Cal AI's food scan animation. Make it feel magical — a subtle light sweep, particle effect, or progress ring around the photo.
- Buddy's breed-specific response should include one genuinely useful breed fact. This proves the AI "knows" the breed before the user even asks a question.
- The photo to detection to response should feel like one fluid moment, not three separate steps.

---

### Screen 4: Age

**Layout**:
- Buddy bubble: "How old is [Name]?"
- Age picker: Two-part selector
  - Number picker (scrollable wheel or tap +/-): 1-24
  - Unit toggle: "Weeks" / "Months" / "Years"
  - Default: 8 weeks (most common new puppy age)
- Visual guide below picker: "Not sure? [Breed]s are usually brought home at 8-12 weeks."
- CTA: "Next"

**Buddy's reaction** (after user selects and taps Next):
- Puppy (under 6 months): "[Age]! The perfect time to start. [Name]'s brain is a sponge right now."
- Adolescent (6-18 months): "[Age] — the teenage phase! Don't worry, I've got a plan for that."
- Adult (18+ months): "It's never too late! [Name] is going to surprise you."

**Data captured**:
- `dog_age_value` (integer)
- `dog_age_unit` (enum: weeks/months/years)
- `dog_age_in_weeks` (calculated integer for plan generation)

**Analytics event**: `onboarding_age_entered` with `age_weeks` (normalized)

**Validation**:
- Minimum: 4 weeks (puppies shouldn't leave mother before this)
- Maximum: 20 years
- If user enters <4 weeks: Buddy explains puppy should stay with mother, still allows continuing

**Edge cases**:
- User doesn't know exact age (rescue): Add "I'm not sure" option showing approximate range picker ("Puppy: under 6 months / Young: 6-18 months / Adult: 1-7 years / Senior: 7+ years")
- Very old dog (10+): Buddy adjusts expectations but stays encouraging

---

### Screen 5: Challenges (Multi-Select)

**Layout**:
- Buddy bubble: "What's been the toughest part with [Name] so far?"
- Grid of challenge tiles (2 columns, 4 rows) — each tile has icon + short label
- Tap to select (visual toggle — highlighted border, checkmark, color change)
- Tiles:
  1. Potty Training
  2. Biting & Nipping
  3. Basic Commands
  4. Leash Walking
  5. Separation Anxiety
  6. Socializing
  7. Sleeping at Night
  8. Feeding & Diet
- "Select all that apply" instruction text
- CTA: "Next" (enabled after at least 1 selection)

**Buddy's reaction** (dynamic based on selections):
- If potty training selected: "Potty training is the #1 challenge — and [Breed]s usually crack it in 2-3 weeks with the right approach."
- If biting selected: "The biting phase is tough but totally normal for [Age] [Breed]s. We'll fix it."
- If 4+ selected: "Sounds like you've got your hands full! Don't worry — we'll tackle these one at a time."

**Data captured**:
- `challenges` (array of enum values)
- `challenge_count` (integer)
- `primary_challenge` (first selected, or auto-determined by breed/age)

**Analytics event**: `onboarding_challenges_selected` with `challenges` array and `count`

**Design notes**:
- Pre-select nothing — let the user choose
- Order tiles by most common challenges (potty training first)
- Consider re-ordering based on breed/age (8-week puppy: potty and biting top; 6-month adolescent: leash and commands)

**Edge cases**:
- Selects nothing: CTA disabled, subtle prompt to select at least 1
- Selects all 8: Allow it, Buddy acknowledges

---

### Screen 6: Experience Level

**Layout**:
- Buddy bubble: "And how about you — what's your experience with dogs?"
- Three option cards (vertical stack, one tap each):
  1. "This is my first puppy" — "I'm new to this!"
  2. "I've had dogs before" — "But I want to do it better this time"
  3. "I'm experienced" — "I know the basics, I want advanced techniques"
- Single select — tap one to select, tap another to switch
- CTA: "Next"

**Data captured**:
- `experience_level` (enum: first_time / experienced_owner / advanced)

**Analytics event**: `onboarding_experience_selected` with `level`

**Buddy's reaction**: No separate reaction — selection flows directly to Screen 7. Buddy's tone in the plan screen adapts based on experience level.

**Design notes**:
- Subtitles help users self-identify without overthinking
- Most users will be "first puppy" — this should feel normal, not "beginner"
- No judgment in any option

---

### Screen 7: Personalized Plan (The "Magic Moment")

This is the most important screen in the entire onboarding. This is where the user sees the value of everything they entered. PupPal's equivalent of Lemonade showing a real quote in 90 seconds or Cal AI showing projected weight trajectory.

**Transition into this screen**:
- After Screen 6, show full-screen loading animation (1.5-3 seconds, even if plan generates faster — perceived effort = perceived value)
- Loading screen shows:
  - Buddy character with a "thinking" expression
  - Text: "Building [Name]'s custom training plan..."
  - Subtle animation: progress dots or visual of plan elements assembling
  - Optional quick flashes: "[Breed] training patterns... Potty timeline for [Age]... Bite inhibition schedule..."
- DO NOT skip or shorten this loading screen. Cal AI and Lemonade both use artificial loading time to increase perceived value.

**Plan Screen Layout**:

**Section A: Buddy's Summary** (top of screen)
- Buddy avatar with celebratory expression
- Buddy bubble: "[Name]'s plan is ready! Here's what we're going to accomplish together."
- For first-time owners, add: "I've helped thousands of [Breed] parents — you're in great hands."

**Section B: The Plan Card** (scrollable, main content)
- Beautiful card layout with dog's photo (if uploaded) and name at top
- Plan highlights (preview only, not full plan — enough to create desire):
  - **Week 1-2 Focus**: Based on #1 challenge (e.g., "Master potty training basics — [Breed]s typically crack this in 10-14 days")
  - **Week 3-4 Focus**: Based on #2 challenge or next milestone (e.g., "Eliminate biting with positive bite inhibition training")
  - **Month 2 Milestone**: Bigger goal (e.g., "Reliable sit, stay, and come commands")
  - **Month 3 Milestone**: Aspirational (e.g., "Confident leash walking in public")

**Section C: Good Boy Score Preview**
- Score gauge or progress bar showing "Current: 0 → Target: 85 by Week 12"
- Text: "Track [Name]'s progress with the Good Boy Score"

**Section D: Health Timeline Preview**
- 2-3 upcoming health items based on breed and age:
  - e.g., "Vaccination #2 due in ~3 weeks"
  - e.g., "Teething peak expected in 2-4 weeks"
  - e.g., "Spay/neuter discussion at 6 months"

**Section E: CTA**
- "Start [Name]'s Training" button (leads to paywall)
- Should feel like "begin the journey," not "pay now"

**Data used to generate plan**: `confirmed_breed`, `dog_age_in_weeks`, `challenges`, `experience_level`

**Plan generation logic**: This is NOT the full training plan (that's PRD #03). This shows a PREVIEW — curated highlights designed to maximize "I need this" feeling. The full plan engine generates actual day-by-day content behind the paywall.

**Analytics events**:
- `onboarding_plan_generated` with `breed`, `age_weeks`, `challenges`, `experience_level`
- `onboarding_plan_viewed` with `scroll_depth`, `time_on_screen`
- `onboarding_plan_cta_tapped`

**Edge cases**:
- Plan generation fails (API error): Show generic but still personalized plan using breed/age defaults. Never show error screen.
- User scrolls but doesn't tap CTA: After 30s, show Buddy nudge: "Ready to get started?"
- User tries to go back: Allow it — plan regenerates on return

---

### Screen 8: Paywall

**Layout**:

**Top section**: Trial timeline visual (horizontal, 3 points):
- **Today** (green dot): "Full access starts now"
- **Day 2** (yellow dot): "We'll send a reminder"
- **Day 3** (red dot): "Trial ends — subscription starts"
- Above timeline: "Start your 3-day free trial"

**Middle section**: Plan options:

**Monthly Plan Card**:
- "$9.99 / month"
- "Cancel anytime"
- NOT highlighted (anchor — makes annual look better)

**Annual Plan Card** (HIGHLIGHTED, default selected):
- "$39.99 / year"
- "$3.33 / month" (prominent)
- "Save 67%" badge
- Visual emphasis: border, background color, "Best Value" tag, slightly larger

**Reassurance section**:
- "No payment due now"
- "Cancel anytime before trial ends"
- "We'll remind you before you're charged"

**Social proof** (A/B test):
- "Join 50,000+ puppy parents" (update with real numbers)

**CTA**: "Start Free Trial" (full-width, prominent)
- Tap triggers Apple/Google Sign-In then IAP confirmation
- After success: animate to celebration/first session

**Secondary options**:
- "Restore purchases" link (required by Apple)
- Terms / Privacy links (required by Apple)
- No visible "skip" or "X" on first presentation (A/B test this)

**Paywall dismissal flow**:
- User enters app in "free mode" with limited features
- Paywall re-presented at strategic friction points:
  - When they try AI chat (first message free, then paywall)
  - When they try Week 2+ of training plan
  - When they try health tracker details
  - After completing first training session
- Never show paywall more than once per session unprompted
- After 3 total dismissals, stop showing unprompted — only show on premium feature taps

**Superwall integration**:
- All paywall presentation, pricing, copy, layout managed through Superwall
- A/B test matrix (run continuously):
  - Price points: $29.99 vs $39.99 vs $49.99 annual
  - Monthly: $7.99 vs $9.99 vs $14.99
  - Trial length: 3-day vs 7-day
  - CTA copy variations
  - Layout: side-by-side vs stacked plans
  - Social proof: with vs without
  - Exit offer: discount on dismiss vs lifetime offer vs none
  - Lifetime option: show as third plan vs hide vs show only on exit

**RevenueCat integration**:
- Subscription management via RevenueCat SDK
- Product IDs: `puppal_monthly`, `puppal_annual`, `puppal_lifetime`
- Entitlement: `premium` — gates all premium features
- Trial period configured in App Store Connect / Google Play Console
- Webhooks for: trial started, converted, expired, renewed, cancelled
- Grace period: 16 days (Apple default) for billing retry

**Data captured**:
- `paywall_presented_at` (timestamp)
- `plan_selected` (monthly/annual/lifetime)
- `trial_started` (boolean)
- `trial_started_at` (timestamp)
- `paywall_dismissed` (boolean)
- `paywall_variant` (Superwall variant ID)

**Analytics events**:
- `paywall_presented` with `variant_id`, `source`
- `paywall_plan_selected` with `plan_type`
- `paywall_trial_started` with `plan_type`, `variant_id`
- `paywall_dismissed` with `variant_id`, `time_on_screen`

---

### Post-Paywall: Welcome & First Session

**If trial started**:
- Celebration screen: Buddy with confetti: "You and [Name] are going to do amazing things! Let's start your first training session."
- CTA: "Start First Lesson" — enters main app
- Background: trigger push notification scheduling, begin trial countdown, send welcome email

**If paywall dismissed (free mode)**:
- Buddy: "No worries! You can still explore. When you're ready, I'll be here."
- Enter app with limited features. Premium features show lock icons.

---

## 5. Data Model

### User Profile (created during onboarding)

```
User {
  id: UUID
  auth_provider: enum (apple / google)
  auth_provider_id: string
  email: string (from Apple/Google)
  created_at: timestamp
  onboarding_completed: boolean
  onboarding_completed_at: timestamp
  subscription_status: enum (trial / active / expired / cancelled / free)
  subscription_plan: enum (monthly / annual / lifetime / none)
  trial_started_at: timestamp (nullable)
  trial_ends_at: timestamp (nullable)
  experience_level: enum (first_time / experienced_owner / advanced)
  referral_code_used: string (nullable)
  app_version: string
  device_platform: enum (ios / android)
  timezone: string
  locale: string
}
```

### Dog Profile (created during onboarding)

```
Dog {
  id: UUID
  user_id: UUID (foreign key)
  name: string (max 30 chars)
  photo_url: string (nullable)
  detected_breed: string (nullable)
  confirmed_breed: string
  breed_confidence: float (nullable)
  is_mixed_breed: boolean
  secondary_breed: string (nullable)
  age_value: integer
  age_unit: enum (weeks / months / years)
  age_in_weeks: integer (calculated)
  date_of_birth: date (estimated, nullable)
  challenges: array of enum values
  created_at: timestamp
  is_primary: boolean (for multi-dog later)
}
```

### Onboarding Analytics

```
OnboardingEvent {
  id: UUID
  user_id: UUID (nullable before account creation)
  anonymous_id: string (device-level tracking)
  screen: enum (meet_buddy / name / photo / age / challenges / experience / plan / paywall)
  event_type: enum (viewed / completed / skipped / dropped_off)
  event_data: JSON (screen-specific properties)
  timestamp: timestamp
  session_id: string
  superwall_variant_id: string (nullable)
}
```

---

## 6. Navigation & Flow Logic

### Happy Path
Screen 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → Post-Paywall

### Back Navigation
- Every screen except Screen 1 has a back arrow
- Going back preserves previously entered data
- Going forward shows pre-filled data (never re-enter)
- Going back from paywall returns to plan screen

### Abandonment & Resume
- If app killed mid-onboarding: save progress locally (UserDefaults / AsyncStorage)
- On next open: resume from last completed screen
- Data persists 30 days. After 30 days inactivity, reset.
- If completed onboarding but no trial: open to paywall with skip-to-free option

### Deep Link Support
- Influencer referral link with code: store code before onboarding, apply at paywall (extended trial / tracking)
- Referral code stored on User profile + sent to RevenueCat as attribution

---

## 7. Technical Requirements

### Performance
- Screen transitions: <200ms animation
- Photo upload: Compress to max 2MB before sending to breed detection API
- Breed detection API response: <3 seconds (loading animation during)
- Plan generation: <2 seconds (but display animation for 2-3 seconds regardless)
- Paywall load (Superwall): <1 second

### Offline Handling
- Screens 1-2, 4-6 work fully offline
- Screen 3 (photo): If offline, skip detection and show manual breed selector. Queue photo for later.
- Screen 7 (plan): If offline, generate basic plan from local breed/age data. Enhance later.
- Screen 8 (paywall): Requires connection for IAP. Show "Connect to internet" with retry if offline.

### Accessibility
- VoiceOver / TalkBack on all screens
- All tap targets minimum 44x44pt
- Color contrast ratio minimum 4.5:1
- Buddy's bubbles readable at system font sizes
- Photo upload area has accessibility label

### Localization Readiness
- All strings externalized
- Date/age formats respect locale
- Buddy's name stays "Buddy" in all locales
- RTL layout support for future
- Currency formatting in paywall handled by Superwall + RevenueCat

---

## 8. Edge Cases Summary

| Scenario | Handling |
|----------|----------|
| Photo is not a dog | Buddy asks to retry, option to skip to manual breed select |
| Photo has multiple dogs | Use most prominent, ask confirmation |
| Camera permissions denied | Fall back to manual breed select |
| Breed detection API fails | Fall back to manual breed select silently |
| User enters age < 4 weeks | Buddy explains, still allows continuing |
| User selects 0 challenges | CTA disabled, prompt to select 1 |
| User selects all 8 challenges | Allow, Buddy acknowledges |
| App killed mid-onboarding | Resume from last completed screen |
| Reinstall after previous onboarding | Detect via Apple/Google ID, offer resume |
| No internet at photo screen | Skip detection, manual select |
| No internet at paywall | "Connect to internet" with retry |
| User dismisses paywall 3+ times | Stop showing unprompted, only on feature gates |
| Influencer referral code expired | Default trial length, standard pricing, log event |
| Apple/Google sign-in fails | Retry option, alternative sign-in |
| User changes breed after onboarding | Allow in settings, regenerate plan |
| User changes age after onboarding | Allow in settings, regenerate plan |

---

## 9. Dependencies

| Dependency | Purpose | Fallback |
|------------|---------|----------|
| Breed detection API | Photo to breed identification | Manual breed dropdown |
| Superwall SDK | Paywall A/B testing | Hardcoded paywall |
| RevenueCat SDK | Subscription management | Direct StoreKit (complex) |
| Apple Sign-In | Account creation | Google Sign-In |
| Google Sign-In | Account creation (Android) | Apple Sign-In (iOS) |
| Analytics SDK (Mixpanel/Amplitude) | Event tracking | Firebase Analytics |
| Push notification service | Trial reminders | Local notifications |
| Image storage (S3/Cloudflare R2) | Dog photo storage | Local device only |

---

## 10. A/B Testing Plan

### Priority Tests (via Superwall unless noted)

1. **Trial length**: 3-day vs 7-day — measure trial-to-paid conversion
2. **Annual price**: $29.99 vs $39.99 vs $49.99 — measure revenue per user
3. **Monthly price**: $7.99 vs $9.99 vs $14.99 — measure plan mix
4. **Paywall CTA copy**: "Start Free Trial" vs "Begin [Name]'s Journey" vs "Try Premium Free"
5. **Exit offer**: 20% discount on dismiss vs lifetime offer vs none
6. **Photo screen**: With breed detection vs without — completion rate impact
7. **Plan preview length**: Full preview vs abbreviated — paywall conversion
8. **Buddy reactions**: With vs without — completion rate
9. **Challenge tiles**: 8 vs 6 vs 4 options — drop-off
10. **Loading screen duration**: 1.5s vs 2.5s vs 3.5s — perceived value impact

### Testing Rules
- One test per screen at a time
- Minimum 1,000 users per variant
- Primary metric: trial start rate
- Secondary: trial-to-paid conversion (7-day window)
- Feature flags for non-paywall tests (LaunchDarkly / Statsig / Firebase Remote Config)

---

## 11. Analytics Requirements

### Funnel Events (Required)

Every screen fires `viewed` and `completed`:

```
onboarding_started (Screen 1)
  → onboarding_name_completed (Screen 2)
    → onboarding_photo_completed OR photo_skipped (Screen 3)
      → onboarding_age_completed (Screen 4)
        → onboarding_challenges_completed (Screen 5)
          → onboarding_experience_completed (Screen 6)
            → onboarding_plan_viewed (Screen 7)
              → paywall_presented (Screen 8)
                → paywall_trial_started OR paywall_dismissed
```

### User Properties (Set during onboarding)

```
breed: string
age_weeks: integer
experience_level: string
challenge_count: integer
photo_uploaded: boolean
onboarding_completed: boolean
subscription_status: string
referral_code: string (nullable)
paywall_variant: string
```

### Dashboards Needed
1. Onboarding funnel: screen-by-screen drop-off, daily/weekly
2. Conversion: trial start rate, plan mix, by variant
3. Breed distribution
4. Challenge distribution
5. Photo upload rate and impact on conversion
6. Referral attribution: trial starts by influencer code

---

## 12. Open Questions

1. Buddy's visual design: Custom illustration or 3D character? Budget for character design?
2. Breed detection provider: Custom model, Google Cloud Vision, or specialized pet breed API?
3. Multi-language: English-only at launch? Localization timeline?
4. Android timing: iOS first or simultaneous?
5. COPPA compliance: Concerns for users under 13?
6. Breed database: AKC list? Include designer breeds (Goldendoodle, Cockapoo)?
7. Photo storage costs: 100K users x 2MB = ~200GB. Acceptable?
8. Trial reminder: Push on Day 2 — Apple requires this. What copy? App or RevenueCat managed?

---

## 13. Acceptance Criteria

The onboarding feature is DONE when:

- [ ] All 8 screens render correctly on iOS (iPhone SE through iPhone 15 Pro Max)
- [ ] One-question-per-screen flow with Buddy reactions works end-to-end
- [ ] Photo upload to breed detection to Buddy reaction completes in <5 seconds
- [ ] Manual breed selection fallback works when photo skipped or detection fails
- [ ] Personalized plan generates using breed + age + challenges + experience data
- [ ] Loading animation displays for minimum 2 seconds on plan screen
- [ ] Paywall presents via Superwall with correct pricing and trial terms
- [ ] Apple Sign-In to RevenueCat trial start to premium access works end-to-end
- [ ] Free mode accessible if paywall dismissed (with feature gates)
- [ ] Onboarding state persists if app killed mid-flow
- [ ] All analytics events fire correctly
- [ ] Referral codes captured from deep links and stored on profile
- [ ] Back navigation preserves data on all screens
- [ ] Offline handling works for screens 1-6 with graceful degradation for 3, 7, 8
- [ ] VoiceOver/TalkBack accessible on all screens
- [ ] Superwall A/B test framework operational
