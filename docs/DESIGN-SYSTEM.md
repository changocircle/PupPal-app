# PupPal — Design System & Visual Specification

## The Brand Feeling

**In one sentence**: PupPal should feel like a warm, confident friend handing you a plan — not a clinical app giving you instructions.

**Design pillars**:
1. **Warm, not cold** — Soft backgrounds, rounded corners, warm color palette. Never sterile or corporate.
2. **Confident, not anxious** — The user is anxious. The app should feel calm, assured, in control. "I've got this handled for you."
3. **Playful, not childish** — Fun enough for a dog app, polished enough to feel premium. Think Headspace meets Duolingo, not a children's game.
4. **Simple, not empty** — Lemonade's one-thing-per-screen philosophy. Each screen does one job beautifully. Generous whitespace, zero clutter.
5. **Personal, not generic** — The dog's name and photo appear everywhere. This isn't "a training app." It's "[Name]'s training app."

**Competitor positioning**: Puppr looks like a 2018 content library. Dogo feels like a stock photo website. GoodPup is Zoom calls. PupPal should look like it was designed by the team that made Calm, Lemonade, or Duolingo — modern, intentional, beautifully branded.

---

## Brand Identity

### Logo Concept
A minimal, geometric dog silhouette (side profile or face) with a subtle "speech bubble" or "star" element suggesting AI/intelligence. Clean enough to work as an app icon at 60x60px. The word "PupPal" in Plus Jakarta Sans ExtraBold, with "Pup" in the primary coral and "Pal" in the deep navy.

### App Icon
Warm coral background (#FF6B5C) with a white/cream Buddy face silhouette centered. Rounded corners per Apple/Google specs. Should be instantly recognizable in a sea of blue/green pet apps.

### Personality Voice (In-App Copy)
- Friendly, warm, slightly playful
- Uses contractions (we're, you'll, don't)
- Short sentences, active voice
- Addresses user directly ("you" and "[Name]")
- Never clinical, never condescending
- Occasional parenthetical asides for personality ("(we know, it's a lot)")
- Emoji: sparingly, purposefully (paw print, fire, star, heart — never more than 1 per screen element)

---

## Color Palette

### Primary Colors

**Coral (Primary Brand)**: `#FF6B5C`
The hero color. Used for primary CTAs, active states, key UI accents, the brand itself. Warm, energetic, stands out without being aggressive. Works beautifully on both light and dark surfaces.
- Hover/pressed: `#E8554A`
- Light tint (backgrounds): `#FFF0EE`
- Extra light (subtle fills): `#FFF8F7`

**Deep Navy (Secondary)**: `#1B2333`
Grounding color for text, headers, and contrast elements. Warm enough to not feel corporate, dark enough for excellent readability.
- Lighter: `#2D3A4A`
- Lightest (secondary text): `#6B7280`

**Warm Gold (Accent)**: `#FFB547`
Celebration and gamification color. XP gains, achievements, streaks, milestones. The "reward" color.
- Deeper: `#F5A623`
- Light tint: `#FFF6E5`

### Semantic Colors

**Success / Sage Green**: `#5CB882`
Completed exercises, "up to date" badges, positive states.
- Light: `#E8F5EE`

**Warning / Amber**: `#F5A623`
Due soon, streak at risk, attention needed.
- Light: `#FFF6E5`

**Error / Soft Red**: `#EF6461`
Overdue, broken streak, failed states.
- Light: `#FDEDED`

**Info / Soft Blue**: `#5B9BD5`
Informational badges, tips, neutral highlights.
- Light: `#EBF3FA`

### Neutral Colors

**Background**: `#FFFAF7`
Warm off-white. NOT pure white — the warmth is critical. Every screen sits on this background. It should feel like cream paper, not a clinical screen.

**Surface (Cards)**: `#FFFFFF`
Pure white for cards and elevated surfaces. The contrast between warm background and white cards creates subtle depth.

**Border**: `#F0EBE6`
Warm gray for dividers and card borders. Barely visible but provides structure.

**Text Primary**: `#1B2333` (Deep Navy)
**Text Secondary**: `#6B7280`
**Text Tertiary**: `#9CA3AF`
**Text Inverse**: `#FFFFFF`
**Disabled**: `#D1D5DB`

### NativeWind Tailwind Config Mapping

```js
colors: {
  primary: { DEFAULT: '#FF6B5C', dark: '#E8554A', light: '#FFF0EE', extralight: '#FFF8F7' },
  secondary: { DEFAULT: '#1B2333', light: '#2D3A4A', lighter: '#6B7280' },
  accent: { DEFAULT: '#FFB547', dark: '#F5A623', light: '#FFF6E5' },
  success: { DEFAULT: '#5CB882', light: '#E8F5EE' },
  warning: { DEFAULT: '#F5A623', light: '#FFF6E5' },
  error: { DEFAULT: '#EF6461', light: '#FDEDED' },
  info: { DEFAULT: '#5B9BD5', light: '#EBF3FA' },
  background: '#FFFAF7',
  surface: '#FFFFFF',
  border: '#F0EBE6',
  text: { primary: '#1B2333', secondary: '#6B7280', tertiary: '#9CA3AF', inverse: '#FFFFFF' },
  disabled: '#D1D5DB',
}
```

---

## Typography

### Font Family: Plus Jakarta Sans

Why: Modern, geometric, warm, highly legible on mobile, excellent weight range (Regular through ExtraBold), free via Google Fonts, and NOT the generic Inter/SF Pro that every other app uses. It has personality — slightly rounded terminals give it warmth without being childish.

Load via `expo-google-fonts`:
```
@expo-google-fonts/plus-jakarta-sans
```

### Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| display | 36px | ExtraBold (800) | 40px | Onboarding headlines, celebration screens |
| h1 | 30px | Bold (700) | 36px | Screen titles |
| h2 | 24px | Bold (700) | 30px | Section headers |
| h3 | 20px | SemiBold (600) | 26px | Card titles, feature names |
| body-lg | 18px | Regular (400) | 26px | Buddy chat messages, primary content |
| body | 16px | Regular (400) | 24px | Default body text, descriptions |
| body-medium | 16px | Medium (500) | 24px | Emphasized body, labels |
| body-sm | 14px | Regular (400) | 20px | Secondary text, captions |
| body-sm-medium | 14px | Medium (500) | 20px | Badges, tags, small labels |
| caption | 12px | Medium (500) | 16px | Timestamps, fine print |
| overline | 11px | SemiBold (600) | 14px | Category labels, overlines (uppercase tracking +1) |

### Type Rules
- Never use more than 2 sizes on one screen (excluding navigation)
- Body text always Regular (400) or Medium (500), never Bold for paragraphs
- Headlines and CTAs use SemiBold (600) or Bold (700)
- Display weight (ExtraBold 800) reserved for onboarding and celebration moments only
- Letter spacing: default for all sizes except overline (+1px tracking, uppercase)

---

## Spacing & Layout

### Spacing Scale (in px)

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight inline spacing, icon-to-text gap |
| sm | 8px | Between related small elements |
| md | 12px | Default component internal padding |
| base | 16px | Standard padding, list item spacing |
| lg | 20px | Between sections within a card |
| xl | 24px | Screen horizontal padding, between cards |
| 2xl | 32px | Major section breaks |
| 3xl | 40px | Screen top/bottom padding |
| 4xl | 48px | Large gaps between major sections |
| 5xl | 64px | Onboarding vertical spacing |

### Screen Layout Rules
- **Horizontal padding**: 24px (xl) on all screens, always
- **Card internal padding**: 16px-20px (base-lg)
- **Between cards**: 16px (base)
- **Safe areas**: Always respect device safe area insets (notch, home indicator)
- **Bottom padding**: Minimum 32px (2xl) above any bottom navigation, 16px (base) above keyboard
- **CTA button placement**: Sticky bottom with 24px (xl) horizontal padding, 16px (base) above safe area
- **One primary action per screen** — Lemonade principle

### Grid
No formal grid. Rely on Tailwind flex/gap utilities. Content is always full-width within the 24px padding. Cards stretch full width. Never side-by-side cards on phone screens except challenge tile grids (2 columns).

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| sm | 8px | Buttons, input fields, small tags |
| md | 12px | Cards, modals, sheets |
| lg | 16px | Featured cards, bottom sheets |
| xl | 24px | Onboarding cards, paywall plan cards |
| full | 9999px | Avatars, pills, circular buttons |

### Rule: Everything is rounded.
PupPal has NO sharp corners anywhere in the UI. The minimum radius on any interactive or container element is 8px. This creates the "friendly" feeling — sharp corners feel aggressive and corporate.

---

## Shadows & Elevation

Three levels of elevation, all using warm-toned shadows (not pure black):

**Level 1 (Cards, inputs)**:
```
shadow: 0 1px 3px rgba(27, 35, 51, 0.06), 0 1px 2px rgba(27, 35, 51, 0.04)
```

**Level 2 (Floating elements, active cards)**:
```
shadow: 0 4px 12px rgba(27, 35, 51, 0.08), 0 2px 4px rgba(27, 35, 51, 0.04)
```

**Level 3 (Modals, bottom sheets, celebration overlays)**:
```
shadow: 0 12px 32px rgba(27, 35, 51, 0.12), 0 4px 8px rgba(27, 35, 51, 0.06)
```

### Rule: Shadows are warm.
Never use rgba(0,0,0,x) shadows. Always use the deep navy base (#1B2333) at low opacity. This keeps shadows warm and cohesive with the palette.

---

## Component Library

### Button

**Primary (Coral, filled)**:
- Background: primary (#FF6B5C)
- Text: white, body-medium (16px Medium)
- Padding: 16px vertical, 24px horizontal
- Border radius: sm (8px)
- Full width by default in most contexts
- Pressed state: primary-dark (#E8554A), slight scale down (0.98)
- Disabled: background #D1D5DB, text #9CA3AF
- Height: 52px minimum (comfortable tap target)

**Secondary (Outlined)**:
- Background: transparent
- Border: 1.5px primary (#FF6B5C)
- Text: primary, body-medium
- Same sizing as primary
- Pressed: background primary-extralight (#FFF8F7)

**Ghost (Text only)**:
- Background: transparent
- Text: primary or secondary, body-medium
- No border
- Pressed: slight opacity reduction (0.7)

**Small variant**: Height 40px, body-sm-medium (14px), padding 12px horizontal.

### Card

- Background: surface (#FFFFFF)
- Border radius: md (12px)
- Border: 1px border color (#F0EBE6) OR no border with Level 1 shadow
- Padding: 16px-20px
- Full width within screen padding

**Featured Card** (e.g., Today's Training):
- Background: surface white
- Border radius: xl (24px)
- Level 2 shadow
- Padding: 20px-24px
- Optional coral accent line on left (4px width, border-radius full)

### Input (Text)

- Background: #F9F6F3 (warm light gray)
- Border: 1.5px border color, focus: 1.5px primary
- Border radius: sm (8px)
- Padding: 14px horizontal, 14px vertical
- Text: body (16px Regular)
- Placeholder: text-tertiary
- Height: 48px
- Focus state: border color transitions to primary, subtle shadow

### Buddy Chat Bubble

**Buddy message (left-aligned)**:
- Background: surface white
- Border radius: lg (16px) with bottom-left radius sm (8px) — creates "speech bubble" feel
- Padding: 14px 16px
- Level 1 shadow
- Buddy avatar: 32px circle, positioned left of bubble
- Text: body-lg (18px Regular)
- Max width: 85% of screen width

**User message (right-aligned)**:
- Background: primary (#FF6B5C)
- Text: white, body (16px Regular)
- Border radius: lg (16px) with bottom-right radius sm (8px)
- No shadow
- Max width: 75% of screen width

### Badge / Tag

- Background: category-specific light color (e.g., success-light for completed)
- Text: category-specific dark color, body-sm-medium (14px Medium)
- Padding: 4px 10px
- Border radius: full (pill)
- No border

Variants: `success` (completed), `warning` (due soon), `error` (overdue), `info` (in progress), `neutral` (locked)

### Progress Bar

- Track: border color (#F0EBE6), 8px tall, border-radius full
- Fill: primary (#FF6B5C), animated width transition (300ms ease)
- Percentage label: body-sm-medium, positioned above right end of fill

### Score Gauge (Good Boy Score)

- Circular progress indicator, 120px diameter
- Track: #F0EBE6
- Fill: gradient from error (#EF6461) through warning (#F5A623) to success (#5CB882), based on score
- Center: score number in h1 (30px Bold), "/100" in caption
- Label below: "Good Boy Score" in body-sm-medium

### Streak Flame

- Size scales with streak length (24px at 1 day, up to 40px at 90+ days)
- Color escalation: warm gray (0), orange (1-6), deeper orange (7-13), red-orange (14-29), animated (30-59), blue-purple (60-89), special animated (90+)
- Always accompanied by streak number in body-medium: "12-day streak"

### Exercise Tile (in Today's Training list)

- Layout: horizontal row with left status icon, center content, right time
- Status icon: 24px circle — empty (upcoming), checkmark in success circle (completed), clock in info circle (in progress)
- Title: body-medium (16px Medium)
- Category tag: overline style, category color, above title
- Time: body-sm in text-tertiary, right-aligned
- Tap target: full row, 56px minimum height
- Completed: title has line-through style, muted opacity (0.6)

### Achievement Card (in grid)

- Size: ~(screen-width - 48px - 16px) / 2 (2-column grid with gap)
- Aspect ratio: roughly square
- Unlocked: Full color icon centered, achievement name below (body-sm-medium), date earned (caption)
- Locked: Grayed icon (opacity 0.3), name below, progress bar at bottom with "14/30" label
- Border radius: md (12px)
- Background: surface with Level 1 shadow
- Padding: 16px

### Tab Bar (Bottom Navigation)

- Background: surface white with top border (#F0EBE6)
- 5 tabs: Home, Chat, Plan, Health, Profile
- Icons: 24px, custom line icons
- Active: primary color (#FF6B5C), filled icon variant
- Inactive: text-tertiary (#9CA3AF), outline icon variant
- Labels: caption (12px Medium) below each icon
- Height: 56px + safe area bottom inset
- Active tab has subtle 3px dot indicator below icon in primary color (not a full highlight bar)

---

## Iconography

### Style
Line icons, 1.5px stroke weight, rounded caps and joins. Warm and friendly, matching the rounded UI. NOT the sharp/geometric style of Material Icons or harsh SF Symbols.

**Recommended icon set**: Lucide Icons (open source, React Native compatible, 1.5px stroke default, rounded style). Supplement with custom icons for brand-specific elements (paw print, Buddy, flame, bone).

### Custom Icons Needed
- Paw print (used throughout for XP, tips, brand moments)
- Buddy silhouette (tab icon, chat)
- Flame/fire (streaks)
- Bone (exercises, training)
- Star (achievements)
- Heart with pulse (health)
- Dog face variations (for Buddy expressions)

---

## The Buddy Character

### Visual Style
Buddy is an illustrated dog character — NOT a realistic photo, NOT a 3D render, NOT a cartoon mascot. Think "editorial illustration meets friendly character design." Clean lines, warm colors, expressive but not exaggerated.

**Style reference**: Headspace's characters, Duolingo's owl (but less cartoonish), Lemonade's Maya (conversational, friendly, but not a full-body character).

**Buddy is breed-ambiguous** — should read as a friendly generic "dog" so no user feels their breed is excluded. Warm golden/tan coloring, floppy ears, friendly eyes.

### Buddy Expressions
Buddy needs 6-8 expression variants for different contexts:
1. **Happy/Default** — used in most onboarding screens, standard chat
2. **Excited/Celebrating** — used for achievements, milestones, completions
3. **Thinking/Processing** — used during plan generation loading screen
4. **Empathetic/Caring** — used when user is frustrated, struggling
5. **Encouraging** — used for streak at risk, motivation moments
6. **Waving/Hello** — used on Screen 1 (Meet Buddy)
7. **Party** — used for level-ups, plan graduation (wearing a party hat or with confetti)
8. **Sleeping** — used for quiet states, nighttime notifications

### Buddy Display Sizes
- Chat avatar: 32px circle
- Onboarding: 80-120px (large, centered)
- Home screen greeting: 48px
- Achievement celebration: 64px
- Loading screen: 120px

### Commissioning
Consider commissioning the Buddy character from a freelance illustrator on Dribbble or Fiverr who specializes in app character design. Budget: $300-800 for the full expression set. Alternatively, use AI image generation (Midjourney) to generate the base character and refine.

---

## Animation Specifications

### Onboarding

**Screen transitions**: Horizontal slide (Expo Router default), 300ms ease-out. Each screen slides in from right.

**Buddy bubble typing delay**: When entering a new screen, Buddy's chat bubble should appear with a 0.5-second delay simulating "typing." Show three-dot typing indicator, then fade-replace with the actual text. Use Moti:
```
from={{ opacity: 0, translateY: 10 }}
animate={{ opacity: 1, translateY: 0 }}
transition={{ type: 'timing', duration: 400 }}
```

**Photo scan animation**: When breed detection is running, overlay a subtle gradient sweep (left-to-right, repeating) on top of the uploaded photo. Linear gradient from transparent → white (20% opacity) → transparent, animated translateX from -100% to 100%, 1.5s duration, repeat until detection returns.

**Plan loading**: Full-screen loading with Buddy "thinking" expression centered. Below Buddy, three text lines fade in sequentially (0.5s apart): "[Breed] training patterns...", "Potty timeline for [age]...", "Building your plan..." Each line fades in, holds for 0.8s, then fades to secondary text color as the next line appears. Total animation: 2-3 seconds.

### Gamification

**XP float-up**: On XP earn, a "+15 XP" label (accent gold color, body-medium bold) appears at the source element, floats up 40px over 600ms while fading out. Use Reanimated's `withSequence` for the combined translateY + opacity animation.

**Daily XP bar fill**: When XP updates, the progress bar fill animates from previous width to new width over 400ms with spring easing. If daily goal is hit, bar flashes gold briefly (200ms pulse) then settles to success green.

**Streak flame**: The flame icon has a subtle continuous pulse animation (scale 1.0 → 1.05 → 1.0, 2s cycle) when streak is active. On streak milestone, flame does a larger pulse (scale to 1.3) with a brief gold glow.

**Achievement unlock**: Full-screen overlay (background fades to 60% dark navy). Achievement badge scales from 0 to 1.2 (overshoot) then settles to 1.0 over 500ms. Confetti particles (8-12 pieces in brand colors) animate outward from the badge and fall with gravity. Buddy "excited" expression fades in below. Badge name and XP bonus fade in with stagger delay.

**Good Boy Score change**: Number counts up (or down) digit-by-digit over 300ms. The circular gauge fill animates smoothly to new position. On major milestone (every 10 points), gauge does a brief glow pulse in the milestone color.

### Chat

**Typing indicator**: Three dots in a horizontal row, each animating opacity from 0.3 to 1.0 with 200ms stagger delay between dots. Loop continuously while active. Positioned in a Buddy-style chat bubble.

**Message appear**: New messages (both user and Buddy) slide up from below with opacity fade-in. Duration: 200ms ease-out. User messages appear immediately. Buddy messages appear after typing indicator resolves.

**Streaming text**: Tokens append to the Buddy message bubble progressively. No animation per-token — just text appearing character by character (the natural effect of streaming is the animation). The bubble height animates smoothly as text grows (Reanimated layout animation).

### Exercise Completion

**Mark Complete tap**: Button does a brief scale-down (0.95) then scale-up with a satisfying "press" feel. Then: confetti burst (smaller than achievement, just 4-6 particles), checkmark icon animates in with scale+rotate (0 → 360° + 0 → 1 scale), XP float-up from the button, and exercise tile transitions from active to completed state with a 300ms cross-fade.

---

## Screen-by-Screen Visual Specifications

### Onboarding Screen 1: Meet Buddy

```
┌─────────────────────────────┐
│         (status bar)         │
│                              │
│                              │
│                              │
│                              │
│          ┌──────┐            │
│          │BUDDY │            │
│          │ 😊  │            │
│          │120px │            │
│          └──────┘            │
│                              │
│    ┌─────────────────────┐   │
│    │ Hey there! 👋        │   │
│    │ I'm Buddy, your     │   │
│    │ puppy training       │   │
│    │ mentor.              │   │
│    └─────────────────────┘   │
│                              │
│    ┌─────────────────────┐   │
│    │ Let's get to know    │   │  ← appears after 0.5s
│    │ your pup so I can    │   │
│    │ create the perfect   │   │
│    │ training plan.       │   │
│    └─────────────────────┘   │
│                              │
│                              │
│                              │
│  ┌───────────────────────┐   │
│  │      Let's Go →       │   │  ← Primary button, full width
│  └───────────────────────┘   │
│         (safe area)          │
└─────────────────────────────┘
```

**Background**: `background` (#FFFAF7)
**Buddy**: Large (120px), "waving" expression, centered with subtle bounce-in animation
**Bubbles**: White surface cards with Level 1 shadow, rounded-lg with bottom-left rounded-sm
**CTA**: Primary button, fixed to bottom with 24px padding

### Onboarding Screen 2: Dog's Name

```
┌─────────────────────────────┐
│  ←       (status bar)        │
│                              │
│   ┌──┐ ┌──────────────────┐  │
│   │🐕│ │ First things      │  │
│   │  │ │ first — what's    │  │
│   └──┘ │ your pup's name?  │  │
│         └──────────────────┘  │
│                              │
│                              │
│                              │
│   ┌──────────────────────┐   │
│   │  Your pup's name     │   │  ← Large input, auto-focus
│   └──────────────────────┘   │
│                              │
│                              │
│          (keyboard)          │
│                              │
│  ┌───────────────────────┐   │
│  │       Next →          │   │  ← Disabled until text entered
│  └───────────────────────┘   │
│                              │
└─────────────────────────────┘
```

**Buddy**: Small avatar (32px) to the left of the bubble (chat-style layout)
**Input**: Large, centered, warm gray background, auto-keyboard-open
**Back arrow**: Top left, subtle, icon only

### Onboarding Screen 3: Photo Upload

```
┌─────────────────────────────┐
│  ←       (status bar)        │
│                              │
│   ┌──┐ ┌──────────────────┐  │
│   │🐕│ │ Let's see that    │  │
│   │  │ │ cute face! Upload │  │
│   └──┘ │ a photo of Luna.  │  │
│         └──────────────────┘  │
│                              │
│   ┌──────────────────────┐   │
│   │                      │   │
│   │    ┌────────────┐    │   │  ← Dashed border, rounded-xl
│   │    │   📷       │    │   │
│   │    │            │    │   │
│   │    │ Take Photo │    │   │
│   │    │     or     │    │   │
│   │    │ Choose from│    │   │
│   │    │  Library   │    │   │
│   │    └────────────┘    │   │
│   │                      │   │
│   └──────────────────────┘   │
│                              │
│       Skip for now           │  ← Ghost button, small, subtle
│                              │
│  ┌───────────────────────┐   │
│  │       Next →          │   │  ← Hidden until photo uploaded
│  └───────────────────────┘   │
└─────────────────────────────┘
```

After photo uploaded + breed detected:
```
│   ┌──────────────────────┐   │
│   │   ┌──────────────┐   │   │
│   │   │  [PHOTO]     │   │   │  ← Photo with scan overlay complete
│   │   │   Luna       │   │   │
│   │   └──────────────┘   │   │
│   └──────────────────────┘   │
│                              │
│   ┌──┐ ┌──────────────────┐  │
│   │🐕│ │ A Golden          │  │
│   │😄│ │ Retriever! Great  │  │
│   └──┘ │ choice — they're  │  │
│         │ incredibly smart  │  │
│         │ but mouthy as     │  │
│         │ puppies.          │  │
│         └──────────────────┘  │
│                              │
│    🐕 Golden Retriever       │  ← Breed chip/tag
│    Not right? Tap to change  │  ← Ghost text link
```

### Onboarding Screen 5: Challenges (Multi-Select)

```
┌─────────────────────────────┐
│  ←       (status bar)        │
│                              │
│   ┌──┐ ┌──────────────────┐  │
│   │🐕│ │ What's been the   │  │
│   │  │ │ toughest part     │  │
│   └──┘ │ with Luna?        │  │
│         └──────────────────┘  │
│    Select all that apply     │
│                              │
│   ┌────────────┐ ┌─────────┐ │
│   │ 🚽         │ │ 🦷      │ │
│   │ Potty      │ │ Biting  │ │  ← 2-column grid
│   │ Training   │ │ &       │ │     Tap = selected (coral border)
│   │            │ │ Nipping │ │
│   └────────────┘ └─────────┘ │
│   ┌────────────┐ ┌─────────┐ │
│   │ 🎾         │ │ 🏃      │ │
│   │ Basic      │ │ Leash   │ │
│   │ Commands   │ │ Walking │ │
│   └────────────┘ └─────────┘ │
│   ┌────────────┐ ┌─────────┐ │
│   │ 😰         │ │ 🐕      │ │
│   │ Separation │ │ Social- │ │
│   │ Anxiety    │ │ izing   │ │
│   └────────────┘ └─────────┘ │
│   ┌────────────┐ ┌─────────┐ │
│   │ 🌙         │ │ 🍽️      │ │
│   │ Sleeping   │ │ Feeding │ │
│   │ at Night   │ │ & Diet  │ │
│   └────────────┘ └─────────┘ │
│                              │
│  ┌───────────────────────┐   │
│  │       Next →          │   │
│  └───────────────────────┘   │
└─────────────────────────────┘
```

**Challenge tiles**: White surface, rounded-md, Level 1 shadow, 16px padding. Emoji icon top, text below. Selected state: primary border (2px coral), primary-extralight background. Unselected: border color border.

### Onboarding Screen 7: Plan Preview

```
┌─────────────────────────────┐
│         (status bar)         │
│                              │
│   ┌──┐ ┌──────────────────┐  │
│   │🐕│ │ Luna's plan is    │  │
│   │🎉│ │ ready! Here's     │  │
│   └──┘ │ what we'll        │  │
│         │ accomplish.       │  │
│         └──────────────────┘  │
│                              │
│ ┌────────────────────────────┐
│ │  ┌───┐                     │
│ │  │📷 │  Luna               │  ← Dog photo + name header
│ │  └───┘  Golden Retriever   │
│ │                            │
│ │  WEEK 1-2                  │  ← overline style
│ │  Master potty training     │
│ │  basics — Goldens crack    │
│ │  this in 10-14 days        │
│ │                            │
│ │  WEEK 3-4                  │
│ │  Eliminate biting with     │
│ │  positive bite inhibition  │
│ │                            │
│ │  MONTH 2                   │
│ │  Reliable sit, stay, and   │
│ │  come commands             │
│ │                            │
│ │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│ │                            │
│ │  GOOD BOY SCORE            │
│ │  ┌────────────────┐        │
│ │  │ 0 ──────→ 85   │        │  ← Progress visualization
│ │  │   by Week 12   │        │
│ │  └────────────────┘        │
│ │                            │
│ │  HEALTH TIMELINE           │
│ │  💉 Vaccination #2 ~3 wks  │
│ │  🦷 Teething peak ~2-4 wks │
│ └────────────────────────────┘
│                              │
│  ┌───────────────────────┐   │
│  │  Start Luna's Training │   │  ← Primary button
│  └───────────────────────┘   │
└─────────────────────────────┘
```

**Plan card**: Featured card style (rounded-xl, Level 2 shadow). Scrollable vertically. Sections separated by subtle dividers. Week labels in overline style with accent color.

### Onboarding Screen 8: Paywall

```
┌─────────────────────────────┐
│         (status bar)         │
│                              │
│   Start your 3-day           │  ← h2 centered
│   free trial                 │
│                              │
│  ●────────●────────●         │  ← Timeline: Today → Day 2 → Day 3
│  Today    Reminder  Trial    │
│  Full     We'll     ends     │
│  access   remind             │
│                              │
│  ┌──────────────────────┐    │
│  │  BEST VALUE           │    │  ← Accent badge top-right
│  │                       │    │
│  │  Annual              │    │  ← SELECTED state: coral border
│  │  $39.99/year         │    │
│  │  $3.33/month         │    │  ← Large, emphasized
│  │  Save 67%            │    │
│  └──────────────────────┘    │
│                              │
│  ┌──────────────────────┐    │
│  │  Monthly             │    │  ← Unselected: subtle border
│  │  $9.99/month         │    │
│  │  Cancel anytime      │    │
│  └──────────────────────┘    │
│                              │
│  ✓ No payment due now        │  ← Success green checkmarks
│  ✓ Cancel anytime            │
│  ✓ We'll remind you          │
│                              │
│  ┌───────────────────────┐   │
│  │   Start Free Trial    │   │  ← Primary button
│  └───────────────────────┘   │
│                              │
│  Restore purchases · Terms   │  ← Caption, text-tertiary
└─────────────────────────────┘
```

**Annual card**: Coral border (2px), primary-extralight background, "Best Value" badge in accent gold. **Monthly card**: Border color border, no special treatment (anchor pricing).

### Home Screen (Today's Training)

```
┌─────────────────────────────┐
│         (status bar)         │
│                              │
│  Good morning! 👋            │  ← h2
│                              │
│  ┌───┐ Luna               │
│  │📷 │ Golden Retriever    │  ← Dog avatar + info row
│  └───┘ Week 3, Day 4       │
│                              │
│  ┌─────────────────────────┐ │
│  │ 🔥 12        ┌──────┐  │ │  ← Streak, Score, XP in one row
│  │ day streak   │  42  │  │ │
│  │              │ /100 │  │ │  ← Score gauge (small)
│  │  32/50 XP    └──────┘  │ │  ← XP bar below streak
│  │  ▓▓▓▓▓▓▓▓░░░░░ today  │ │
│  └─────────────────────────┘ │
│                              │
│  TODAY'S TRAINING  ~12 min   │  ← overline + time
│                              │
│  ┌─────────────────────────┐ │
│  │ ✅ POTTY                │ │  ← Completed exercise
│  │    Cue Word Reinforce.  │ │
│  │                   3 min │ │
│  ├─────────────────────────┤ │
│  │ ○  OBEDIENCE            │ │  ← Next exercise (tappable)
│  │    Sit: Adding Distance │ │
│  │                   5 min │ │
│  ├─────────────────────────┤ │
│  │ ★  BONUS                │ │  ← Bonus (optional label)
│  │    Paw Handling         │ │
│  │                   4 min │ │
│  └─────────────────────────┘ │
│                              │
│  THIS WEEK                   │
│  ▓▓▓▓▓▓▓▓▓░░░░░ 4/7 days   │  ← Week progress bar
│  Goal: Luna sits from 3ft   │
│                              │
│  WEEKLY CHALLENGE            │
│  ┌─────────────────────────┐ │
│  │ 🎯 Sit-a-thon           │ │
│  │ Practice sit in 5 spots │ │
│  │ ▓▓▓▓▓▓░░░░ 3/5  +50 XP│ │
│  │                 4d left │ │
│  └─────────────────────────┘ │
│                              │
│ ┌─────┬──────┬──────┬──────┐ │
│ │Home │Chat  │Plan  │Health│ │  ← Tab bar
│ │ ●   │      │      │      │ │
│ └─────┴──────┴──────┴──────┘ │
└─────────────────────────────┘
```

**Gamification row**: Horizontal card with streak flame (left), GBS gauge (right), XP bar spanning below. All in one featured card.

**Exercise list**: Card with dividers between exercises. Category label as overline in category color. Title in body-medium. Time in body-sm text-tertiary. Completed rows: muted, checkmark icon, no tap action.

### Chat Screen (Buddy)

```
┌─────────────────────────────┐
│  ← ┌──┐ Buddy      ● Online│
│     │🐕│                     │
│     └──┘                     │
│─────────────────────────────│
│                              │
│     ┌──┐ ┌───────────────┐   │
│     │🐕│ │Hey! Luna       │   │
│     └──┘ │should be ready │   │  ← Proactive Buddy message
│          │to start 'down' │   │
│          │this week. Want  │   │
│          │me to walk you   │   │
│          │through it?      │   │
│          └───────────────┘   │
│                              │
│           ┌──────────────┐   │
│           │ Luna keeps    │   │  ← User message (right, coral)
│           │ jumping on    │   │
│           │ guests        │   │
│           └──────────────┘   │
│                              │
│     ┌──┐ ┌───────────────┐   │
│     │🐕│ │Oh that's super │   │
│     └──┘ │common for      │   │  ← Buddy response
│          │Goldens! Here's │   │
│          │what works...   │   │
│          │                │   │
│          │👍 👎            │   │  ← Feedback icons (subtle)
│          └───────────────┘   │
│                              │
│  ┌──────────┬──────────┐     │
│  │Luna won't│What      │     │  ← Suggested prompts (scrollable)
│  │stop biting│should we │     │
│  │          │work on?  │     │
│  └──────────┴──────────┘     │
│                              │
│  📷 │ Ask Buddy anything... │➤│  ← Input bar
│─────────────────────────────│
│ │Home │Chat │Plan │Health│   │
│ │     │  ●  │     │      │   │
└─────────────────────────────┘
```

**Suggested prompts**: Horizontally scrollable pill buttons above input. Primary-light background, primary text, rounded-full. Tap sends immediately.

### Achievement Unlock Overlay

```
┌─────────────────────────────┐
│                              │
│      (dark overlay 60%)      │
│                              │
│                              │
│         ┌────────┐           │
│         │  🏆    │           │  ← Badge icon, scale-in animation
│         │        │           │
│         └────────┘           │
│          * * * *             │  ← Confetti particles
│        *       *             │
│                              │
│       SIT HAPPENS            │  ← h2, centered, white
│                              │
│    Luna mastered the         │  ← body, centered, white/80%
│    Sit command!              │
│                              │
│       +50 XP                 │  ← accent gold, bold
│                              │
│   ┌──┐                       │
│   │🐕│ Amazing! Luna is      │  ← Buddy excited expression
│   │🎉│ crushing it!          │
│   └──┘                       │
│                              │
│  ┌───────────────────────┐   │
│  │    Share Achievement   │   │  ← Secondary button (outlined, white)
│  └───────────────────────┘   │
│                              │
│      Tap anywhere to close   │  ← caption, white/60%
│                              │
└─────────────────────────────┘
```

---

## Dark Mode

**Not in v1.** Launch with light mode only. The warm off-white background IS the brand. Dark mode can be added later by swapping the color tokens:
- Background: `#1A1A2E` (deep navy variant)
- Surface: `#252540`
- Text primary: `#FFFFFF`
- Text secondary: `#A0A0B8`
- Primary coral stays the same
- Accent gold stays the same

---

## Accessibility

- All text meets WCAG 2.1 AA contrast ratios (4.5:1 for body, 3:1 for large text)
- All interactive elements minimum 44x44pt tap target
- Support Dynamic Type / system font scaling
- All images have alt text / accessibility labels
- Buddy animations respect "Reduce Motion" system setting (replace with fade transitions)
- Color is never the ONLY indicator (always paired with icon or text)
- Screen reader order follows visual hierarchy

---

## File Assets Needed Before Development

| Asset | Format | Who Creates | Priority |
|-------|--------|-------------|----------|
| Buddy character (8 expressions) | SVG or PNG @2x/@3x | Illustrator / AI-generated | P0 — blocks onboarding |
| App icon | 1024x1024 PNG | Design from Buddy | P0 — blocks App Store |
| Tab bar icons (5) | SVG | Lucide base + custom | P1 |
| Achievement badges (~20 initial) | SVG or PNG | Illustrator / AI-generated | P2 — can launch with text-only |
| Onboarding illustrations | SVG or PNG | Optional — Buddy + text may be enough | P3 |
| Splash screen | PNG | Buddy on coral background | P1 |
| Share card templates | Designed in code | Generated dynamically | P2 |
| Exercise category icons (11) | SVG | Custom or emoji initially | P2 |
