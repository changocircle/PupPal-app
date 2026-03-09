# PupPal App Store Submission Checklist

Use this checklist end-to-end: from Apple Developer approval through going live.

---

## Prerequisites

- [ ] Apple Developer account approved (enrollment ID: `5J4UG739H5`)
- [ ] EAS CLI installed: `npm install -g eas-cli`
- [ ] Logged into EAS: `eas login` (changocircle org account)
- [ ] RevenueCat IAP configured (App Store products created + wired in app)
- [ ] Apple Sign-In implemented (`expo-apple-authentication` + Supabase Apple OAuth)
- [ ] TestFlight internal testing completed (at least 1 round on physical device)
- [ ] All critical bugs from QA report resolved (see braindump v9 section 21)

---

## App Store Connect Setup

### Create App Record
- [ ] App Store Connect > My Apps > `+` > New App
- [ ] Platform: iOS
- [ ] App Name: `PupPal - AI Puppy Training`
- [ ] Primary Language: English (U.S.)
- [ ] Bundle ID: `com.puppal.app`
- [ ] SKU: `puppal-ios-001`
- [ ] User Access: Full Access

### Register Bundle ID
- [ ] developer.apple.com > Certificates, Identifiers & Profiles > Identifiers
- [ ] Register new App ID: `com.puppal.app`
- [ ] Capabilities to enable:
  - [ ] Push Notifications
  - [ ] Sign In with Apple
  - [ ] In-App Purchase (auto-enabled)

---

## App Information Tab

- [ ] App name: `PupPal - AI Puppy Training`
- [ ] Subtitle: `Train Smarter with Your AI Mentor`
- [ ] Bundle ID: `com.puppal.app`
- [ ] Primary Language: English (U.S.)
- [ ] Primary Category: **Lifestyle**
- [ ] Secondary Category: **Education**
- [ ] Age Rating questionnaire completed → result: **4+**
  - All content categories: None
  - Unrestricted web access: No
  - In-App Purchases: Yes

---

## Pricing and Availability

- [ ] Price: **Free**
- [ ] Availability: All countries (or select target markets)

---

## In-App Purchases

Create subscription group and products **before** uploading build (required for paywall testing in TestFlight).

### Subscription Group
- [ ] Group name: `PupPal Premium`
- [ ] Localization: English (U.S.)

### Products
- [ ] **Annual Plan**
  - Product ID: `annual_39_99`
  - Type: Auto-Renewable Subscription
  - Duration: 1 Year
  - Price: $39.99
  - Display Name: `PupPal Annual`
  - Free Trial: 7 days

- [ ] **Monthly Plan**
  - Product ID: `monthly_9_99`
  - Type: Auto-Renewable Subscription
  - Duration: 1 Month
  - Price: $9.99
  - Display Name: `PupPal Monthly`

- [ ] RevenueCat: both products imported and mapped to `premium` entitlement
- [ ] `REVENUECAT_APPLE_API_KEY` added to `.env` in app

---

## Version Information (v1.0.0)

### Metadata
- [ ] Version number: `1.0.0`
- [ ] Description (4000 chars): copy from `docs/app-store-metadata.md`
- [ ] Promotional text (170 chars): copy from `docs/app-store-metadata.md`
- [ ] Keywords (100 chars): `puppy training,dog trainer,puppy care,dog obedience,AI dog,puppy tips,dog health,new puppy,clicker`
- [ ] What's New text: copy from `docs/app-store-metadata.md`
- [ ] Support URL: `https://puppal.dog`
- [ ] Marketing URL: `https://puppal.dog`
- [ ] Privacy Policy URL: `https://puppal.dog/privacy`

### Screenshots (All 3 required sizes)
- [ ] **6.7" screenshots (1290 x 2796 px)** — 10 uploaded
- [ ] **6.5" screenshots (1284 x 2778 px)** — 10 uploaded
- [ ] **5.5" screenshots (1242 x 2208 px)** — 10 uploaded

See `docs/screenshot-spec.md` for exactly what to capture for each of the 10 slots.

---

## Build Upload

- [ ] Production build created via EAS: `eas build --platform ios --profile production`
- [ ] Build passes App Store processing (15-30 min after upload)
- [ ] Build visible in App Store Connect
- [ ] Correct build selected for this version

---

## Review Information

- [ ] First Name: `Ashley`
- [ ] Last Name: `Kemp`
- [ ] Email: `hello@ashkemp.com`
- [ ] Phone: *(optional)*
- [ ] Demo account notes:
  ```
  No demo account needed. Onboarding creates a fresh account in under 2 minutes.
  Start at the welcome screen and complete the flow. No pre-existing account required.
  ```
- [ ] Notes for reviewer:
  ```
  This is an AI puppy training app. All AI features (Buddy chat, breed detection)
  use authenticated API calls. The paywall offers a 7-day free trial — no charge
  occurs during review. IAP products: annual_39_99 ($39.99/yr) and monthly_9_99
  ($9.99/mo).
  ```

---

## Technical Checks

- [ ] Privacy Manifest in `app.json` (`expo.ios.privacyManifests`) — done in this PR
- [ ] Export Compliance: No encryption beyond standard HTTPS — select "No" or "Exempt"
- [ ] App Transport Security: HTTPS enforced (Expo default)
- [ ] Third-party SDK privacy disclosures:
  - [ ] PostHog: analytics, no advertising
  - [ ] Sentry: crash reporting, no advertising
  - [ ] RevenueCat: purchase history (required for IAP)
- [ ] Push notification entitlement matches provisioning profile
- [ ] Sign In with Apple entitlement added to App ID

---

## Final Pre-Submit Check

- [ ] App icon is 1024x1024 PNG with no transparency or alpha channel
- [ ] Splash screen looks correct on 6.7" and 5.5" simulators
- [ ] All screenshots match current app UI (not old designs)
- [ ] No placeholder text in any metadata field
- [ ] Privacy policy URL loads correctly: https://puppal.dog/privacy
- [ ] Support URL loads correctly: https://puppal.dog
- [ ] `app.json` version matches version submitted (1.0.0 / build 1)
- [ ] No test/debug code in production build (`__DEV__` guards in place)
- [ ] Sentry DSN configured for production
- [ ] PostHog API key configured for production

---

## EAS Build and Submit Commands

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Authenticate (changocircle account)
eas login

# First-time project setup (sets up credentials, provisioning)
eas build:configure

# --- TestFlight ---

# Build for TestFlight (internal testing)
eas build --platform ios --profile preview

# Submit latest build to TestFlight
eas submit --platform ios --latest

# --- App Store ---

# Production build
eas build --platform ios --profile production

# Submit to App Store Connect
eas submit --platform ios --latest

# Or submit a specific build by ID
eas submit --platform ios --id <BUILD_ID>

# Build + submit in one command (after ASC API key is configured in eas.json)
eas build --platform ios --profile production --auto-submit
```

---

## Post-Submission

- [ ] Click "Submit to App Review" in App Store Connect
- [ ] Monitor review status (typically 24-48 hours for v1)
- [ ] Respond to any App Review questions within 24 hours
- [ ] Set release: "Release Automatically" after approval
- [ ] Announce launch

---

## Useful Links

| Resource | URL |
|---------|-----|
| App Store Connect | https://appstoreconnect.apple.com |
| Apple Developer Portal | https://developer.apple.com |
| EAS Build Dashboard | https://expo.dev/accounts/changocircle |
| RevenueCat Dashboard | https://app.revenuecat.com |
| App Review Guidelines | https://developer.apple.com/app-store/review/guidelines/ |
