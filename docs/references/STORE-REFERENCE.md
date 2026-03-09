# PupPal Store Reference
> Quick reference for all 12 Zustand stores, their keys, and relationships.

## 1. onboardingStore
- puppyName, photoUri, breed, DOB (estimated), challenges, experience
- Step tracking for 8-screen flow
- Persisted to AsyncStorage

## 2. trainingStore
- Full 12-week plan (generated per-dog by planGenerator.ts)
- Exercise completions with star ratings
- XP tracking, day/week progression, streak data
- rescheduleForPractice() for 1-2 star ratings
- Per-dog: regenerated on dog switch using active dog's breed/age/challenges

## 3. healthStore
- vaccinationSetupComplete flag (drives 3-path setup flow)
- Vaccinations (with not_logged/overdue/due_soon/upcoming status)
- Medications (add/log/deactivate, 6 categories, 7 frequencies)
- Weight entries (lbs/kg)
- Vet visits (CRUD, 6 types)
- Health notes (4 severity, 5 categories)
- Milestones (per-dog, auto-init by age)
- Per-dog: init effects gated by isSwitching flag

## 4. gamificationStore
- XP, levels, Good Boy Score (GBS)
- 52 achievements with progress tracking
- Streak data + freeze support
- Weekly challenges
- GBS: 5-dimension weighted calc, never-decrease guard

## 5. dogStore
- Dog list, active dog selection
- Per-dog data save/load/switch
- switchDog: saves current dog -> loads target dog -> rehydrates all stores
- First dog auto-registered after onboarding

## 6. chatStore
- Messages (200 max), sessions (50 max), summaries (20 max)
- Free tier counter (3 msgs/day)
- getRecentSummaries(3) injected into Buddy's system prompt

## 7. journalStore
- Manual + auto journal entries
- Photos (1-5 per entry), notes, backdating
- Timeline with month grouping

## 8. settingsStore
- Preferences (units, language selection)
- Notification toggles
- Dev premium override (5-tap easter egg)

## 9. authStore
- User session from Supabase auth
- Onboarding state
- NOT persisted to AsyncStorage (reads from Supabase on launch)

## 10. trickStore
- Per-trick 3-level progress (Learning -> Practiced -> Mastered)
- Pack unlocks tied to training plan progress
- Free trick: Shake

## 11. referralStore
- Referral code generation and share tracking
- Reward tracking (client-side only, no server validation yet)

## 12. uiStore
- UI state (modals, sheets, transient UI flags)
