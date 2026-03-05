# PRD #14: Settings & Preferences

## PupPal — User Control Center

**Document version**: 1.0
**Priority**: P2 — Settings are unsexy but essential. Bad settings UX causes support tickets, bad reviews, and churn from users who can't find basic controls.

---

## 1. Overview

The Settings screen (accessible from Profile tab) consolidates all user controls: account management, dog management, subscription, notifications, app preferences, data/privacy, and support.

---

## 2. Settings Screen Structure

```
┌─────────────────────────────┐
│  Profile & Settings          │
│                              │
│  ┌───┐                      │
│  │📷 │ Ashley               │  ← User photo/initial + name
│  └───┘ Premium · Annual     │  ← Subscription badge
│                              │
│  MY DOGS                     │
│  ┌─────────────────────────┐ │
│  │ 📷 Luna · Golden · Wk 3 │ │  ← Active dog (highlighted)
│  │ 📷 Max · Frenchie · Wk 1│ │
│  │ + Add Dog                │ │
│  └─────────────────────────┘ │
│                              │
│  ACCOUNT                     │
│  Edit Profile →              │
│  Subscription →              │  ← PRD-06 subscription management
│  Invite Friends →            │  ← PRD-08 referral
│                              │
│  PREFERENCES                 │
│  Notifications →             │  ← PRD-09 notification settings
│  Training Reminder Time →    │  ← Quick access to reminder time
│  Units (lbs/kg) →            │
│  Theme (Light) →             │  ← Light only in v1
│                              │
│  SUPPORT                     │
│  Help Center →               │
│  Contact Support →           │
│  Rate PupPal →               │  ← App Store rating prompt
│  Share Feedback →            │
│                              │
│  LEGAL                       │
│  Privacy Policy →            │
│  Terms of Service →          │
│  Data & Privacy →            │  ← Export/delete data
│                              │
│  ABOUT                       │
│  Version 1.0.0 (42)         │
│  Made with ❤️ for puppies    │
│                              │
│  ┌─────────────────────────┐ │
│  │      Sign Out            │ │  ← Destructive, confirmation
│  └─────────────────────────┘ │
│                              │
│  Delete Account              │  ← Caption link, red, double confirm
└─────────────────────────────┘
```

---

## 3. Edit Profile

```
┌─────────────────────────────┐
│  ← Edit Profile              │
│                              │
│  ┌───┐                      │
│  │📷 │ Change Photo         │
│  └───┘                      │
│                              │
│  Display Name                │
│  ┌─────────────────────────┐ │
│  │ Ashley                  │ │
│  └─────────────────────────┘ │
│                              │
│  Email                       │
│  ┌─────────────────────────┐ │
│  │ ashley@email.com        │ │  ← From Apple/Google sign-in
│  └─────────────────────────┘ │
│  (Managed by Apple Sign-In)  │
│                              │
│  [Save Changes]              │
└─────────────────────────────┘
```

Email is read-only if from Apple/Google sign-in (auth provider manages it).

---

## 4. Dog Profile Edit

Tap any dog in "My Dogs" section:

```
┌─────────────────────────────┐
│  ← Luna's Profile            │
│                              │
│  ┌───┐ Change Photo         │
│  │📷 │                      │
│  └───┘                      │
│                              │
│  Name:      [Luna          ]│
│  Breed:     [Golden Retriev]│  ← Tap opens breed selector
│  Sex:       [Female  ▾     ]│
│  Birthday:  [Dec 1, 2025   ]│  ← Date picker
│  Weight:    [18.5 lbs      ]│
│                              │
│  ⚠️ Changing breed will      │
│  regenerate Luna's plan.     │
│  Progress is preserved.      │
│                              │
│  [Save Changes]              │
│                              │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─     │
│                              │
│  Archive Luna →              │  ← Subtle, bottom
│  Delete Luna's Data →        │  ← Red text, double confirm
└─────────────────────────────┘
```

---

## 5. Units & Preferences

```
Weight Units:     [lbs ●] [kg ○]
Temperature:      [°F  ●] [°C ○]
```

Stored on user record. Applied everywhere (weight tracker, breed info, health).

---

## 6. Data & Privacy

```
┌─────────────────────────────┐
│  ← Data & Privacy            │
│                              │
│  YOUR DATA                   │
│  Export All Data →            │  ← JSON download of all user data
│  Export Health Records →      │  ← PDF (PRD-05)
│                              │
│  PRIVACY                     │
│  Analytics                   │  [ON/OFF]  ← Opt out of PostHog
│  Session Recording           │  [ON/OFF]  ← Opt out of replay
│  Personalized Notifications  │  [ON/OFF]  ← OneSignal targeting
│                              │
│  DELETE                      │
│  Delete Account & All Data → │  ← Red, double confirm + password
│                              │
│  We never sell your data.    │
│  Read our Privacy Policy →   │
└─────────────────────────────┘
```

### Data Export

Edge Function generates JSON file with all user data:
- Profile info
- Dog profiles
- Training plan and completions
- Chat history (messages only, not Buddy system prompts)
- Health records
- Journal entries (with photo URLs)
- Gamification stats and achievements
- Subscription history

Required by GDPR and CCPA. Export within 48 hours (immediate for small accounts).

### Account Deletion

1. User taps "Delete Account"
2. Confirmation: "This will permanently delete your account, all dogs, training data, health records, photos, and chat history. This cannot be undone."
3. Second confirmation: type "DELETE" to confirm
4. Process: queue deletion job (Edge Function)
5. Immediate: sign out, disable account
6. Within 24 hours: purge all data from database and storage
7. Within 30 days: purge from backups
8. RevenueCat: cancel any active subscription
9. OneSignal: remove user
10. PostHog: anonymize historical events

Required by Apple App Store and GDPR.

---

## 7. Support

### Help Center

Link to external help center (Notion, Intercom, or simple web FAQ). Topics:
- Getting started / onboarding
- Training plan questions
- Buddy / AI chat
- Subscription & billing
- Health tracker
- Technical issues
- Account & privacy

### Contact Support

- Email: support@puppal.app
- In-app form: subject, description, optional screenshot
- Auto-attach: app version, device, OS, subscription status, dog breed (for context)

### Rate PupPal

Show native App Store / Play Store rating prompt. Trigger strategically:
- After completing 5th exercise (engaged user)
- After achievement unlock (positive moment)
- After Day 7 of subscription (committed user)
- Max 1 prompt per 90 days
- Never after a bug or error

Use `expo-store-review` API.

---

## 8. Data Model

```
UserProfile {
  id: UUID (= auth.uid())
  display_name: string
  email: string
  photo_url: string (nullable)
  auth_provider: enum (apple/google)
  weight_unit: enum (lbs/kg) (default lbs)
  temperature_unit: enum (f/c) (default f)
  analytics_opted_in: boolean (default true)
  session_replay_opted_in: boolean (default true)
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (nullable)
}
```

---

## 9. Acceptance Criteria

- [ ] Settings screen shows all sections correctly
- [ ] User profile editable (name, photo)
- [ ] Dog profiles editable (all fields)
- [ ] Breed change triggers plan regeneration warning
- [ ] Dog archive and delete work with confirmations
- [ ] Unit preferences apply across entire app
- [ ] Notification settings accessible (→ PRD-09)
- [ ] Subscription management accessible (→ PRD-06)
- [ ] Referral screen accessible (→ PRD-08)
- [ ] Data export generates JSON within 48 hours
- [ ] Account deletion purges all data within 24 hours
- [ ] Account deletion cancels subscription via RevenueCat
- [ ] Privacy toggles disable PostHog/replay/targeting
- [ ] Contact support form sends with device context
- [ ] Rate prompt shows at strategic moments (max 1/90 days)
- [ ] Sign out clears local state and navigates to auth screen
- [ ] Deep links to settings work from notifications
