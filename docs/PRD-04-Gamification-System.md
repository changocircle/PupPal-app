# PRD #04: Gamification System

## PupPal — The Retention Engine

**Document version**: 1.0
**Feature owner**: Ashley
**Status**: Draft
**Priority**: P0 — This is what keeps people coming back daily.

---

## 1. Overview & Purpose

Dog training is a long game. Most owners start motivated, hit a wall around week 2-3, and either push through or give up. The Gamification System bridges that motivation gap.

Four functions:
1. **Daily habit formation** — Streaks and daily XP targets create a reason to open the app every day.
2. **Visible progress** — Good Boy Score gives a concrete number proving effort is working.
3. **Dopamine hits** — Achievement unlocks, XP animations, level-ups create micro-rewards between macro-rewards (the puppy actually learning).
4. **Shareability** — Achievements and milestones are screenshot-worthy. Every share is free marketing.

Every element maps to real training outcomes. XP from real exercises. Streaks from real daily consistency. GBS from real skill progression.

**Inspiration**: Duolingo (streaks, XP), Peloton (milestones), Apple Watch (rings), Cal AI (daily engagement).

### Success Metrics

| Metric | Target | How Measured |
|--------|--------|-------------|
| DAU/MAU ratio | 40%+ | Daily / monthly active |
| Median streak length | 7+ days | Median across active users |
| Streak freeze usage | 30%+ use freeze | Freezes used / streaks broken |
| 7-day retention | 60%+ | Day 7 active / installs |
| 30-day retention | 35%+ | Day 30 active / installs |
| Achievements unlocked | 50%+ unlock 5+ in month 1 | Achievement events / cohort |
| GBS progression | +5 points/week average | Weekly score delta |
| Social shares | 10%+ of milestone users share | Share events / milestones |

---

## 2. User Stories

- **US-1**: As a user, I want to earn XP for completing exercises so I feel accomplishment after every session.
- **US-2**: As a user, I want to maintain a daily streak so I have reason to train even on tough days.
- **US-3**: As a user, I want a Good Boy Score reflecting my dog's overall progress.
- **US-4**: As a user, I want achievements for reaching milestones.
- **US-5**: As a user, I want a level/rank that increases over time.
- **US-6**: As a user, I want to share milestones on social media.
- **US-7**: As a user, I want streak freeze protection so one missed day doesn't destroy motivation.
- **US-8**: As a user, I want weekly challenges for something fresh beyond the daily plan.
- **US-9**: As a user, I want breed comparisons to know if we're on track.
- **US-10**: As a free user, I want to experience gamification during Week 1.

---

## 3. XP (Experience Points) System

### How XP Is Earned

| Action | XP | Notes |
|--------|-----|-------|
| Complete primary exercise | 15 | Core daily exercises |
| Complete reinforcement exercise | 10 | Review exercises |
| Complete bonus exercise | 20 | Optional extras reward more |
| Complete all daily exercises | 25 bonus | "Daily Complete" bonus |
| Rate an exercise | 2 | Incentivize feedback |
| Add notes to exercise | 3 | Incentivize journaling |
| Upload progress photo | 5 | Feed photo journal |
| Ask Buddy a question | 3 | Max 3x/day for XP |
| Complete weekly challenge | 50 | Big weekly reward |
| Achieve weekly milestone | 75 | Plan milestone completion |
| Log health event | 5 | Vaccination, vet visit |
| Refer a friend who signs up | 100 | Growth loop |
| Streak milestone (7/14/30/60/90) | 50-500 | Escalating rewards |

### Daily XP Target

- **Goal: 50 XP/day** (achievable with 2-3 exercises + daily bonus)
- Progress bar on home screen: "32/50 XP today"
- Hitting goal triggers celebration animation
- Exceeding shows bonus XP in different color
- Fixed target (not adaptive) for simplicity

### XP Rules

- XP is never removed (no punishment)
- Permanent regardless of subscription status
- Free users earn during Week 1
- Cannot be purchased (earned only)
- Duplicate completions same day don't earn additional XP
- Idempotent server-side

---

## 4. Streak System

### How Streaks Work

Tracks consecutive days with at least 1 exercise completed.

- 1+ exercise in a calendar day (user timezone) = active day
- Streak increments at midnight after active day
- Missing entire day breaks streak (unless freeze used)
- Resets to 0 on break

### Streak Display

Fire emoji + "[X]-day streak" prominent on home screen.

**Visual escalation**:
- 1-6 days: Small flame, standard color
- 7-13: Medium flame, warmer
- 14-29: Larger, orange glow
- 30-59: Animated, pulsing
- 60-89: Blue/purple (rare)
- 90+: Special animated with particles (elite)

**Milestones**: Celebrations at 7, 14, 30, 60, 90, 180, 365 days. Each triggers achievement + shareable card.

### Streak Freeze

- 1 free freeze per week (resets Monday)
- Auto-applies at midnight on missed day if available
- Push next morning: "Streak freeze used! Your [X]-day streak is safe."
- Freeze does NOT earn XP for that day
- Additional freezes earnable through achievements (not purchasable)

### Streak Break Recovery

- Buddy: "Your streak reset, but [Name]'s progress didn't! Every day is a fresh start."
- Show previous longest streak: "Your best: 23 days. Let's beat it!"
- NO guilt messaging
- Recovery prompt: "Start a new streak today"

### Streak Data Model

```
UserStreak {
  id: UUID
  user_id: UUID
  dog_id: UUID
  current_streak: integer
  longest_streak: integer
  streak_started_at: date
  last_active_date: date
  freezes_available: integer (0-3)
  freezes_used_this_week: integer
  freeze_last_reset: date
  total_active_days: integer
}

StreakEvent {
  id: UUID
  user_id: UUID
  date: date
  event_type: enum (day_completed / streak_extended / streak_frozen / streak_broken / freeze_earned)
  streak_length_at_event: integer
  details: JSON (nullable)
}
```

---

## 5. Good Boy Score (GBS)

### What It Is

A 0-100 composite score representing overall training progress. THE number users care about. The dog's "report card."

### Calculation

Weighted composite of 5 dimensions, each scored 0-100:

| Dimension | Weight | Measures |
|-----------|--------|----------|
| Obedience Foundation | 30% | Basic commands mastered |
| Behavior Management | 25% | Potty, bite inhibition, impulse control |
| Socialization | 15% | Exposure to people, dogs, sounds, environments |
| Leash & Real-World | 15% | Leash manners, public behavior |
| Consistency | 15% | Training frequency, streak, engagement |

Each dimension:
```
dimension_score = (
  (exercises_completed / total_in_category) * 60     // completion
  + (average_rating / 5.0) * 25                       // quality
  + (milestone_bonus) * 15                             // milestones
)
```

### Expected Progression

| Timeframe | Expected GBS | Label |
|-----------|-------------|-------|
| Day 0 | 0 | Starting point |
| Week 1 | 5-10 | Getting Started |
| Week 4 | 22-30 | Making Progress |
| Week 8 | 45-55 | Looking Good |
| Week 12 | 65-80 | Well-Trained Pup |
| Ongoing | 80-100 | Good Boy Champion |

### Score Display

- Circular gauge on home screen (0-100, color gradient red to green)
- Detail screen: dimension breakdown, trend arrow, breed comparison, history graph
- Updates after every exercise completion with subtle animation
- Weekly email: "[Name]'s score went from 34 to 41 this week!"

### Score Rules

- Never decreases from inactivity (no punishment for breaks)
- CAN decrease slightly (-2 max/week) if user marks exercises as "needs practice" (regression)
- Per-dog (independent for multi-dog)
- Visible to free users during Week 1
- Server-calculated (not manipulable)

---

## 6. Achievement System

### Categories & Full List

**Training Milestones**:

| Achievement | Trigger | XP |
|-------------|---------|-----|
| First Steps | Complete first exercise | 25 |
| Sit Happens | Master "Sit" (all sit exercises, 4+ avg rating) | 50 |
| Down to Earth | Master "Down" | 50 |
| Come Here! | Master "Come/Recall" | 50 |
| Stay Gold | Master "Stay" (duration + distance) | 75 |
| Leave It Legend | Master "Leave It" | 50 |
| Potty Pro | Complete all potty exercises | 75 |
| Gentle Mouth | Complete bite inhibition program | 75 |
| Leash Boss | Complete leash program | 75 |
| Crate Escape | Complete crate program | 75 |
| Social Butterfly | Complete socialization program | 100 |
| Real World Ready | Complete real-world exercises | 100 |
| Good Boy Graduate | Complete full 12-week plan | 500 |

**Streak Achievements**:

| Achievement | Trigger | XP |
|-------------|---------|-----|
| Getting Started | 3-day streak | 25 |
| One Week Wonder | 7-day streak | 50 |
| Two Week Warrior | 14-day streak | 75 |
| Monthly Master | 30-day streak | 150 |
| Unstoppable | 60-day streak | 300 |
| Legend | 90-day streak | 500 |
| Dedicated | 180-day streak | 750 |
| PupPal for Life | 365-day streak | 1000 |

**Score Achievements**:

| Achievement | Trigger | XP |
|-------------|---------|-----|
| First Points | GBS reaches 10 | 25 |
| Making Progress | GBS reaches 25 | 50 |
| Halfway There | GBS reaches 50 | 100 |
| Honor Roll | GBS reaches 75 | 200 |
| Perfect Pup | GBS reaches 90 | 500 |
| Good Boy Champion | GBS reaches 100 | 1000 |

**Engagement Achievements**:

| Achievement | Trigger | XP |
|-------------|---------|-----|
| Chat with Buddy | First chat message | 10 |
| Shutterbug | Upload 10 progress photos | 25 |
| Journaler | Add notes to 10 exercises | 25 |
| Feedback Friend | Rate 20 exercises | 25 |
| Sharing is Caring | First social share | 25 |
| Refer a Friend | First successful referral | 100 |
| Pack Leader | Refer 5 friends | 250 |

**Weekly Challenge Achievements**:

| Achievement | Trigger | XP |
|-------------|---------|-----|
| Challenger | Complete first challenge | 25 |
| Challenge Streak | 4 challenges in a row | 100 |
| Challenge Champion | 12 challenges completed | 250 |

**Breed-Specific**:

| Achievement | Trigger | XP |
|-------------|---------|-----|
| [Breed] Whisperer | Complete 50% of plan | 100 |
| [Breed] Expert | Complete full plan | 200 |
| Top [Breed] | GBS in top 25% for breed | 150 |

**Total: ~45-50 achievements at launch**

### Achievement Unlock Experience

1. Full-screen overlay with badge animation and sparkles
2. Achievement name + description + XP bonus
3. Buddy: "Amazing! You unlocked [Achievement]! [Name] is crushing it!"
4. Share button generates branded card
5. Tap to dismiss

### Achievement Screen

- Grid layout, all achievements visible
- Unlocked: full color, date, XP shown
- Locked: grayed silhouette, progress bar ("14/30 days")
- Tap locked for requirements
- Filter by category, status

### Achievement Data Model

```
Achievement {
  id: UUID
  slug: string
  name: string
  description: string
  category: enum (training / streak / score / engagement / challenge / breed)
  icon_url: string
  xp_bonus: integer
  trigger_type: enum (exercise_complete / streak_length / score_threshold / count_threshold / plan_complete / referral)
  trigger_config: JSON
  is_breed_specific: boolean
  breed_template: string (nullable)
  sort_order: integer
  active: boolean
}

UserAchievement {
  id: UUID
  user_id: UUID
  dog_id: UUID
  achievement_id: UUID
  unlocked_at: timestamp
  xp_earned: integer
  shared: boolean
  shared_at: timestamp (nullable)
}

AchievementProgress {
  id: UUID
  user_id: UUID
  dog_id: UUID
  achievement_id: UUID
  current_progress: integer
  target: integer
  last_updated: timestamp
}
```

---

## 7. Level / Rank System

### Owner Levels

XP accumulation drives owner levels (separate from dog's GBS).

| Level | Title | XP Required | Cumulative |
|-------|-------|-------------|------------|
| 1 | Puppy Newbie | 0 | 0 |
| 2 | Puppy Apprentice | 100 | 100 |
| 3 | Puppy Student | 250 | 350 |
| 4 | Junior Trainer | 500 | 850 |
| 5 | Trainer | 750 | 1,600 |
| 6 | Senior Trainer | 1,000 | 2,600 |
| 7 | Expert Trainer | 1,500 | 4,100 |
| 8 | Master Trainer | 2,000 | 6,100 |
| 9 | Pack Leader | 3,000 | 9,100 |
| 10 | PupPal Legend | 5,000 | 14,100 |

**Pacing**: ~50-70 XP/day for active users = ~350-500/week. Level 5 in ~3-4 weeks. Level 10 in ~6-8 months.

### Level-Up Experience

1. Full-screen animation (number transition, particles)
2. "You're now a Senior Trainer!"
3. Buddy celebration
4. Shareable card
5. Level rewards (future: themes, Buddy costumes, extra freeze slots)

### Level Display

- Profile: level + title + XP bar to next level
- Level badge evolves visually at higher levels
- Visible in future community features

---

## 8. Weekly Challenges

### Structure

One fresh challenge per week. Optional, themed, time-bounded.

```
WeeklyChallenge {
  id: UUID
  title: string
  description: string
  category: enum
  challenge_type: enum (completion_count / duration / specific_exercise / photo)
  target: integer
  target_unit: string
  xp_reward: integer
  week_start: date
  week_end: date
  breed_specific: boolean
  min_plan_week: integer (nullable)
  active: boolean
}

UserChallenge {
  id: UUID
  user_id: UUID
  dog_id: UUID
  challenge_id: UUID
  progress: integer
  target: integer
  status: enum (active / completed / expired)
  completed_at: timestamp (nullable)
  xp_earned: integer (nullable)
}
```

### Example Challenges

| Week | Challenge | Target | XP |
|------|-----------|--------|-----|
| 1 | "First Week Hero" — Complete every daily exercise | 7 days | 75 |
| 2 | "Sit-a-thon" — Practice sit in 5 locations | 5 | 50 |
| 3 | "Patience Builder" — Stay 10+ seconds, 3 times | 3 | 50 |
| 4 | "Social Hour" — 3 new people or environments | 3 | 50 |
| 5 | "Leash Legend" — 4 leash exercises | 4 | 50 |
| 6 | "Photo Week" — 5 progress photos | 5 | 50 |
| 7 | "Buddy's Challenge" — 5 training questions | 5 | 50 |
| 8 | "Recall Rally" — Recall in 5 rooms | 5 | 50 |
| 9 | "Impulse Master" — 3 impulse exercises | 3 | 50 |
| 10 | "Real World Test" — New public place + 1 exercise | 1 | 75 |
| 11 | "Trick Week" — Teach 1 fun trick | 1 | 50 |
| 12 | "Graduation" — Hit GBS 70+ | Score 70 | 100 |

### Display

Home screen widget below Today's Training:
- Challenge title + description
- Progress bar: "2/5"
- Days remaining
- XP reward

Expired challenges: "New one next week!" No penalty.

---

## 9. Notification Strategy

| Trigger | Notification | Timing |
|---------|-------------|--------|
| Streak at risk | "[Name]'s streak at risk! Quick 5-min session?" | 7 PM |
| Streak milestone | "7-day streak! You and [Name] are on fire!" | Immediately |
| Daily XP short | "Just 18 XP to today's goal. One more exercise!" | 6 PM if under target |
| Achievement unlocked | "Achievement: Sit Happens! [Name] mastered sit!" | Immediately |
| Challenge expiring | "2 days left. You're 1 away!" | 2 days before |
| Level up | "Level Up! You're a Senior Trainer!" | Immediately |
| GBS milestone | "[Name]'s score hit 50! Halfway!" | Immediately |
| Streak broken | "Streak reset, but progress didn't. Start fresh!" | Morning after |

**Rules**: Max 2 gamification pushes/day. Celebrations always send. Respect timezone quiet hours (10pm-7am). User can disable independently.

---

## 10. Social Sharing

### Shareable Moments

Achievement unlocks, streak milestones, level-ups, GBS milestones (every 10 points), challenge completions, plan graduation.

### Share Card Design

- PupPal brand + logo
- Dog name + photo
- Milestone name + icon
- Key stat (GBS, streak, level)
- "Get PupPal" watermark
- Optimized: Instagram Stories (1080x1920), Twitter (1200x675)

### Flow

1. Milestone triggers share button in celebration
2. Card image generated
3. Native share sheet opens
4. Track share event (platform, type)

---

## 11. Free vs Premium

**Free**: XP, streaks, GBS, achievements all work during Week 1. Weekly challenges visible but most need premium exercises. Sharing works.

**Premium**: Full gamification across all weeks and features. Streak freeze. Full GBS dimensions. All achievements. Full challenges. Breed comparisons.

**Strategy**: Free users taste enough in Week 1 to want more. When their streak hits 7+ and they need premium content to keep it, upgrade becomes emotional.

---

## 12. Integration Points

**Training Plan (PRD #03)**: Exercise completions = primary XP source. Milestones trigger achievements. Week progression feeds GBS.

**AI Chat (PRD #02)**: Buddy references streaks, celebrates achievements, motivates using GBS. Chat earns XP (capped).

**Health Tracker (PRD #05)**: Health events earn XP. Future health achievements.

**Onboarding (PRD #01)**: GBS starts at 0. First XP on first exercise. Streak begins on first completion.

---

## 13. Complete Data Model

```
UserGamification {
  id: UUID
  user_id: UUID
  dog_id: UUID
  total_xp: integer
  current_level: integer
  current_level_title: string
  xp_to_next_level: integer
  good_boy_score: integer (0-100)
  gbs_obedience: integer (0-100)
  gbs_behavior: integer (0-100)
  gbs_socialization: integer (0-100)
  gbs_leash_realworld: integer (0-100)
  gbs_consistency: integer (0-100)
  gbs_last_calculated: timestamp
  weekly_xp: integer
  daily_xp: integer
  created_at: timestamp
  updated_at: timestamp
}

XPEvent {
  id: UUID
  user_id: UUID
  dog_id: UUID
  amount: integer
  source: enum (exercise / daily_bonus / rating / notes / photo / chat / challenge / milestone / health / referral / streak_milestone / achievement)
  source_id: UUID (nullable)
  earned_at: timestamp
}

LevelDefinition {
  level: integer (PK)
  title: string
  xp_required: integer
  cumulative_xp: integer
  rewards: JSON (nullable)
}

ShareEvent {
  id: UUID
  user_id: UUID
  dog_id: UUID
  share_type: enum (achievement / streak / level / gbs / challenge / graduation)
  share_item_id: UUID
  platform: string (nullable)
  shared_at: timestamp
}
```

(Plus UserStreak, StreakEvent, Achievement, UserAchievement, AchievementProgress, WeeklyChallenge, UserChallenge from sections above)

---

## 14. API Endpoints

```
GET /api/gamification/{dog_id}/summary
  Home screen data: XP, streak, GBS, active challenge, recent achievements

GET /api/gamification/{dog_id}/xp/history
  Paginated XP events. Filters: date range, source.

GET /api/gamification/{dog_id}/achievements
  All achievements with status and progress

POST /api/gamification/{dog_id}/xp/earn
  Internal: triggered by exercise completion
  Returns: updated XP + level check + achievement check

GET /api/gamification/{dog_id}/streak
  Full streak detail

POST /api/gamification/{dog_id}/streak/freeze
  Manual freeze application

GET /api/gamification/{dog_id}/score
  GBS with dimensions + history

GET /api/gamification/{dog_id}/score/history
  Weekly GBS snapshots for charting

GET /api/gamification/{dog_id}/challenge/current
  Active challenge + progress

POST /api/gamification/{dog_id}/challenge/progress
  Increment challenge progress

POST /api/gamification/{dog_id}/share
  Generate share card image URL

GET /api/gamification/{dog_id}/level
  Current level, title, progress to next
```

---

## 15. Technical Requirements

### Performance

| Requirement | Target |
|-------------|--------|
| XP earn + animation | <300ms |
| GBS recalculation | <500ms |
| Achievement check | <200ms |
| Home screen gamification load | <500ms |
| Share card generation | <2 seconds |
| Streak cron (per user) | <1 second |

### Streak Processing

- Midnight cron (per timezone): evaluate all users
  - last_active = yesterday: streak continues
  - last_active < yesterday + freeze available: apply freeze
  - last_active < yesterday + no freeze: break streak
- Monday cron: reset weekly freezes

### Offline

- XP queued offline, synced on reconnect
- Streak maintained by offline completions (synced before midnight)
- Achievements may delay until sync
- GBS requires server computation

### Data Integrity

- XP idempotent (same source_id no duplicate)
- Achievement unlocks idempotent
- Streak timezone-aware including DST
- GBS deterministic

---

## 16. Edge Cases

| Scenario | Handling |
|----------|----------|
| Exercise at 11:59pm | Counts for current day |
| Timezone change (travel) | Use current TZ. Don't double-count. |
| Two dogs same day | Independent streaks and XP per dog |
| Hit level 10 (max) | XP accumulates. "Level 10 — [X] total XP." Future levels addable. |
| Achievement already unlocked | Idempotent, no duplicate |
| GBS reaches 100 | Celebrate. Stays at 100. Maintain via activity. |
| Free user Week 1 XP then no upgrade | XP preserved. Streak hard to extend. GBS frozen. |
| Freeze applied but exercise was late-synced | Undo freeze, restore count, count as active day. |
| Challenge needs category not in plan yet | Don't show. Select alternative. |
| Two achievements unlock simultaneously | Queue animations, show one at a time. |
| Device clock manipulation | Server validates timestamps. Reject future or >24hr past. |

---

## 17. Open Questions

1. Breed leaderboards? Great for competition but could discourage slow breeds. Defer v2?
2. Streak repair purchase? Could feel predatory. Prefer freeze prevention.
3. Dog vs Owner gamification clarity? Levels for owner, GBS for dog — intuitive enough?
4. Cosmetic rewards in v1? Buddy costumes, themes, badges at levels.
5. Sound effects on unlocks? Default on, optional.
6. Challenge selection: curated pool vs algorithmic? Start curated.
7. Multi-dog XP: one owner level (pooled XP) or per-dog? Currently pooled. Confirm.
8. GBS decrease: -2 max/week for regression realistic or demoralizing? Could make only-up.

---

## 18. Dependencies

| Dependency | Purpose | Fallback |
|------------|---------|----------|
| Training Plan (PRD #03) | Completions feed XP/GBS | Manual logging |
| AI Chat (PRD #02) | Buddy references gamification | Works without |
| Health Tracker (PRD #05) | Health events earn XP | Works without |
| Push notifications | Streak/achievement alerts | In-app only |
| Image generation | Share cards | Pre-built templates |
| Timezone DB | Streak accuracy | Device timezone |
| Cron infrastructure | Midnight processing | App-level check on open |

---

## 19. Acceptance Criteria

- [ ] XP earned correctly per action type with animation
- [ ] Daily XP bar updates real-time on home screen
- [ ] Streak increments on first daily exercise with visual escalation
- [ ] Streak freeze auto-applies on missed day when available
- [ ] Streak break handled with encouraging messaging
- [ ] Freeze resets weekly (Monday)
- [ ] GBS calculates correctly from 5 weighted dimensions
- [ ] GBS updates after every completion
- [ ] GBS detail shows dimensions, trend, breed comparison
- [ ] All ~45 achievements have correct triggers
- [ ] Achievement unlock shows full-screen celebration + share
- [ ] Progress visible for locked achievements
- [ ] 10 levels with correct XP thresholds and celebrations
- [ ] Weekly challenges display with progress and countdown
- [ ] Challenge completion awards XP and checks achievements
- [ ] Share cards generate for all shareable milestones
- [ ] Native share sheet works correctly
- [ ] Push notifications fire for streak risk, achievements, challenges
- [ ] Max 2 gamification pushes/day respected
- [ ] Free users get full gamification during Week 1
- [ ] Multi-dog gamification independent (except owner level)
- [ ] Midnight cron handles all timezones correctly
- [ ] All XP events idempotent
- [ ] Analytics: xp_earned, streak_extended, streak_broken, achievement_unlocked, level_up, challenge_completed, share_tapped
