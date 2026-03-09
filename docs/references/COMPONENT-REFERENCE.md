# PupPal Component Reference
> Key shared components and their patterns.

## UI Components (src/components/ui/)
- **Button.tsx** - Universal button. Wraps string leftIcon in Typography (fixed text leak from PR #17). Supports `fullWidth` prop.
- **Card.tsx** - Styled card container
- **Badge.tsx** - Status badges
- **Input.tsx** - Text input
- **Typography.tsx** - Text component with preset styles
- **ProgressBar.tsx** - Linear progress indicator
- **Skeleton.tsx** - Loading skeletons (Chat, Health, Home, Plan, Profile variants)
- **ErrorBoundary.tsx** - Error catching wrapper
- **PremiumGate.tsx** - Premium feature lock overlay

## Dog Components (src/components/dog/)
- **DogAvatar.tsx** - Dog photo/icon
- **DogSwitcher.tsx** - Bottom sheet showing all dogs + "Add Another Dog"
- **DogSwitcherButton.tsx** - Tap target that opens DogSwitcher (shown on home, plan, health, chat, profile)

## Training Components (src/components/training/)
- **ExerciseCard.tsx** - Shows exercise with star rating for completed, "Practice again" badge for rescheduled
- **CompletionModal.tsx** - Clean 200ms FadeIn (no spring/bounce). Different text for low ratings.
- **WeekCard.tsx** - Shows lock status by tier (free/monthly/annual/dev)
- **DayProgress.tsx** - Daily exercise completion progress
- **PremiumGate.tsx** - Training-specific premium lock

## Gamification Components (src/components/gamification/)
- **GamificationRow.tsx** - Compact single-row display (level + XP + streak)
- **AchievementBadge.tsx** / **AchievementUnlock.tsx** - 200ms FadeIn animations
- **DailyXpBar.tsx** - Daily progress bar
- **ScoreGauge.tsx** - GBS visual gauge
- **StreakFlame.tsx** - Streak fire icon
- **WeeklyChallengeCard.tsx** - Weekly challenge display
- **XpFloatUp.tsx** - "+15 XP" animation (200ms fade)
- **LevelUpOverlay.tsx** - Level up celebration (200ms FadeIn)

## Health Components (src/components/health/)
- **VaccinationTimeline.tsx** - Supports not_logged status (grey, non-alarming)
- **StatusBadge.tsx** - Includes setup_needed variant
- **ReminderPicker.tsx** - 4 options: 1 day before, 1 hour before, on the day, none
- **WeightChart.tsx** - SVG line chart
- **MedicationCard.tsx** - Med display with frequency pills (flex-wrap)
- **QuickAction.tsx** - Health dashboard quick action buttons
- **UpcomingEventCard.tsx** - Gates vaccination events behind vaccinationSetupComplete

## Key Patterns
- All animations: 200ms FadeIn/FadeInDown. NO spring/bounce.
- Zustand: raw selectors + useMemo for derived data
- NativeWind (Tailwind classes) for all styling
- Forms: KeyboardAvoidingView + keyboardShouldPersistTaps="handled"
- Dates: @react-native-community/datetimepicker (never text input for dates)
- Per-dog: effects gated by isSwitching flag
