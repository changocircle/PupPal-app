# PRD #16: Sales Page / Landing Page

## PupPal — The First Impression Engine

**Document version**: 1.0
**Feature owner**: Ashley
**Status**: Draft
**Priority**: P0 — Every paid channel, every organic share, every AI search recommendation funnels to this page. If the landing page doesn't convert, nothing else matters. This is the front door.

---

## 1. Overview & Purpose

The PupPal landing page (puppal.com) is a single, high-conversion sales page that takes a visitor from "what is this?" to "I need this" to "downloading now" in under 60 seconds. It's the destination for every ad, every referral link, every blog post CTA, every AI search recommendation, and every App Store "visit website" tap.

**Design philosophy**: Lemonade-inspired. One idea per section. Bold headline, minimal copy, rich visual, clear CTA. No clutter, no walls of text, no feature dumps. Every scroll-stop earns the next scroll. The page should feel like a conversation, not a brochure.

**The page serves three audiences simultaneously**:

1. **Ad traffic** (TikTok, Meta, Google) — lands with a specific problem ("my puppy bites everything"). Needs instant validation that PupPal solves *their* problem, then a fast path to download.
2. **Organic/SEO traffic** — arrives curious but skeptical. Needs proof, differentiation, and trust before committing.
3. **Referral traffic** — sent by a friend or influencer. Already warm. Needs the shortest possible path from link to App Store.

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page load time (mobile) | <2s LCP | Lighthouse / Web Vitals |
| Bounce rate (paid traffic) | <45% | PostHog |
| Bounce rate (organic) | <55% | PostHog |
| CTA click-through rate | 12-18% of visitors | PostHog |
| App Store click-through | 8-12% of visitors | PostHog + AppsFlyer |
| Time on page | 45-90s average | PostHog |
| Scroll depth (50%+) | 60%+ of visitors | PostHog |
| Mobile vs desktop split | 85/15 target audience | PostHog |
| Referral link → install rate | 20-30% | AppsFlyer / Branch |

---

## 2. Design Principles (The Lemonade Playbook)

PupPal's landing page borrows five specific principles from Lemonade's award-winning approach:

### 2.1 One Thing Per Screen

Every scroll-stop section communicates exactly one idea. No dual messages, no split attention. Each section has: one headline, one supporting visual or proof point, and one implicit or explicit CTA. Lemonade's renters page uses bold headlines with almost no body copy below the fold — just a headline, an illustration, and a CTA. PupPal does the same.

### 2.2 The CTA Is a Character

Lemonade's pink "Check Our Prices" button is unmissable on every section. PupPal's coral `#FF6B5C` "Download Free" button plays the same role — it's the only saturated element on each white/warm section. The button never competes with other interactive elements. It appears at minimum 3 times on the page: hero, mid-page, and footer.

### 2.3 Social Proof as Texture, Not a Section

Lemonade weaves tweets and testimonials throughout the page rather than isolating them in a "Testimonials" ghetto. PupPal does the same — real user quotes and App Store review snippets appear *between* feature sections as light, scrollable social proof strips. They feel ambient, not performative.

### 2.4 Illustration > Photography

Lemonade uses custom illustration, not stock photography. PupPal uses Buddy (the illustrated AI mentor character) as the visual anchor throughout the page. Buddy appears in different expressions across sections, creating a visual thread and personality. App screenshots are used sparingly and only when showing the actual product UI (chat, training plan, Good Boy Score).

### 2.5 Speed Is a Feature

Lemonade's car landing page was built in React with Lottie animations — highly performant, 60fps, all-browser support. PupPal's page follows suit: static-site generation (Next.js or Astro), optimized images (WebP/AVIF with fallbacks), lazy-loaded sections, no render-blocking resources. The page must score 90+ on Lighthouse mobile performance.

---

## 3. Page Architecture

The page is a single, vertically-scrolling experience. No separate pages, no hamburger menu rabbit holes. Every section earns the next scroll.

### Section Map

| # | Section | Purpose | Scroll-Stop Headline |
|---|---------|---------|---------------------|
| 1 | Hero | Hook + CTA | "Like having a dog trainer on call 24/7 — for less than $4/month." |
| 2 | Problem | Validate pain | "You're Googling at 2am. YouTube has 47 answers. None of them know your dog." |
| 3 | Meet Buddy | Introduce AI differentiator | "Meet Buddy. He knows your [breed]. He's available at 2am. He never judges." |
| 4 | How It Works | 3-step simplicity | "Photo → Plan → Progress. That's it." |
| 5 | Social Proof Strip #1 | Ambient trust | (Scrollable tweet/review cards) |
| 6 | Training Plan | Show the product | "A 12-week plan built around [breed]'s actual needs." |
| 7 | Good Boy Score | Gamification hook | "Finally, a way to know if it's actually working." |
| 8 | Health Tracker | Secondary value | "Vaccinations, vet visits, weight tracking — one place." |
| 9 | Price Comparison | Overcome cost objection | "$40–70 per session. Or $39.99 for the whole year." |
| 10 | Social Proof Strip #2 | Ambient trust | (App Store ratings + review snippets) |
| 11 | FAQ | Handle objections | 5-6 concise Q&As |
| 12 | Final CTA | Close | "Your puppy's not going to train itself. (But Buddy will help.)" |

---

## 4. Section-by-Section Specification

### Section 1: Hero

**Layout**: Full viewport height. Centered content. Warm off-white background (`#FFFAF7`).

**Content**:
- **Eyebrow text** (small, coral): "AI-Powered Puppy Training"
- **Headline** (Display, 36-48px, Deep Navy): "Like having a dog trainer on call 24/7 — for less than $4/month."
- **Subheadline** (Body, 18px, secondary text): "Personalized training plans, an AI mentor that knows your breed, health tracking, and 160+ exercises. All in one app."
- **Primary CTA button** (Coral, full-width on mobile, centered on desktop): "Download Free" → links to smart App Store/Play Store redirect
- **Secondary link** (text-only, below CTA): "See how it works ↓" → smooth-scrolls to Section 4
- **Visual**: Buddy character (happy expression) beside a phone mockup showing the chat interface with a breed-specific response. The phone tilts slightly for depth. On mobile, Buddy sits above the phone mockup.

**Behavioral notes**:
- Hero loads instantly — no animation delay before content is readable
- Buddy illustration fades in with a subtle 300ms ease after page paint
- The phone mockup shows a real Buddy response: "Your 10-week Golden Retriever is teething hard right now. Here's exactly what to do..."
- App Store and Google Play badges appear below the CTA button (small, secondary)

**UTM handling**: The hero CTA must append UTM parameters from the landing page URL to the App Store link for attribution tracking. Referral codes embedded in URLs (from PRD-08) must persist through to install.

### Section 2: Problem Validation

**Layout**: White background. Left-aligned text on desktop (text left, illustration right). Stacked on mobile (text above illustration).

**Content**:
- **Headline** (H1, Deep Navy): "You're Googling at 2am. YouTube has 47 answers. None of them know your dog."
- **Supporting copy** (3 short lines, 16px, spaced):
  - "Is my puppy biting too much, or is this normal?"
  - "Every breed is different. Every puppy is different."
  - "You need answers that actually know *your* situation."
- **No CTA in this section** — it earns the scroll to the solution

**Visual**: Buddy illustration with "concerned" expression, surrounded by floating search query bubbles: "puppy won't stop biting," "is it normal for puppies to...", "help my puppy is..." — styled as Google search autocomplete suggestions. Faded, overlapping, slightly chaotic. The visual *is* the feeling of overwhelm.

**Animation**: Search bubbles float in gently on scroll-enter (Intersection Observer trigger). Subtle parallax drift. No heavy animation — this is a mood, not a spectacle.

### Section 3: Meet Buddy

**Layout**: Coral light tint background (`#FFF0EE`). Centered content.

**Content**:
- **Headline** (H1, Deep Navy): "Meet Buddy. Your AI puppy mentor."
- **Three feature pills** (horizontal on desktop, vertical stack on mobile):
  - 🐾 "Knows your breed, age, and challenges"
  - 💬 "Available 24/7 — even at 2am"
  - 🧠 "Learns as your puppy grows"
- **Chat preview**: A styled chat bubble showing Buddy's personality. Example exchange:
  - **User**: "My 12-week Lab just ate a sock. Do I need to panic?"
  - **Buddy**: "Deep breath! Labs are notorious sock thieves. Here's what to watch for..." (truncated with "See full answer in the app →")

**Visual**: Large Buddy character illustration (warm, friendly expression) centered above or beside the chat preview. Buddy is the visual anchor of the entire page — this is the section where visitors form a relationship with the character.

**Animation**: Chat bubbles type in sequentially on scroll-enter (300ms per bubble). Buddy's expression subtly shifts from neutral to engaged as the "conversation" plays. Light, delightful — not distracting.

### Section 4: How It Works

**Layout**: White background. Three-step horizontal layout on desktop, vertical on mobile.

**Content**:
- **Headline** (H1, Deep Navy): "3 steps. 2 minutes. A whole training plan."
- **Step 1**: "📸 Snap a photo" → "Our AI detects your puppy's breed instantly."
- **Step 2**: "📋 Get your plan" → "A 12-week program personalized to your dog's breed, age, and challenges."
- **Step 3**: "🚀 Start training" → "Daily exercises, AI mentor chat, progress tracking. Let's go."
- **CTA** (Coral): "Download Free — It Takes 2 Minutes"

**Visual**: Three phone mockups showing: (1) the breed detection photo screen, (2) the generated training plan, (3) today's training home screen. Each phone tilted at a complementary angle. On mobile, each step is a card with its own mockup.

**Design note**: This section does the heaviest lifting for "how does this actually work?" skeptics. Keep it dead simple. Three things. No footnotes, no asterisks, no "learn more" links.

### Section 5: Social Proof Strip #1

**Layout**: Full-width, light warm background (`#FFFAF7`). Horizontally scrollable card carousel.

**Content**: 5-8 cards, each containing:
- A real user quote (App Store review or social media post)
- Star rating (if from App Store)
- User name and dog breed + age (e.g., "Sarah M. — Golden Retriever, 14 weeks")
- Optional: small user avatar or dog emoji

**Design notes**:
- Cards auto-scroll slowly (CSS animation, pausable on hover/touch)
- Each card is a self-contained unit — no "read more" truncation
- No quotation marks — the card format implies the quote
- Breed + age in every testimonial reinforces personalization messaging

**Pre-launch strategy**: Before real reviews exist, use beta tester quotes. After launch, rotate in highest-rated App Store reviews weekly (automated or manual).

### Section 6: Training Plan

**Layout**: White background. Phone mockup left, content right (desktop). Stacked on mobile.

**Content**:
- **Headline** (H1, Deep Navy): "A 12-week plan built for *your* puppy."
- **Feature highlights** (icon + one-liner each, stacked):
  - "160+ exercises across 8 categories"
  - "Adapts difficulty based on your puppy's progress"
  - "Potty, biting, commands, leash, crate, socialization, and more"
  - "Post-graduation Trick Library to keep going"
- **Visual**: Phone mockup showing the week view of a training plan, with exercise cards visible. The plan should show a real breed name and real exercise titles — not lorem ipsum.

**Design note**: This is where the "content library" comparison happens in the visitor's mind. The emphasis is on *personalized* and *adaptive* — not "we have 160 videos." The plan screenshot should clearly show the dog's name and breed in the UI.

### Section 7: Good Boy Score

**Layout**: Warm gold light tint background (`#FFF6E5`). Centered content.

**Content**:
- **Headline** (H1, Deep Navy): "Finally, a way to know it's working."
- **Subheadline**: "The Good Boy Score tracks your puppy's progress across training, health, consistency, socialization, and bonding. One number. Total clarity."
- **Visual**: Large, centered Good Boy Score gauge (animated from 0 → 78 on scroll-enter). Below the gauge: 5 small dimension icons showing the breakdown (Training, Health, Consistency, Socialization, Bonding).

**Why this section matters**: The Good Boy Score is PupPal's most shareable, most unique feature. No competitor has anything like it. This section should make visitors think "I want to know my dog's score." It's the curiosity hook that drives downloads.

**Animation**: The gauge needle sweeps from 0 to 78 over 1.5s on scroll-enter. Dimensions fill in sequentially. The number counter ticks up like a speedometer. Uses Lottie or CSS animation — must be 60fps and lightweight.

### Section 8: Health Tracker

**Layout**: White background. Content left, phone mockup right (desktop). Stacked on mobile.

**Content**:
- **Headline** (H1, Deep Navy): "Vaccinations, meds, vet visits. One place."
- **Feature highlights** (icon + one-liner):
  - "Breed-specific vaccination schedule (AAHA guidelines)"
  - "Weight tracking with breed growth curve comparison"
  - "Medication reminders so you never miss a dose"
  - "PDF export for vet visits"
- **Visual**: Phone mockup showing the health dashboard — vaccination timeline with checkmarks, next-due items highlighted.

**Design note**: This section is secondary to training and AI — it shouldn't be as visually prominent. It exists to answer "what else does it do?" and to justify the subscription price. Keep it lean.

### Section 9: Price Comparison

**Layout**: Coral light tint background (`#FFF0EE`). Centered content.

**Content**:
- **Headline** (H1, Deep Navy): "A single training session: $40–70. PupPal for a whole year: $39.99."
- **Comparison visual**: Split card or side-by-side:
  - **Left** (greyed out, struck-through): "1 hour with a trainer — $60" / "No follow-up between sessions" / "Generic advice for all breeds" / "Available during business hours"
  - **Right** (coral-accented, active): "365 days of PupPal — $39.99" / "AI mentor available 24/7" / "Breed-specific, personalized plans" / "Progress tracking built in"
- **CTA** (Coral): "Start Free — 3 Day Trial"
- **Fine print** (caption text, below CTA): "Cancel anytime. No commitment. $39.99/year after trial."

**Design note**: This is the Lemonade move — make the price comparison visceral and visual, not just textual. The left side should feel expensive and old; the right side should feel modern and obvious. The emotional response should be "why would I NOT do this?"

### Section 10: Social Proof Strip #2

**Layout**: Same carousel format as Section 5, but with App Store-specific content.

**Content**:
- App Store average rating (large, centered above carousel): "⭐ 4.8 on the App Store"
- Review cards from App Store (same format as Section 5)
- Download count badge if >10K: "Trusted by [X] puppy parents"

**Pre-launch note**: This section is hidden until the app has 20+ ratings. Feature-flagged. Pre-launch, Section 5 handles all social proof.

### Section 11: FAQ

**Layout**: White background. Centered, max-width 680px. Accordion-style.

**Content** (5-6 questions):

**Q: What breeds does PupPal support?**
A: All of them. Our AI is trained on breed-specific behavioral and health data for 200+ breeds. During onboarding, you can snap a photo for automatic breed detection or select manually.

**Q: Is Buddy a real trainer or just a chatbot?**
A: Buddy is an AI mentor powered by advanced language models, with deep knowledge of dog behavior, breed-specific training, and puppy development. He's not a generic chatbot — every response considers your dog's breed, age, current training week, and history. For medical emergencies, Buddy will always direct you to your vet.

**Q: What if my puppy is older than 12 weeks?**
A: PupPal works for puppies up to 12 months. The training plan adapts to your puppy's age — an 8-month dog gets a different starting point than a 10-week puppy. After the 12-week plan, the Trick Library has 30+ advanced tricks to keep training going.

**Q: How does the free trial work?**
A: Download PupPal and start your 3-day free trial instantly. You get full access to everything — training plan, AI chat, health tracker, all features. If you love it, it's $39.99/year (that's $3.33/month). Cancel anytime before the trial ends and you won't be charged.

**Q: Can I use PupPal for multiple dogs?**
A: Yes! PupPal supports multiple dog profiles, each with their own training plan, health records, and progress tracking. (Multi-dog management is a premium feature.)

**Q: Is my data safe?**
A: Absolutely. PupPal uses industry-standard encryption, stores data on secure cloud infrastructure (Supabase/AWS), and never shares your personal information or your dog's data with third parties. You can export or delete all your data at any time.

**Interaction**: Accordion — tap question to expand answer. Only one open at a time. Smooth 200ms height animation.

### Section 12: Final CTA

**Layout**: Deep Navy background (`#1B2333`). Centered content. Full viewport height.

**Content**:
- **Buddy illustration** (large, "excited" expression, cream/white tones to pop on dark background)
- **Headline** (H1, white): "Your puppy's not going to train itself."
- **Subheadline** (body, white/70% opacity): "(But Buddy will help.)"
- **CTA** (Coral, large, prominent): "Download PupPal — It's Free"
- **App Store + Google Play badges** (below CTA)
- **Trust line** (caption, white/50% opacity): "3-day free trial · Cancel anytime · No credit card required to download"

**Design note**: This is the emotional close. Dark background creates contrast with the rest of the page. Buddy's excited expression creates forward momentum. The parenthetical subheadline matches the brand's warm, slightly-playful voice. The trust line removes final friction.

---

## 5. Navigation & Header

### Sticky Header

Minimal. Transparent on hero, transitions to white with shadow on scroll (after hero section).

**Contents**:
- **Logo** (left): PupPal wordmark — "Pup" in coral, "Pal" in navy
- **CTA** (right): "Download Free" (small coral button)
- **No navigation links** — this is a single-page sales funnel, not a website. No hamburger menu, no links to "About" or "Blog." The only action is download.

**Exception**: If blog/breed pages are live (post-launch SEO play), a subtle "Blog" text link appears to the left of the CTA. Nothing else.

---

## 6. Mobile-First Responsive Behavior

85%+ of target traffic is mobile. The page is designed mobile-first, then adapted up.

### Mobile Specifications

- **Full-bleed sections**: Every section spans 100% viewport width
- **Padding**: 24px horizontal padding on all text content
- **Font sizes**: Hero headline 28px, section headlines 24px, body 16px (minimum)
- **CTAs**: Full-width buttons on mobile (with 24px side padding)
- **Phone mockups**: Scaled to 65% viewport width, centered
- **Social proof carousels**: Swipeable, snap-to-card, with dot indicators
- **FAQ accordion**: Full-width, 48px minimum tap targets
- **Scroll performance**: No janky animations. CSS transforms only (no layout thrashing). Intersection Observer for scroll-triggered animations with `threshold: 0.3`.

### Desktop Adaptations (1024px+)

- **Max content width**: 1200px, centered
- **Two-column layouts**: Text + mockup side by side (sections 2, 3, 6, 8)
- **Hero**: Larger type (48px headline), phone mockup + Buddy side by side
- **CTAs**: Auto-width (not full-width), centered or left-aligned per section
- **Social proof**: Cards display 3 at a time (no carousel, just grid)

### Tablet (768-1023px)

- **Hybrid**: Two-column where space permits, single-column for tight sections
- **Phone mockups**: 50% viewport width
- **Social proof**: 2 cards visible + swipeable

---

## 7. Technical Specification

### Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Framework | Next.js 14+ (App Router) or Astro | SSG for performance, React for interactivity |
| Hosting | Vercel or Cloudflare Pages | Edge CDN, instant deploys, preview URLs for A/B |
| Styling | Tailwind CSS | Matches app's NativeWind; consistent design tokens |
| Animations | Lottie (Buddy + GBS gauge) + CSS transitions | Performant, cross-browser, designer-friendly |
| Analytics | PostHog (JS snippet) | Consistent with app analytics; funnels, heatmaps |
| Attribution | AppsFlyer OneLink / Branch | Deep links with UTM → App Store passthrough |
| CMS (post-launch) | Sanity or Contentful | For blog/breed pages, testimonial rotation |
| A/B Testing | PostHog feature flags or Vercel Edge Config | Headline, CTA copy, section order experiments |

### Performance Requirements

| Metric | Target | Tool |
|--------|--------|------|
| Lighthouse Performance (mobile) | 90+ | Chrome DevTools |
| LCP | <2.0s | Web Vitals |
| FID / INP | <100ms | Web Vitals |
| CLS | <0.05 | Web Vitals |
| Total page weight | <500KB (initial load) | Bundle analyzer |
| Time to interactive | <3.0s on 4G | WebPageTest |

### Image Strategy

- **Buddy illustrations**: SVG (resolution-independent, tiny file size) or optimized PNG with srcset
- **Phone mockups**: WebP with PNG fallback, responsive srcset (320w, 640w, 960w)
- **Social proof avatars**: 48x48px WebP, lazy-loaded
- **Hero image**: Preloaded via `<link rel="preload">` — no LCP delay
- **Below-fold images**: All lazy-loaded with `loading="lazy"` or Intersection Observer

### SEO

- **Title tag**: "PupPal — AI Puppy Training App | Personalized Plans & 24/7 AI Mentor"
- **Meta description**: "Train your puppy with an AI mentor that knows your breed. Personalized 12-week plans, 160+ exercises, health tracking, and the Good Boy Score. Try free for 3 days."
- **Canonical**: `https://puppal.com/`
- **OG/Twitter cards**: Custom share image featuring Buddy + tagline + App Store badges
- **Structured data**: SoftwareApplication schema (app name, rating, price, OS)
- **H1**: One per section (as specified above). Proper heading hierarchy (no skipped levels).

### Smart App Banner (iOS)

```html
<meta name="apple-itunes-app" content="app-id=XXXXXXXXX, app-argument=puppal://landing">
```

Displays native iOS banner: "PupPal — Open in App Store" at the top of Safari. Free installs, no friction. The `app-argument` passes through for deep linking.

---

## 8. UTM & Attribution Architecture

Every inbound link must be trackable. The landing page is the attribution hub.

### URL Parameter Handling

```
puppal.com/?utm_source=tiktok&utm_medium=paid&utm_campaign=buddy_demo_q1&utm_content=ad_v3
puppal.com/?ref=SARAHGOLDEN (referral code from PRD-08)
puppal.com/?inf=ZAKGEORGE (influencer code from PRD-08)
```

**Behavior**:
1. On page load, capture all URL parameters and store in sessionStorage
2. When user clicks any CTA, append parameters to the App Store / Play Store link via AppsFlyer OneLink or Branch
3. Referral codes (`ref=`) and influencer codes (`inf=`) are passed through to the app install for attribution (PRD-08 system)
4. PostHog captures `landing_page_viewed` event with all UTM parameters as properties

### Analytics Events (PostHog)

| Event | Properties | Trigger |
|-------|-----------|---------|
| `landing_page_viewed` | `utm_source, utm_medium, utm_campaign, utm_content, referral_code, device_type` | Page load |
| `landing_section_viewed` | `section_name, section_number, scroll_depth_percent` | Intersection Observer (30% visible) |
| `landing_cta_clicked` | `cta_location (hero/mid/footer), cta_text, utm_source` | CTA click |
| `landing_app_store_clicked` | `store (apple/google), cta_location, utm_source` | App Store badge click |
| `landing_faq_expanded` | `question_text, question_index` | FAQ accordion open |
| `landing_social_proof_scrolled` | `strip_number, cards_viewed` | Carousel interaction |
| `landing_time_on_page` | `seconds, max_scroll_depth` | Page unload / visibility change |

---

## 9. A/B Testing Plan

### Launch Tests (First 30 Days)

| Test | Variants | Primary Metric | Hypothesis |
|------|----------|---------------|------------|
| Hero headline | A: "Like having a dog trainer on call 24/7" vs B: "Your puppy. Your breed. Your plan." vs C: "Stop Googling. Start training." | CTA click-through | Problem-aware headline (A) outperforms feature (B) and command (C) |
| CTA copy | A: "Download Free" vs B: "Start Free Trial" vs C: "Meet Buddy" | App Store click-through | "Download Free" wins on clarity; "Meet Buddy" wins on curiosity |
| Section order | A: Problem → Buddy → How It Works vs B: How It Works → Buddy → Problem | Scroll depth + CTA clicks | Leading with problem validation increases emotional engagement |
| Price section | A: Side-by-side comparison vs B: "Less than $4/month" simple stat | CTA click-through | Comparison creates stronger value anchor |
| Social proof density | A: 2 strips (sections 5+10) vs B: 1 strip (section 5 only) | Bounce rate + conversion | More social proof reduces bounce for cold traffic |

### Testing Infrastructure

- PostHog feature flags assign visitors to cohorts on first page load
- Cohort assignment persists via cookie (no flickering between variants)
- Each test runs for minimum 2 weeks or 1,000 visitors per variant (whichever comes first)
- Statistical significance threshold: 95% confidence
- Only one test per section at a time (no interaction effects)

---

## 10. Referral & Campaign Landing Variants

### Referral Landing (puppal.com/?ref=CODE)

When a referral code is detected:
- **Hero subheadline changes** to: "Your friend [Referrer Name if available] thinks you'll love this. They're probably right."
- **Referral banner** (top of page, coral background): "🎁 You've been referred! Download now and you both get a bonus."
- **All CTAs** append the referral code through to App Store for attribution
- Everything else stays the same — the core page still needs to sell PupPal

### Influencer Landing (puppal.com/?inf=CODE)

When an influencer code is detected:
- **Hero can dynamically show influencer's name**: "Recommended by [Influencer Name]"
- **Influencer photo badge** appears near hero CTA (small, trust signal)
- Otherwise identical to main page

### Breed-Specific Landing (puppal.com/breeds/golden-retriever)

Covered in PRD-12 (Breed Encyclopedia) as SEO landing pages. These are separate from the main sales page but link to it. Each breed page has its own CTA: "Get your personalized [Breed] training plan."

---

## 11. Pre-Launch vs Post-Launch Content

### Pre-Launch (Before App Store Approval)

- **CTAs change to email capture**: "Get Early Access" → email input + submit
- **Social proof**: Beta tester quotes only (minimum 5)
- **App Store badges**: Hidden (replaced with "Coming soon to iOS and Android")
- **Email capture**: Stores to Supabase `waitlist` table with UTM parameters
- **Waitlist count** displayed if >500: "Join [X] puppy parents on the waitlist"

### Post-Launch Transition

- Swap email capture for App Store CTAs (feature flag toggle — no code deploy)
- Enable Section 10 (App Store social proof strip) once 20+ ratings exist
- Add real review cards to Section 5 carousel
- Enable download count badge once >10K installs

---

## 12. Legal & Compliance

- **Privacy Policy** and **Terms of Service** links in the footer (separate pages, not on the landing page itself)
- **Cookie consent**: Minimal banner for EU visitors (GDPR). PostHog respects opt-out.
- **App Store guidelines**: No misleading claims about AI capabilities. "AI mentor" is accurate. No claims about guaranteed training outcomes.
- **Price display**: Always show the per-year price ($39.99/year) with the per-month breakdown ($3.33/month) as supplementary. Never show only the monthly equivalent of the annual price — this is deceptive.
- **"Free" claims**: "Download Free" refers to the app download + 3-day trial. The CTA must be near text that clarifies: "3-day free trial. $39.99/year after."
- **Testimonials**: All testimonials must be from real users. Pre-launch beta quotes must be real beta testers. No fabricated reviews.

---

## 13. Content & Copy Guidelines

All landing page copy follows the brand voice defined in DESIGN-SYSTEM.md:

- **Contractions**: Always (we're, you'll, don't — never "we are," "you will")
- **Sentence length**: Short. Punchy. 8-12 words per sentence max in headlines. Body copy can be slightly longer but never academic.
- **Tone**: Warm, confident, slightly playful. The page should feel like a smart friend explaining something cool they found — not a salesperson.
- **"You" and "your"**: The visitor is always "you." Their dog is always "your puppy" or "[breed name]."
- **Specificity over generality**: "160+ exercises across 8 categories" beats "tons of training content." "$39.99/year" beats "affordable pricing."
- **No jargon**: Never say "leverages AI" or "cutting-edge technology." Say "Buddy knows your breed" or "your plan adapts as your puppy learns."
- **One parenthetical per page** (max): Used for the brand's signature warm aside. Don't overdo it.

---

## 14. Build Phases

### Phase 1: Pre-Launch Landing (Week 1-2)

**Goal**: Waitlist capture page live for early marketing, ad creative testing, and domain authority building.

- Static page with hero, problem, Meet Buddy, How It Works, FAQ, Final CTA
- Email waitlist capture (Supabase)
- PostHog analytics instrumented
- UTM parameter capture
- Mobile-responsive, 90+ Lighthouse
- Social proof with 5+ beta tester quotes
- OG image and meta tags for social sharing

### Phase 2: Launch Landing (App Store Approval Day)

**Goal**: Full conversion page with App Store links.

- Feature flag swap: email capture → App Store CTAs
- Smart App Banner enabled (iOS)
- AppsFlyer / Branch deep links configured
- All 12 sections live
- Referral code detection and dynamic hero
- A/B test #1 live (hero headline)

### Phase 3: Optimization (Month 1-3)

**Goal**: Iterate on conversion based on real data.

- A/B tests running on headline, CTA copy, section order, price framing
- Real App Store reviews rotating into social proof strips
- Heatmap and session replay analysis (PostHog)
- Scroll depth optimization (cut or reorder underperforming sections)
- Page speed monitoring and optimization
- Influencer landing variant live

### Phase 4: Scale (Month 3+)

**Goal**: The landing page becomes a conversion machine.

- CMS integration for dynamic testimonial management
- Breed-specific dynamic content (if UTM indicates breed intent)
- Localization prep (Spanish first, based on market data)
- Video embed (app demo reel) if bandwidth allows without perf hit
- Blog integration for SEO hub

---

## 15. Dependencies

| Dependency | PRD | What's Needed |
|-----------|-----|---------------|
| Buddy illustrations (8 expressions) | DESIGN-SYSTEM.md | Illustration assets in SVG/PNG for web use |
| App screenshots (5 screens) | All core PRDs | Real app screenshots from TestFlight builds |
| Referral code system | PRD-08 | URL parameter detection + App Store passthrough |
| Influencer attribution | PRD-08 | Influencer code detection + dynamic hero content |
| PostHog setup | PRD-13 | JS snippet, event taxonomy, feature flags |
| App Store listing | PRD-06 | App ID for Smart App Banner + deep links |
| Domain + hosting | Infra | puppal.com pointed to Vercel/Cloudflare |
| AppsFlyer / Branch | Infra | Deep link SDK for attribution passthrough |
| Supabase waitlist table | Infra | Pre-launch email capture endpoint |

---

## 16. Success Criteria

The landing page is successful when:

1. **Paid traffic converts at 8%+ (visit → App Store click)** — this makes paid acquisition unit economics viable at <$12 CPA
2. **Organic traffic bounces at <55%** — meaning the page holds attention for search visitors
3. **Referral traffic converts at 20%+** (visit → install) — warm traffic should convert much higher
4. **Mobile Lighthouse score stays >90** — speed is conversion
5. **The page supports $100K MRR at month 6** — it must handle the traffic volume and conversion rate required to hit 3,000 subscribers with reasonable ad spend

The landing page is not a "set and forget" asset. It's a living conversion surface that evolves weekly based on data, testing, and new social proof. Every A/B test result, every new testimonial, every scroll depth insight makes it better.

---

*"The best landing pages don't sell. They make you feel like you already made the decision — they just give you the button."*
