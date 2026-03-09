# PRD #17: Localization & Multi-Language Support

## PupPal — Going Global: From English-Only to Worldwide

**Document version**: 1.0
**Feature owner**: Ashley
**Status**: Draft
**Priority**: P1 — Woofz supports 10 languages and generates ~30% of revenue internationally. The dog training market is inherently global — every country has puppies, and every puppy needs training. Localization is the highest-leverage growth move after proving the model in English.

---

## 1. Overview & Purpose

PupPal launches in English (US) to validate the product, paywall conversion, and retention mechanics. Once the core metrics are proven (target: $50K+ MRR, 70%+ Day 7 retention, 40%+ trial-to-paid), localization unlocks a 3-5x TAM expansion with relatively low incremental cost.

This PRD covers:

1. **App UI localization** — every string, label, button, and Buddy dialogue in the user's language
2. **Training content translation** — 160+ exercises, 30-40 tricks, breed profiles — the actual value of the app
3. **AI Buddy chat localization** — Buddy speaks the user's language natively in chat
4. **App Store listing localization** — ASO in each target language
5. **Pricing localization** — market-appropriate pricing for each region
6. **Cultural adaptation** — not just translation; units (kg vs lb), date formats, vet practices, legal compliance (GDPR for EU)

### Why Not Just Machine Translate?

Machine translation is fine for UI strings and App Store descriptions. It is NOT fine for training instructions. "Lure your puppy's nose upward with the treat" mistranslated could mean the difference between a successful training session and a confused, frustrated owner. Training content requires professional translation by native speakers with dog training knowledge, then review by a second translator.

### Success Metrics

| Metric | Target | How Measured |
|--------|--------|-------------|
| International installs as % of total | 30%+ within 6 months of localization | App Store Connect / Play Console |
| International trial-to-paid conversion | Within 80% of US rate | RevenueCat by region |
| Onboarding completion (localized) | Within 5% of English rate | PostHog by locale |
| App Store rating (localized markets) | 4.5+ stars | App Store / Play Store |
| International revenue as % of total | 25%+ within 12 months | RevenueCat |
| Localization quality score | <2% of support tickets about translation | Support tagging |
| Time to localize new content | <5 business days per language | Internal tracking |

---

## 2. Target Languages & Rollout Phases

### Phase 1: High-ROI European Languages (v1.1)

| Language | Code | Markets | Why |
|----------|------|---------|-----|
| Spanish | `es` | Spain, Mexico, Latin America | 500M+ native speakers, massive pet market in Mexico/Spain/Argentina |
| French | `fr` | France, Belgium, Switzerland, Canada (Quebec) | 280M speakers, France has Europe's largest pet population |
| German | `de` | Germany, Austria, Switzerland | Highest spending per pet in Europe, strong app purchasing culture |
| Portuguese | `pt-BR` | Brazil, Portugal | Brazil is world's 4th largest pet market, 55M dogs |
| Italian | `it` | Italy | High pet ownership rate, underserved by competitors |

### Phase 2: High-Growth Markets (v1.2)

| Language | Code | Markets | Why |
|----------|------|---------|-----|
| Dutch | `nl` | Netherlands, Belgium | High pet ownership, strong English fallback but local preference |
| Japanese | `ja` | Japan | Premium pet market, high willingness to pay for pet tech |
| Korean | `ko` | South Korea | Rapidly growing pet market, high smartphone penetration |
| Simplified Chinese | `zh-Hans` | China (if feasible) | Largest dog population in the world, but App Store/distribution challenges |

### Phase 3: Expansion (v1.3+)

Polish, Turkish, Swedish, Norwegian, Danish, Thai, Indonesian, Hindi — prioritized by install request data and competitor gap analysis.

### Decision Framework for Adding Languages

Add a language when ALL of these are true:
- 500+ monthly App Store search impressions for dog training terms in that language
- At least one competitor is localized in that language (validates market)
- Professional translator with dog training knowledge is available
- Regional App Store pricing is configured

---

## 3. User Stories

- **US-1**: As a Spanish-speaking user, I want the entire app in Spanish so I can understand training instructions clearly and train my puppy effectively.
- **US-2**: As a French user, I want Buddy to chat with me in French so the AI mentor feels natural and helpful, not foreign.
- **US-3**: As a Brazilian user, I want pricing in BRL and weight in kg so the app feels made for me, not just translated from English.
- **US-4**: As a German user searching "Welpen Training App" in the App Store, I want to find PupPal with a German description so I know it supports my language before downloading.
- **US-5**: As a bilingual user (English/Spanish), I want to choose my app language independently of my device language, so I can use the app in whichever language I prefer.
- **US-6**: As an admin/content creator, I want a workflow for adding new exercises that flags them for translation across all supported languages so nothing slips through.

---

## 4. Technical Architecture

### i18n Framework

**Library**: `react-i18next` + `expo-localization`

```
expo-localization → detect device language
react-i18next    → load correct translation bundle
                 → fallback chain (e.g., pt-BR → pt → en)
                 → interpolation for dynamic tokens ({dog_name}, {breed}, etc.)
```

### Translation File Structure

```
/locales
  /en
    common.json          // Shared UI: buttons, labels, navigation
    onboarding.json      // Onboarding flow strings
    training.json        // Training plan UI
    chat.json            // Chat UI (not AI responses)
    health.json          // Health tracker UI
    gamification.json    // XP, streaks, achievements UI
    settings.json        // Settings screen
    notifications.json   // Push notification templates
    paywall.json         // Paywall copy
    errors.json          // Error messages
  /es
    common.json
    onboarding.json
    ... (same structure)
  /fr
    ...
  /de
    ...
```

### Translation Key Convention

```json
{
  "onboarding.screen1.buddy_greeting": "Hey there! I'm Buddy, your puppy training mentor.",
  "onboarding.screen1.buddy_intro": "Let's get to know your pup so I can create the perfect training plan.",
  "onboarding.screen1.cta": "Let's Go",
  "onboarding.screen2.buddy_question": "First things first — what's your pup's name?",
  "onboarding.screen2.placeholder": "Your pup's name",
  "onboarding.screen2.cta": "Next",
  "onboarding.screen2.buddy_reaction": "{{dog_name}}! I love that. Let's meet {{dog_name}}!",
  "training.today.header": "{{dog_name}}'s Training",
  "training.today.week_day": "Week {{week}}, Day {{day}}",
  "gamification.gbs.label": "Good {{gender_title}} Score",
  "gamification.gbs.gender.boy": "Boy",
  "gamification.gbs.gender.girl": "Girl",
  "gamification.gbs.gender.pup": "Pup"
}
```

### Language Detection & Selection

**On first launch**:
1. Read device locale via `expo-localization.getLocales()`
2. Match against supported languages (exact match first, then language-only match)
3. Fallback: English (`en`)
4. Store selected language in Zustand + AsyncStorage + user profile (synced to backend)

**User override**:
- Settings → Language → picker showing all supported languages
- Change takes effect immediately (no app restart required)
- Buddy acknowledges in new language: "¡Hola! Ahora hablaré en español."

```ts
// Language resolution
const resolveLanguage = (): string => {
  // 1. User explicitly selected?
  if (userPreference.language) return userPreference.language;
  
  // 2. Device language supported?
  const deviceLocales = getLocales();
  for (const locale of deviceLocales) {
    // Exact match (pt-BR)
    if (SUPPORTED_LANGUAGES.includes(locale.languageTag)) return locale.languageTag;
    // Language-only match (pt)
    if (SUPPORTED_LANGUAGES.includes(locale.languageCode)) return locale.languageCode;
  }
  
  // 3. Fallback
  return 'en';
};
```

---

## 5. Content Localization Strategy

### Layer 1: UI Strings (~2,000 strings)

Everything the user sees in the interface: buttons, labels, headers, error messages, Buddy's scripted dialogue (onboarding reactions, gamification celebrations, notifications), paywall copy, achievement names and descriptions, level titles.

**Translation method**: Professional translator (native speaker) + machine translation for first pass, then human review.

**Turnaround**: 5-7 business days per language for initial set. Ongoing: new strings translated within 48 hours.

**Tool**: Crowdin or Lokalise — syncs with GitHub, supports react-i18next format, provides translation memory (reduces repeat work), supports context screenshots (translators see WHERE the string appears).

### Layer 2: Training Content (~160-180 exercises, 30-40 tricks)

This is the critical layer. Training instructions must be:
- Linguistically accurate (correct verbs, clear instructions)
- Culturally appropriate (training terminology varies by country)
- Tonally consistent (Buddy's personality should carry across languages)

**Translation method**: Professional translation ONLY. No machine translation for training content. Translator must have dog training knowledge or be paired with a dog trainer who reviews.

**Content structure for translation**:

```json
{
  "exercise_id": "potty_cue_word",
  "title": { "en": "Cue Word Introduction", "es": "Introducción de Palabra Clave", "fr": "..." },
  "overview": { "en": "Teach {dog_name} to associate a cue word with going potty...", "es": "..." },
  "steps": [
    { "en": "Take {dog_name} to the designated potty spot...", "es": "..." },
    { "en": "As {dog_name} starts to go, say your cue word...", "es": "..." }
  ],
  "success_criteria": { "en": "{dog_name} begins to associate...", "es": "..." },
  "pro_tips": [
    { "en": "For {breed}s, consistency is especially important...", "es": "..." }
  ],
  "common_mistakes": [
    { "en": "Don't say the cue word BEFORE {dog_name} starts...", "es": "..." }
  ]
}
```

**Turnaround**: 2-3 weeks per language for full exercise library. Ongoing: new exercises translated within 5 business days.

### Layer 3: AI Buddy Chat

Buddy's AI chat responses are generated by Claude Sonnet 4.6 (via buddy-chat Supabase edge function). These do NOT need pre-translation — the model responds in whatever language the user writes in.

**Implementation**:
- Add language directive to Buddy's system prompt: `"Always respond in {{user_language}}. The user's name is {{user_name}} and their dog's name is {{dog_name}}."`
- Context injection (plan data, health data, gamification) remains in English internally — the model translates at response time
- Buddy's personality descriptors are translated in the system prompt so the model understands the character in that language

**Quality control**:
- Monitor chat quality per language via user ratings
- If average rating in a language drops below 3.5/5, investigate and refine system prompt
- Some models perform better in certain languages — benchmark before launch

### Layer 4: Breed Names & Terminology

Breed names are generally consistent internationally but some vary:
- German Shepherd = Berger Allemand (French) = Pastor Alemán (Spanish)
- Golden Retriever = same in most languages

**Approach**: Maintain a breed translation table:

```
breed_translations {
  breed_id: string
  locale: string
  display_name: string
  common_aliases: array of string
}
```

This also applies to training terminology (some countries use different words for "heel," "stay," "leave it").

### Layer 5: Push Notification Templates

All notification templates from PRD-09 need translation. These are handled through OneSignal's multi-language support — you set the language tag on the user record, and OneSignal delivers the correct variant.

**Token replacement still works**: `"{{dog_name}}'s training is ready!"` → `"¡El entrenamiento de {{dog_name}} está listo!"`

### Layer 6: App Store Listings (ASO)

Each target language needs:
- App name / subtitle (localized keyword optimization)
- Full description (localized)
- Keywords field (researched per-language using AppTweak or Sensor Tower)
- Screenshots with localized UI (regenerated per language)
- Preview video with localized captions (if applicable)

**Tool**: AppTweak or Sensor Tower for keyword research per locale.

---

## 6. Pricing Localization

### Regional Pricing Strategy

Apple and Google support regional pricing tiers. PupPal should NOT use a single USD price converted — it should set explicit prices per market.

| Market | Annual | Monthly | Rationale |
|--------|--------|---------|-----------|
| US / Canada | $39.99 | $9.99 | Base pricing |
| UK | £34.99 | £8.99 | Slight PPP adjustment |
| EU (Germany, France, Italy) | €39.99 | €9.99 | EUR parity |
| Spain / Portugal | €34.99 | €8.99 | Lower PPP in Iberia |
| Brazil | R$99.90 | R$24.90 | Significant PPP adjustment — still premium positioning |
| Mexico | MXN 399 | MXN 99 | Adjusted for local purchasing power |
| Japan | ¥4,800 | ¥1,200 | Standard app tier |

### A/B Testing Regional Prices

Use Superwall to test regional pricing variants. Track revenue per paywall view (not just conversion rate) to find the revenue-maximizing price per market.

### Currency Display

- Paywall shows local currency symbol and amount (RevenueCat provides this from the store)
- Never show USD with a conversion — always native currency

---

## 7. Cultural Adaptation

### Units & Formats

| Element | US | EU / Latin America | Japan |
|---------|----|--------------------|-------|
| Weight | lbs | kg | kg |
| Temperature | °F | °C | °C |
| Date | MM/DD/YYYY | DD/MM/YYYY | YYYY/MM/DD |
| Time | 12-hour (AM/PM) | 24-hour | 24-hour |
| Distance | miles | km | km |

**Implementation**: Store user preference (auto-detected from locale, overridable in Settings). All data stored in metric internally, converted at display time.

### Vaccination Schedules

Vaccination protocols differ by country:
- US follows AAHA guidelines
- EU follows WSAVA guidelines (mostly aligned but some differences)
- Brazil has rabies-specific requirements by state

**Implementation**: PRD-05 health tracker vaccination templates should be locale-aware. Store vaccination protocols per region:

```
VaccinationProtocol {
  id: UUID
  region: string           // "US", "EU", "BR", etc.
  vaccine_name: string
  vaccine_name_localized: JSON  // {"en": "Rabies", "es": "Rabia", ...}
  recommended_age_weeks: integer
  required_by_law: boolean
  booster_interval_months: integer (nullable)
  notes_localized: JSON
}
```

### Breed Popularity Adjustments

Onboarding default breed suggestions should reflect local popularity:
- US: Golden Retriever, French Bulldog, Labrador
- Germany: German Shepherd, Dachshund, Labrador
- France: Berger Australien, Golden Retriever, Cavalier King Charles
- Brazil: Shih Tzu, Yorkshire Terrier, Golden Retriever

**Implementation**: Breed detection model remains universal (breeds don't change by country). But the manual breed picker should sort by regional popularity first.

### Legal Compliance

| Requirement | Markets | Implementation |
|-------------|---------|----------------|
| GDPR consent | EU + UK | Explicit opt-in for analytics, clear data export/deletion |
| Cookie/tracking consent | EU | Show consent prompt before analytics SDK init |
| Age verification | Germany (strict) | Age confirmation gate if required |
| Right to deletion | EU (GDPR), Brazil (LGPD), California (CCPA) | Already in PRD-14 — ensure it works for all regions |
| Data residency | EU (some cases) | Supabase region selection (EU project for EU users) |
| App Store legal text | All | Translated Terms of Service and Privacy Policy |

---

## 8. Localization Workflow

### For New Content (Ongoing)

```
1. Content created in English (source of truth)
2. Pushed to Crowdin/Lokalise via GitHub integration
3. Translators notified automatically
4. Translation completed + peer-reviewed
5. Reviewed translations merged back to repo
6. QA: screenshot comparison (English vs localized) for UI strings
7. QA: native speaker spot-check for training content
8. Deploy
```

### For New Languages (Adding a language)

```
1. Decision: language meets criteria (search volume, competitor presence, translator available)
2. Export full string catalog + content library to translation platform
3. Professional translation: UI strings (1 week), training content (2-3 weeks), App Store (3 days)
4. QA: full app walkthrough in new language by native speaker
5. Regional pricing configured in App Store Connect + Google Play Console
6. Vaccination protocols configured for target markets
7. Feature-flag rollout: 10% → 50% → 100% of users with matching locale
8. ASO keywords optimized, App Store screenshots generated
9. Marketing: announce on social, notify existing users with matching device language
```

### Translation Quality Assurance

- Every translated exercise reviewed by a second translator
- Buddy chat tested with 20 sample conversations per language before launch
- Monthly quality audits: random sample of 10 exercises per language, scored by native speaker
- User feedback channel: in-app "Report Translation Issue" button (Settings → Language → Report Issue)

---

## 9. Data Model

### User Profile Extensions

```
-- Added to User table
locale: string                    // e.g., "es", "fr", "de", "pt-BR"
locale_source: enum (device / manual)  // how language was set
region: string                    // e.g., "US", "EU", "BR", "JP"
units_weight: enum (lb / kg)
units_temperature: enum (f / c)
date_format: enum (mdy / dmy / ymd)
time_format: enum (12h / 24h)
currency: string                  // ISO 4217 (USD, EUR, BRL, etc.)
```

### Translation Content Table

```
ContentTranslation {
  id: UUID
  content_type: enum (exercise / trick / achievement / breed_profile / notification_template)
  content_id: UUID                 // FK to source content
  locale: string                   // "es", "fr", etc.
  field_name: string               // "title", "overview", "step_1", etc.
  translated_text: text
  translator_id: string (nullable)
  reviewed_by: string (nullable)
  reviewed_at: timestamp (nullable)
  status: enum (pending / translated / reviewed / published)
  created_at: timestamp
  updated_at: timestamp
}
```

### Breed Translation Table

```
BreedTranslation {
  breed_id: string
  locale: string
  display_name: string
  common_aliases: array of string  // Alternative names used in that language
}
```

### Vaccination Protocol Table

```
VaccinationProtocol {
  id: UUID
  region: string
  vaccine_key: string              // Internal identifier
  display_name: JSON               // Localized names
  description: JSON                // Localized descriptions
  recommended_age_weeks: integer
  required_by_law: boolean
  booster_interval_months: integer (nullable)
  notes: JSON                      // Localized notes
}
```

---

## 10. Buddy AI Chat — Language-Specific System Prompt

### Base Pattern

```
You are Buddy, a warm and friendly AI puppy training mentor.

LANGUAGE RULES:
- Always respond in {{user_language}} ({{language_name}}).
- Use natural, conversational {{language_name}} — not formal or robotic.
- Use culturally appropriate expressions and idioms.
- Training terminology should match standard {{language_name}} dog training vocabulary.
- The dog's name is {{dog_name}} — use it naturally, as a native speaker would.
- If the user writes in a different language, gently respond in your set language 
  but acknowledge: "I noticed you wrote in [language] — I'm set up to help in 
  [user_language], but let me know if you'd like to switch!"

PERSONALITY (same across all languages):
- Warm, encouraging, knowledgeable
- Use the dog's name frequently
- Celebrate small wins
- Never shame or blame
- Refer to training plan context when relevant
```

### Language-Specific Personality Notes

**Spanish (es)**: Use "tú" form (informal), not "usted" — the user is a friend, not a client. Use the diminutive naturally ("perrito" instead of "perro" for puppies).

**French (fr)**: Use "tu" form (informal). Incorporate natural French dog training terms ("assis" for sit, "couché" for down, "au pied" for heel).

**German (de)**: Use "du" form. German speakers expect precise instructions — Buddy can be slightly more structured while staying warm. Standard German training commands: "Sitz," "Platz," "Hier," "Bleib."

**Portuguese (pt-BR)**: Brazilian Portuguese, not European. Use "você" form. Warm and expressive — Brazilian culture appreciates enthusiasm. Training commands: "Senta," "Deita," "Fica."

**Italian (it)**: Use "tu" form. Italian dog training terminology: "Seduto," "Terra," "Resta," "Vieni."

---

## 11. App Store Optimization (ASO) Per Language

### Keyword Research Per Locale

Each language needs dedicated ASO keyword research. Target terms:

| English Term | Research in each language |
|-------------|--------------------------|
| puppy training app | Direct translation + local variations |
| dog training | Broader term |
| puppy potty training | Specific pain point (high intent) |
| teach dog tricks | Trick content angle |
| puppy obedience | Obedience angle |
| dog training AI | Tech differentiator |
| [breed] training | Top 10 breeds per country |

### Localized Screenshots

Generate new screenshots per language showing:
- Localized UI text
- Locally popular breed photos (Dachshund for Germany, Shih Tzu for Brazil)
- Local currency on paywall screenshot
- Buddy speaking in the local language

---

## 12. Integration Points

### With Onboarding (PRD #01)
- All Buddy dialogue localized
- Breed picker sorted by regional popularity
- Age picker labels translated
- Paywall shows local currency and pricing

### With Training Plan (PRD #03)
- Exercise content served from ContentTranslation table
- Token replacement ({dog_name}, {breed}) works in all languages
- Breed-specific tips localized

### With AI Chat (PRD #02)
- System prompt includes language directive
- Context injection data remains English internally (model handles translation)
- Suggested prompts translated

### With Health Tracker (PRD #05)
- Vaccination schedules region-specific
- Weight displayed in locale-appropriate units
- Date formats localized

### With Gamification (PRD #04)
- Achievement names and descriptions translated
- Level titles translated
- Good Boy/Girl/Pup Score label localized
- Share cards generated with localized text

### With Push Notifications (PRD #09)
- OneSignal delivers language-specific variants
- Notification tokens resolve in correct language

### With Paywall (PRD #06)
- Superwall supports localized paywall variants
- RevenueCat returns locale-appropriate pricing from the store

### With Referral System (PRD #08)
- Share cards generated in user's language
- Referral landing page auto-detects visitor language

### With Analytics (PRD #13)
- Track all metrics segmented by locale
- Funnel analysis per language (identify translation-quality issues)
- Revenue dashboards broken down by market/currency

---

## 13. Analytics Events

```
// Language
locale_detected               { device_locale, resolved_locale, source }
locale_changed                { from_locale, to_locale, source: device | manual }
locale_mismatch               { device_locale, app_locale }  // user overrode device

// Translation Quality
translation_issue_reported    { content_type, content_id, locale, user_comment }
buddy_chat_language_mismatch  { expected_locale, detected_response_locale }

// Regional Performance
onboarding_completed_by_locale   { locale, duration_seconds }
paywall_conversion_by_locale     { locale, plan_type, price, currency }
exercise_completion_by_locale    { locale, exercise_id, rating }
churn_by_locale                  { locale, subscription_duration_days, reason }

// ASO
app_store_impressions_by_locale  { locale, keyword, impressions }  // from App Store Connect API
```

---

## 14. Edge Cases

| Scenario | Handling |
|----------|----------|
| User changes device language after setup | On next app open, detect mismatch. Show banner: "Your device language changed to [X]. Want to switch PupPal too?" with Yes/No. |
| Supported language but unsupported region (e.g., French speaker in Japan) | Use French UI, but default to WSAVA vaccination protocol and metric units. |
| Exercise not yet translated | Fall back to English for that specific exercise. Show small indicator: "This exercise is in English. Translation coming soon." |
| Buddy responds in wrong language | Log as `buddy_chat_language_mismatch`. Retry with stronger language directive. If persistent, flag for system prompt tuning. |
| RTL languages (Arabic, Hebrew) — future | Not in Phase 1-2. When added, requires layout mirroring. react-native supports RTL via `I18nManager.forceRTL()`. |
| User sends mixed-language message to Buddy | Buddy responds in the user's set language, not the detected message language. |
| Breed detection returns English breed name | Map to localized breed name via BreedTranslation table before displaying. |
| Push notification in wrong language | OneSignal tag `language` must stay synced. On every app open, verify and update if needed. |
| Translator dispute (two valid translations) | Defer to the translator with dog training expertise. Log alternative in translation notes for future review. |
| New exercise added, translations pending | Exercise is visible only in languages where translation status = "published". Hidden in other languages until translated. |

---

## 15. Dependencies

| Dependency | Purpose | Fallback |
|------------|---------|----------|
| react-i18next | Client-side i18n | expo-localization + manual string maps |
| expo-localization | Device locale detection | Manual language selection |
| Crowdin or Lokalise | Translation management platform | Manual JSON file management (painful) |
| Professional translators (5 languages) | Training content translation | Machine translation + native speaker review (lower quality) |
| AppTweak or Sensor Tower | Per-language ASO keyword research | Manual App Store search research |
| Superwall | Localized paywall variants | Hardcoded native paywall per locale |
| OneSignal | Multi-language notification delivery | Separate notification templates per language |
| Supabase | ContentTranslation table, regional vaccination data | Bundled JSON files (no dynamic updates) |
| App Store Connect / Google Play Console | Regional pricing, localized listings | Single-price global (leaves money on the table) |

---

## 16. Rollout Strategy

### Pre-Launch (Before First Localization)

- [ ] Implement react-i18next and extract ALL English strings into translation files
- [ ] Audit codebase for hardcoded strings (there will be some — find them all)
- [ ] Set up Crowdin/Lokalise with GitHub integration
- [ ] Ensure all training content is in structured translatable format (JSON with keys)
- [ ] Add `locale` field to user profile and sync infrastructure
- [ ] Implement unit/date/time preferences (these work even for English users)

### Phase 1 Launch (First 5 Languages)

- [ ] Professional translations complete and reviewed for all 5 languages
- [ ] Regional pricing set in App Store Connect and Google Play Console
- [ ] Vaccination protocols configured for EU + Brazil regions
- [ ] App Store listings localized (description, keywords, screenshots)
- [ ] Buddy system prompts tested with 20+ sample conversations per language
- [ ] Feature-flag rollout: 10% of matching-locale users for 1 week
- [ ] Monitor: onboarding completion, trial conversion, chat quality, crash rate
- [ ] If metrics are healthy: 50% → 100% over next 2 weeks
- [ ] Announce via social, App Store "What's New," email to matching-locale users

### Ongoing

- [ ] Monthly translation quality audits
- [ ] Quarterly ASO keyword refresh per language
- [ ] New content translated within 5 business days of English publication
- [ ] Regional pricing reviewed quarterly (currency fluctuations, A/B test results)

---

## 17. Acceptance Criteria

- [ ] App detects device language and auto-selects supported language on first launch
- [ ] User can manually change language in Settings → Language
- [ ] Language change takes effect immediately without app restart
- [ ] All UI strings display correctly in all 5 Phase 1 languages (no English leakage)
- [ ] All 160+ exercises display correctly in all 5 languages with token replacement
- [ ] All 30-40 tricks display correctly in all 5 languages
- [ ] Buddy AI chat responds consistently in user's set language
- [ ] Buddy personality and tone are consistent across all languages
- [ ] Onboarding flow works end-to-end in all languages (tested per language)
- [ ] Paywall shows local currency and correct regional pricing
- [ ] Vaccination schedules load correct regional protocols
- [ ] Weight, temperature, date, and time display in locale-appropriate formats
- [ ] Push notifications deliver in correct language per user
- [ ] Share cards (achievements, streaks, GBS) generate with localized text
- [ ] Breed names display in user's language throughout the app
- [ ] App Store listings live in all 5 languages with localized screenshots
- [ ] Fallback to English works gracefully for untranslated content
- [ ] "Report Translation Issue" button works and creates trackable ticket
- [ ] Analytics segment correctly by locale for all key metrics
- [ ] No hardcoded English strings remain in UI-facing code
- [ ] RTL is NOT supported yet but app does not crash if device is set to RTL language
