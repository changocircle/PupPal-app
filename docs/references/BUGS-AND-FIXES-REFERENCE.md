# PupPal Bugs and Fixes Reference
> Every significant bug encountered and how it was resolved. Prevents re-introducing old issues.

## Critical Patterns to Never Break

### 1. Zustand Selector Pattern (PR #6, #7, #8, #9)
**Problem:** Inline .filter()/.map()/.find() in Zustand selectors create new arrays every render, causing infinite re-render loops.
**Fix:** Always select raw property, then useMemo for derived data.
**Also:** Never import hooks you don't use. Dead useSubscription import in medications.tsx caused the render loop (commit b74e5fa).

### 2. activeDog() Selector Sweep (PR #6)
**Problem:** activeDog() selector across 27 files was causing cascading re-renders.
**Fix:** PR #6 did a definitive sweep replacing all activeDog() with targeted scalar selectors.

### 3. Button.tsx Text Leak (PR #1, #4, #17)
**Problem:** "Text strings must be rendered within a <Text> component" error. Caused by leftIcon="emoji" passing raw string into a View.
**Fix:** Button now wraps string icons in Typography component.
**Note:** This bug came back twice. Always check Button when adding new icon props.

## Bugs Fixed by PR

### PR #17: Testing Round 1 (11 fixes)
1. **Chat too long** - max_tokens 500->200, word limit 80->50 words, post-processing truncation at 400 chars
2. **Button.tsx text leak** - string icons wrapped in Typography
3. **Journal crash** - entry.date?.slice null guard
4. **Vaccination setup not triggering** - getUpcomingEvents gated behind vaccinationSetupComplete
5. **Breed detection UI** - "Actually, they're a..." -> "Change breed" with padding
6. **Buttons cut off** - health screen headers: flex-1 flex-shrink on left, flex-shrink-0 on button
7. **Keyboard covering inputs** - KeyboardAvoidingView added to all form screens
8. **Date pickers** - native pickers replace text input (weight, medications, vet visits)
9. **Reminders** - ReminderPicker component (4 options), uses expo-notifications
10. **Missing nav** - Manage Dogs card in profile, language selector in preferences
11. **Home screen overwhelm** - first session: Buddy welcome, compact gamification, hero exercise

### PR #18: Testing Round 2 (6 fixes)
1. **Multi-dog UX** - DogSwitcherButton on plan, health, chat, profile (not just home)
2. **Breed detection** - full prompt rewrite with 7-step feature analysis, image quality 1.0
3. **Mixed breed** - "My dog is a mixed breed" button + free-text breed entry
4. **Second dog vaccinations** - stores rehydrate on dog switch
5. **Language toast** - "Coming soon!" alert on non-English selection
6. **Medications UI** - Button flex conflicts fixed, frequency pills wrap

### PR #19: Multi-Photo + Round 2b
- Multi-photo (1-3 slots with silhouette guides: Front face / Side profile / Full body)
- Chain-of-thought prompt (Observe -> Identify -> Verify)
- Reasoning field logged server-side only
- max_tokens 300->800, timeout 15->30s Anthropic, 20->35s client
- Manage Dogs screen (list all dogs, tap to switch, Add Another Dog with premium gate)
- First dog auto-registration (fixes dog not appearing in switcher)
- Vet visits + weight tracker spacing
- Add-dog photo circles sizing

### PR #20: Testing Round 3 (5 fixes)
1. **Multi-photo state update** - updateData moved out of setPhotoUris updater (render-during-update error)
2. **Identical plans for both dogs** - plan generation now reads from active dog's data, not onboardingData
3. **Milestones missing for second dog** - ageWeeks derived from active dog, not first dog
4. **Multi-dog chat context** - Buddy's system prompt includes ALL dogs
5. **Exercise completion animation** - all spring/bounce replaced with 200ms FadeIn/FadeInDown

### PR #21: Training Plan UX (5 fixes)
1. **Star ratings not persisting** - onRate callback was a no-op. Added rateExercise() to store.
2. **Low rating re-practice** - 1-2 stars auto-reschedule with "Practice again" badge
3. **Duplicate XP guard** - confirmed working (checks status === 'completed')
4. **Week unlock tiers** - Free: Wk1 only, Monthly: sequential, Annual: all open, Dev: all open
5. **Completion animation** - confirmed springs replaced with clean fades

### PR #22: Testing Round 4 (4 fixes, 23 files)
1. **DOB date picker** - Native DateTimePicker in manage dog screen. Estimates DOB from age_months_at_creation.
2. **Low-rating UX** - CompletionModal: "Practice makes perfect!" + "No worries, this will come back for practice" for 1-2 star ratings.
3. **XP -> Paw Points** - All user-facing "XP" replaced with "points"/"Paw Points". GamificationRow, DailyXpBar, AchievementUnlock, XpFloatUp, WeeklyChallengeCard, CompletionModal, home, profile, achievements, referral, tricks. Internal vars stay `xp`. "Lv.1" dropped, levelTitle shown directly.
4. **Week unlock** - useSubscription: dev override = annual tier. Clear free/monthly/annual visual hierarchy.

### PR #23: Multi-Photo Validation (5 changes, 9 files)
1. **Same-dog validation** - breed-detect multi-photo prompt now has Step 0: check all photos are same dog. Returns `{ error: "different_dogs" }` if not.
2. **Dog photo storage** - New `src/lib/dogPhotos.ts` with saveDogPhotos/loadDogPhotos/deleteDogPhotos. AsyncStorage keyed by dog ID.
3. **Manage dog photos** - Dog manage screen loads and displays stored photos.
4. **Onboarding photos** - Saved via dogPhotos utility after breed detection.
5. **Add-dog photos** - Same photo storage for additional dogs.

## Known Remaining Issues
- breed-detect has no rate limiting (buddy-chat and vaccine-extract do)
- Edge functions don't verify Supabase JWT (anon key allows unauthenticated calls)
- moderate-content not yet built (will use Anthropic when implemented)
- authStore has no persistence (may be intentional)
- Admin dashboard: RLS on admin_users disabled, sidebar sign-out fix pending, ignoreBuildErrors: true
