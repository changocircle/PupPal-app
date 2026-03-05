# PRD #03: Personalized Training Plan Engine + Trick Library

## PupPal — The Brain Behind Every Dog's Journey

**Document version**: 1.1 (Updated: Trick Library added)
**Feature owner**: Ashley
**Status**: Draft
**Priority**: P0 — The plan is the backbone every other feature hangs on. Tricks are the long-term retention engine.

---

## 1. Overview & Purpose

The Training Plan Engine generates a unique, week-by-week training roadmap for every dog based on breed, age, challenges, and owner experience level. It is what makes PupPal genuinely personalized instead of a generic content library.

This is NOT a static curriculum. It is a dynamic system that:
- Generates a custom plan at onboarding based on the dog's profile
- Structures training into daily exercises with clear instructions
- Adapts and reorders based on the dog's actual progress
- Feeds into the Gamification System (PRD #04) for XP, streaks, and scoring
- Provides context to Buddy (PRD #02) so the AI mentor knows where the user is
- Connects to the Health Tracker (PRD #05) for age-appropriate health milestones
- Transitions into an expandable Trick Library after plan graduation for long-term retention

### The Retention Problem Tricks Solve

The 12-week plan solves pain (potty training, biting, leash pulling). But pain goes away. Once the puppy is trained, churn risk spikes because the "problem" is solved. Tricks solve retention. They're fun, endless (you never run out), and the most shareable content in the app. Nobody posts a video of their dog NOT peeing on the carpet. Everyone posts their dog doing a spin or playing dead.

### Success Metrics

| Metric | Target | How Measured |
|--------|--------|-------------|
| Plan generation success rate | 99%+ | API success / attempts |
| Daily exercise completion rate | 40%+ of active users | Completions / active users |
| Weekly engagement | 60%+ complete 3+ exercises/week | Weekly completion count |
| Plan-driven retention | Plan users retain 2x vs non-plan | Cohort comparison |
| Exercise rating | 4.0+ / 5.0 average | Post-exercise feedback |
| Progression rate | 80%+ advance on schedule | Week advancement tracking |
| Adaptation triggers | Adapts for 30%+ users by week 4 | Adaptation event count |
| Post-graduation retention (Tricks) | 40%+ still active at month 4 | Monthly active after plan complete |
| Tricks completed per month (post-grad) | 4+ per active user | Trick completions / active post-grad users |
| Trick share rate | 15%+ of trick completions generate share | Share events / trick completions |

---

## 2. User Stories

### Training Plan
- **US-1**: As a new user, I want a personalized training plan immediately after onboarding so I know exactly what to do starting today.
- **US-2**: As a daily user, I want to see "Today's Training" with 2-3 specific exercises I can do in 10-15 minutes.
- **US-3**: As a user, I want each exercise to have clear step-by-step instructions, time estimate, and difficulty level.
- **US-4**: As a user, I want to mark exercises as complete, skipped, or "needs more practice" so the plan adapts.
- **US-5**: As a user, I want to see weekly and monthly progress at a glance.
- **US-6**: As a user with an urgent problem, I want relevant exercises immediately without waiting for the plan to get there.
- **US-7**: As a user whose dog is progressing fast, I want the plan to advance so I'm not stuck on mastered exercises.
- **US-8**: As a user whose dog is struggling, I want reinforcement exercises rather than being pushed forward.
- **US-9**: As a free user, I want to see Week 1 to understand the value, but need premium for the full journey.
- **US-10**: As a user with multiple dogs, I want each dog to have their own independent plan.

### Trick Library
- **US-11**: As a user who completed the 12-week plan, I want new training content so I have a reason to keep using PupPal.
- **US-12**: As a user, I want to browse tricks by difficulty and category so I can find ones that match my dog's level.
- **US-13**: As a user, I want to teach my dog fun tricks like spin, shake, and play dead because it's enjoyable for both of us.
- **US-14**: As a user, I want to share a video-ready moment when my dog learns a trick so I can show it off on social media.
- **US-15**: As a user mid-plan, I want occasional fun bonus tricks sprinkled into my weekly training to keep things light.

---

## 3. Plan Structure

### Hierarchy

```
Training Plan
  > Phase (Foundation / Building Skills / Advanced)
    > Week (Week 1, Week 2...)
      > Day (flexible, 5-7 per week)
        > Exercise (individual training activity)

Trick Library (post-graduation + sprinkled bonuses)
  > Trick Pack (themed collection)
    > Trick (individual trick with progression levels)
```

### Phases

**Phase 1: Foundation (Weeks 1-4 typical)**
Core essentials every puppy needs first. Potty training, bite inhibition, name recognition, crate introduction, basic socialization. Addresses the user's most urgent challenges from onboarding.

**Phase 2: Building Skills (Weeks 5-8 typical)**
Core obedience (sit, stay, come, down, leave it), leash introduction, impulse control, expanded socialization, routine building.

**Phase 3: Advanced & Real-World (Weeks 9-12 typical)**
Reliable recall, leash manners in public, greeting people, car rides, vet visit prep, advanced commands, distraction training.

**Phase 4: Ongoing (Post-Graduation)**
Trick Library becomes the primary content. Maintenance exercises for core skills. Weekly challenges shift to trick-focused. This phase has no end date — it's the long-term retention content.

**Phase length adjustments**: Breed learning speed (Border Collies compress, Bulldogs extend), dog age (older puppies may skip Phase 1 content), experience level, and actual progress.

### Weeks

Each week has:
- Theme/focus (e.g., "Week 3: Potty Mastery & Basic Sit")
- 5-7 daily exercise slots
- Weekly milestone (ties into Gamification PRD #04)
- Buddy check-in prompt
- 1 bonus trick slot starting Week 4 (fun break from structured training)

### Days

Each day offers:
- 2-3 exercises (10-15 minutes total)
- Mix: 1 primary skill + 1 reinforcement/review + 1 optional bonus (trick or supplementary)
- Time estimate and difficulty indicator (1-3 paws)

### Exercises

```
Exercise {
  id: UUID
  title: string                    // "Teach 'Sit' with Lure Method"
  slug: string
  description: string              // 2-3 sentence overview
  category: enum                   // (see categories below)
  subcategory: string (nullable)   // for tricks: "party_tricks", "useful_tricks"
  difficulty: integer (1-3)
  estimated_minutes: integer       // 5, 10, or 15
  min_age_weeks: integer
  max_age_weeks: integer (nullable)
  breed_modifiers: JSON            // breed-specific tips/adjustments
  prerequisites: array of UUID
  is_trick: boolean                // distinguishes tricks from core training

  // Content
  steps: array of ExerciseStep
  tips: array of string
  common_mistakes: array of string
  success_criteria: string
  troubleshooting: array of {problem, solution}
  share_prompt: string (nullable)  // "Film [Name] doing this and share!"

  // Media
  video_url: string (nullable)     // future
  illustration_urls: array         // future

  // Metadata
  tags: array of string
  related_exercises: array of UUID
  xp_reward: integer
  trick_pack_id: UUID (nullable)   // if part of a trick pack
  created_at: timestamp
  updated_at: timestamp
}

ExerciseStep {
  step_number: integer
  instruction: string
  duration_seconds: integer (nullable)
  tip: string (nullable)
}
```

### Exercise Categories

| Category | Examples |
|----------|----------|
| potty_training | Schedule, cue word, accident response, bell training |
| bite_inhibition | Redirect, yelp method, timeout, appropriate chews |
| basic_commands | Sit, down, stay, come, leave it, drop it, wait |
| leash_skills | Leash intro, loose leash, heel, stop pulling |
| crate_training | Introduction, building duration, nighttime, separation |
| socialization | People, sounds, surfaces, other dogs, handling, environments |
| impulse_control | Wait for food, door manners, no jumping, settle |
| advanced_commands | Place, go to bed, reliable recall at distance |
| real_world | Vet prep, car rides, cafe behavior, greeting visitors |
| mental_stimulation | Puzzle toys, nose work, hide and seek, training games |
| health_habits | Paw handling, brushing, teeth check, nail prep, bath intro |
| **tricks** | Spin, shake, roll over, play dead, high five, take a bow, etc. |

---

## 4. Plan Generation Algorithm

### Inputs

From onboarding (PRD #01):
- `confirmed_breed` — breed traits, learning speed, common issues
- `age_in_weeks` — developmental stage, age-appropriate exercises
- `challenges` — priority focus areas to front-load
- `experience_level` — instruction detail and pacing

### Generation Logic

Runs once at onboarding completion. Produces full 12-week plan. Stored and adapted over time.

**Step 1: Determine developmental stage**

```
if age_in_weeks < 8:   stage = "early_puppy"
elif age_in_weeks < 12: stage = "prime_puppy"
elif age_in_weeks < 16: stage = "late_puppy"
elif age_in_weeks < 26: stage = "adolescent"
elif age_in_weeks < 52: stage = "young_adult"
else:                   stage = "adult"
```

**Step 2: Build priority queue from challenges**

```
challenge_to_category_map = {
  "potty_training":     [("potty_training", 1.0)],
  "biting_nipping":     [("bite_inhibition", 1.0), ("impulse_control", 0.5)],
  "basic_commands":     [("basic_commands", 1.0)],
  "leash_walking":      [("leash_skills", 1.0), ("impulse_control", 0.3)],
  "separation_anxiety": [("crate_training", 1.0), ("impulse_control", 0.5)],
  "socializing":        [("socialization", 1.0)],
  "sleeping":           [("crate_training", 1.0)],
  "feeding":            [("impulse_control", 0.7), ("health_habits", 0.5)]
}
```

First challenge selected = highest priority = front-loaded into Week 1.

**Step 3: Apply breed modifiers**

```
BreedProfile {
  breed: string
  learning_speed: enum (fast / average / slow)
  energy_level: enum (high / medium / low)
  common_issues: array of string
  socialization_priority: enum (high / medium / low)
  bite_inhibition_difficulty: enum (high / medium / low)
  stubbornness: enum (high / medium / low)
  size_category: enum (toy / small / medium / large / giant)
  brachycephalic: boolean
  trick_aptitude: enum (high / medium / low)  // NEW: affects trick recommendations
  exercise_notes: JSON
}
```

Examples:
- Golden Retriever: fast learning, high energy, mouthy, high trick aptitude
- Pomeranian: average learning, medium energy, barking tendency, medium trick aptitude
- Husky: fast learning, very high energy, high stubbornness, medium trick aptitude
- French Bulldog: slow learning, low energy, short sessions, brachycephalic, low trick aptitude (physical limitations)
- Border Collie: very fast learning, very high energy, mental stim emphasis, very high trick aptitude

**Step 4: Assemble weekly plan**

For each week (1-12):
1. Determine phase
2. Select exercises from priority queue (age-appropriate, right difficulty, prerequisites met)
3. Apply breed modifier (adjust count, duration, add breed tips)
4. Structure into daily slots: 2-3 per day, 5-7 days/week
5. Include 1 review exercise per day from previous week
6. **Starting Week 4**: Include 1 bonus trick per week as an optional exercise (fun break)
7. Assign XP values

**Step 5: Generate week summaries and milestones**

For each week: title, description, measurable milestone, Buddy messages for start and end.

**Step 6: Apply experience level adjustments**

- first_time: Detailed instructions, more encouragement, simpler language
- experienced_owner: Standard instructions, skip basics, slightly faster pace
- advanced: Condensed instructions, faster progression, advanced variations earlier

---

## 5. Exercise Content System

### Content Creation Strategy

~150-200 exercises at launch (including 30-40 tricks). Pre-written and reviewed, NOT AI-generated on the fly.

### Content Template

```
TITLE: [Action verb] + [Skill] + [Method]
OVERVIEW: 2-3 sentences. What it teaches and why for [breed] at [age].
TIME: X min | DIFFICULTY: [1-3 paws] | SUPPLIES: [treats, leash, etc.]
STEPS: Numbered, clear instructions with {dog_name} placeholder
SUCCESS LOOKS LIKE: "[Name] does [behavior] [X/Y] times within [timeframe]"
PRO TIPS: 2-3 breed-specific or general tips
COMMON MISTAKES: What NOT to do and why
TROUBLESHOOTING: If [Name] does X... try Y
NEXT STEP: What comes after mastering this
SHARE MOMENT: (tricks only) "Film [Name] doing this! Great for Instagram."
```

### Personalization at Display Time

Token replacement: `{dog_name}`, `{breed}`, `{breed_tip}`, `{age_tip}`, `{experience_tip}`, `{challenge_context}`

Breed-specific adjustments: duration for brachycephalic, energy level matching, sensitivity notes, auto-included breed issues.

Age-specific adjustments: under 12 weeks (shorter sessions), 12-16 weeks (socialization urgency), 4-6 months (teething), 6-12 months (teenage phase), 1 year+ ("never too late").

### Launch Library

| Category | Count | Examples |
|----------|-------|---------|
| Potty Training | 10-12 | Schedule, cue word, accident protocol, bell training, nighttime |
| Bite Inhibition | 8-10 | Yelp-redirect, timeout, chew rotation, hand targeting |
| Basic Commands | 20-25 | Sit (lure/capture), down, stay, come, leave it, drop it, wait, look at me |
| Leash Skills | 10-12 | Harness intro, indoor practice, loose leash, direction changes, heel |
| Crate Training | 8-10 | Introduction, feeding in crate, duration building, nighttime, games |
| Socialization | 12-15 | People types, sounds, surfaces, dogs (visual), handling, environments |
| Impulse Control | 10-12 | Wait for food, door manners, no jumping, settle, greeting protocol |
| Advanced Commands | 8-10 | Place, go to bed, reliable recall, distraction proofing |
| Real World | 8-10 | Vet prep, car rides, cafe, visitors, distractions |
| Mental Stimulation | 6-8 | Puzzles, nose work, hide and seek, muffin tin, snuffle mat |
| Health Habits | 6-8 | Paw handling, nail prep, brush, teeth, ears, bath |
| **Tricks** | **30-40** | See Trick Library section below |

**Total: ~160-180 exercises at launch**

---

## 6. Trick Library

### Philosophy

Tricks are NOT filler content. They serve three critical business functions:

1. **Post-graduation retention**: The 12-week plan ends. Tricks don't. They're the evergreen content that keeps premium subscribers paying month after month.
2. **Social sharing engine**: Trick videos are the most viral pet content. Every trick completed is a potential share moment. Every share is free marketing.
3. **Mid-plan engagement boost**: Fun tricks sprinkled into Weeks 4-12 as bonus exercises break the monotony of "serious" training and keep the experience playful.

### Trick Packs

Tricks are organized into themed packs that unlock progressively:

**Pack 1: Starter Tricks** (Available from Week 4 as bonuses, fully available post-plan)
- Shake / Paw (difficulty: 1)
- High Five (difficulty: 1, prerequisite: Shake)
- Spin (clockwise) (difficulty: 1)
- Touch / Target (difficulty: 1)
- Take a Bow (difficulty: 2)

**Pack 2: Classic Tricks** (Available from Week 8)
- Roll Over (difficulty: 2)
- Play Dead / Bang (difficulty: 2)
- Spin (counterclockwise) (difficulty: 1, prerequisite: Spin clockwise)
- Speak / Bark on Cue (difficulty: 2)
- Whisper / Quiet Bark (difficulty: 3, prerequisite: Speak)

**Pack 3: Impressive Tricks** (Available post-graduation)
- Crawl (difficulty: 2)
- Peek-a-Boo (through legs) (difficulty: 2)
- Weave Through Legs (difficulty: 3)
- Jump Over Arm / Bar (difficulty: 2)
- Ring a Bell (difficulty: 2)

**Pack 4: Useful Tricks** (Available post-graduation)
- Fetch Specific Items by Name (difficulty: 3)
- Close the Door (difficulty: 3)
- Put Toys Away (difficulty: 3)
- Bring Leash (difficulty: 2)
- Find It / Scent Search (difficulty: 2)

**Pack 5: Party Tricks** (Available post-graduation)
- Wave Goodbye (difficulty: 2, prerequisite: Shake)
- Take a Selfie (look at camera on cue) (difficulty: 2)
- Hug (put paws on person) (difficulty: 3)
- Kiss on Cue (difficulty: 1)
- Balance Treat on Nose (difficulty: 3)

**Pack 6: Advanced Performance** (Available after completing 15+ tricks)
- Skateboard Introduction (difficulty: 3)
- Leg Weave Walk (difficulty: 3, prerequisite: Weave Through Legs)
- Handstand Against Wall (difficulty: 3, large breeds cautioned)
- Chain: Spin + Bow Combo (difficulty: 3, prerequisites: Spin + Bow)
- Freestyle Sequence Builder (user picks 3 tricks to chain)

**Future packs** (content drops every 4-6 weeks to keep library fresh):
- Seasonal: Holiday tricks (wear santa hat, find hidden eggs)
- Breed-specific: Retriever games, herding games, scent hound trails
- Agility basics: Tunnels, jumps, weave poles
- CGC prep: Canine Good Citizen test exercises

### Trick Data Model

```
TrickPack {
  id: UUID
  name: string                 // "Starter Tricks"
  description: string
  slug: string
  icon_url: string
  unlock_condition: enum (plan_week / plan_complete / tricks_completed / manual)
  unlock_value: integer (nullable)  // e.g., plan_week: 4, tricks_completed: 15
  sort_order: integer
  exercises: array of UUID     // references Exercise table where is_trick = true
  total_tricks: integer
  active: boolean
}

UserTrickPackProgress {
  id: UUID
  user_id: UUID
  dog_id: UUID
  trick_pack_id: UUID
  unlocked: boolean
  unlocked_at: timestamp (nullable)
  tricks_completed: integer
  tricks_total: integer
}
```

Tricks themselves use the same `Exercise` model with `is_trick = true` and `trick_pack_id` set. This means they flow through the same completion, XP, and gamification systems.

### Trick-Specific Exercise Fields

Tricks use the same Exercise model but leverage specific fields:

- `is_trick: true` — flags as trick content
- `trick_pack_id` — which pack it belongs to
- `subcategory` — "starter", "classic", "impressive", "useful", "party", "advanced"
- `prerequisites` — tricks often chain (High Five requires Shake)
- `share_prompt` — every trick has a share CTA: "Film [Name] doing this!"
- `breed_modifiers` — physical tricks adjusted for breed (no handstands for Dachshunds, no high jumps for brachycephalic)

### Trick Difficulty Scaling

Each trick has up to 3 progression levels (not separate exercises — levels within one exercise):

**Level 1: Learning** — Dog performs trick with full lure/guide, treats every time, low distraction
**Level 2: Fluent** — Dog performs on verbal cue only, intermittent treats, some distraction
**Level 3: Mastered** — Dog performs reliably with verbal or hand signal, any environment, no treat needed

Users mark which level they've achieved. Buddy adapts: "Luna can do Shake on lure — ready to try it with just the cue word?"

```
TrickProgress {
  id: UUID
  user_id: UUID
  dog_id: UUID
  exercise_id: UUID            // the trick exercise
  current_level: integer (1-3)
  level_1_completed_at: timestamp (nullable)
  level_2_completed_at: timestamp (nullable)
  level_3_completed_at: timestamp (nullable)
  attempts: integer
  user_rating: integer (nullable)
  notes: string (nullable)
  shared: boolean
  shared_at: timestamp (nullable)
}
```

### Trick Library UI

**Access point**: "Tricks" tab within the Plan screen (alongside "This Week" and "Full Plan" tabs). Also accessible from home screen quick actions post-graduation.

**Trick Library Screen**:
```
┌─────────────────────────────┐
│  Trick Library               │
│  [Name] knows 7 tricks       │
│                              │
│  ┌─────────┐ ┌─────────┐    │
│  │ 🐾      │ │ 🎭      │    │  ← Pack cards (2-col grid)
│  │ Starter │ │ Classic  │    │
│  │ 4/5 ✓   │ │ 2/5     │    │
│  └─────────┘ └─────────┘    │
│  ┌─────────┐ ┌─────────┐    │
│  │ 🌟      │ │ 🔧      │    │
│  │Impress- │ │ Useful  │    │
│  │  ive    │ │ 🔒      │    │
│  │ 1/5     │ │ Unlock  │    │
│  └─────────┘ └─────────┘    │
│                              │
│  TRICKS [Name] KNOWS         │
│  ┌───────────────────────┐   │
│  │ ★★★ Shake             │   │  ← 3 stars = mastered
│  │ ★★☆ High Five         │   │  ← 2 stars = fluent
│  │ ★☆☆ Spin              │   │  ← 1 star = learning
│  │ ★★★ Touch             │   │
│  └───────────────────────┘   │
│                              │
│  SUGGESTED NEXT              │
│  ┌───────────────────────┐   │
│  │ Take a Bow  ~10 min   │   │  ← Based on completed prereqs
│  │ Roll Over   ~15 min   │   │
│  └───────────────────────┘   │
└─────────────────────────────┘
```

**Pack detail**: Shows all tricks in pack, locked/unlocked status, completion progress. Each trick shows 3-star rating for level progression.

**Trick detail**: Same layout as exercise detail screen but with:
- 3-level progression tabs (Learning / Fluent / Mastered)
- "Share this trick!" CTA after marking any level complete
- Breed-specific notes ("Golden Retrievers love this one — they're natural performers!")
- Prerequisites shown if not yet met

### Trick Integration with Weekly Plan

**Weeks 4-12**: One bonus trick slot per week. The system selects an appropriate trick from unlocked packs that:
- Has prerequisites met
- Is age-appropriate
- Matches breed aptitude (physical tricks matched to breed capability)
- Hasn't been completed yet

These appear in the daily exercise list as "Bonus: [Trick Name]" with a star icon instead of the regular category icon. Completing them is optional but earns bonus XP (20 XP).

### Post-Graduation Experience

When the 12-week plan completes:

1. "Good Boy Graduate" celebration (PRD #04 achievement, 500 XP)
2. Plan screen transitions to post-graduation mode:
   - "Today's Training" becomes "Today's Practice": 1-2 maintenance exercises (rotating review of mastered skills) + 1 suggested trick
   - Trick Library becomes the primary content hub
   - Weekly challenges shift to trick-focused: "Teach [Name] a new trick this week"
3. New trick packs unlock on a drip schedule (Pack 3-6 become available)
4. Buddy shifts tone: "Luna's foundation is solid! Now let's have some fun. Ready to teach her Roll Over?"

### Trick Gamification

Tricks feed into the existing gamification system (PRD #04):

| Action | XP |
|--------|-----|
| Complete trick Level 1 (Learning) | 20 XP |
| Complete trick Level 2 (Fluent) | 25 XP |
| Complete trick Level 3 (Mastered) | 30 XP |
| Share a trick | 10 XP |
| Complete a trick pack (all tricks to Level 1+) | 100 XP |
| Master a trick pack (all tricks to Level 3) | 250 XP |

**Trick achievements** (added to PRD #04):

| Achievement | Trigger | XP |
|-------------|---------|-----|
| First Trick | Complete any trick Level 1 | 25 |
| Trick Learner | Complete 5 tricks | 50 |
| Trick Master | Master 5 tricks (Level 3) | 100 |
| Pack Rat | Complete all tricks in a pack | 75 |
| Show Dog | Master all tricks in a pack | 200 |
| Trick Champion | Complete 20 tricks | 150 |
| Trick Legend | Master 15 tricks | 500 |

---

## 7. Daily Training Experience (UI)

### "Today's Training" — Home Screen Widget

**Header**: "[Name]'s Training" with dog photo, streak, Good Boy Score.

**Today's Card**:
- "Week 3, Day 4" / "~12 minutes"
- Exercise list (2-3 items):
  ```
  [checkmark] Potty: Cue Word Reinforcement (3 min)    [completed]
  [empty]     Sit: Adding Distance (5 min)              [tap to start]
  [star]      Bonus Trick: Shake (5 min)                [optional]
  ```
- Each shows: status, category color tag, title, time

**This Week Overview**: Progress bar, milestone.

**Quick Actions**: "Ask Buddy", "View Full Plan", "Trick Library" (post Week 4), "Log Quick Win"

### Exercise / Trick Detail Screen

Same layout for both. Top: title, category, difficulty, time, supplies. Instructions: step-by-step. Bottom: Timer, "Mark Complete", "Need More Practice", "Skip".

**Trick-specific additions**: Level selector tabs (Learning / Fluent / Mastered), share CTA after completion, breed note callout.

### Completion Flow

**Mark Complete**: Celebration animation, XP float-up, optional rating, optional notes. If trick: "Share [Name]'s new trick!" CTA with share card.

**Need More Practice**: Reschedule. "No worries — [Name] will get it."

**Skip**: Skip today or remove.

---

## 8. Plan Adaptation Engine

### Adaptation Triggers

**Trigger 1: Skill Mastered Early**
- Signal: 5-star rating + reinforcement completed easily
- Action: Unlock next-level exercises earlier. Compress skill track.

**Trigger 2: Skill Struggling**
- Signal: "Needs More Practice" 2+ times OR 1-2 star ratings
- Action: Add 2-3 supplementary exercises. Extend skill timeline. Buddy offers tips.

**Trigger 3: Exercises Consistently Skipped**
- Signal: Same category skipped 3+ times
- Action: Deprioritize category. Replace with engaged categories.

**Trigger 4: Age Milestone Reached**
- Signal: Dog age crosses threshold (12w, 16w, 6mo)
- Action: Inject age-appropriate content. Buddy message about update.

**Trigger 5: User Request via Chat**
- Signal: User tells Buddy "we're good at sit" or "focus more on leash"
- Action: Buddy confirms, triggers plan rebalance.

**Trigger 6: Week Completion Assessment**
- >80%: proceed or accelerate
- 50-80%: maintain pace, add reinforcement
- <50%: simplify next week, reduce count, Buddy check-in

**Trigger 7: Trick Preference Signal** (NEW)
- Signal: User consistently completes bonus tricks, rates them highly, or asks Buddy about tricks
- Action: Increase trick frequency in bonus slots. Suggest more challenging tricks earlier.

### Adaptation Rules

- Max one adaptation per day
- Always inform user via Buddy
- Never remove completed exercises
- Additive by default
- User can override: "Keep plan as-is"
- Log all adaptations for analytics

---

## 9. Plan Progress Tracking

### Week View

Shows all 12 weeks with status (completed/active/locked). Tap any week for daily breakdown.

### Progress Dashboard

**Stats cards**: Total exercises completed, current streak, Good Boy Score, skills mastered, tricks learned.

**Skills radar chart**: Spider chart across categories including tricks.

**Timeline**: Horizontal scroll with milestones, current position, upcoming milestones, health milestones.

**Breed comparison**: "[Name] has mastered 8 skills and 5 tricks — 20% faster than the average [Breed]!"

---

## 10. Free vs Premium Plan Access

### Free Tier

- Full Week 1 visible and completable
- Week 2+ titles and descriptions visible, content locked
- Trick Library: can see pack names and trick titles, content locked
- 1 free trick (Shake) fully accessible as a teaser
- Progress tracking works for Week 1

### Premium Tier

- Full 12-week plan + all exercises
- Adaptation engine active
- Full Trick Library with all packs (progressive unlocking)
- Full progress dashboard
- Breed comparisons

---

## 11. Integration Points

### With AI Mentor Chat (PRD #02)

Feeds Buddy: current_plan_week, completed_milestones, recent_sessions, struggling_skills, next_exercises, tricks_learned, trick_progress. Buddy references tricks naturally: "Luna knows Shake — want to try High Five next? It builds on the same paw movement."

### With Gamification System (PRD #04)

Every completion (exercise or trick) feeds: XP reward, streak tracking, Good Boy Score, achievement checks, weekly challenge progress. Tricks have their own achievement track.

### With Health Tracker (PRD #05)

Health milestones interspersed in timeline. Developmental milestones trigger plan adjustments. Health events can pause plan.

### With Photo Journal (PRD #12)

Trick completions prompt photo/video capture: "Capture [Name]'s new trick!" Photos tagged with trick name for the progress timeline.

### With Push Notifications

- Morning: "Today's training: [Exercise 1] and [Exercise 2] (~10 min)"
- Evening: "[Name]'s training is waiting! Just 10 minutes."
- Trick suggestion: "[Name] is ready to learn Roll Over. It's a crowd-pleaser!"
- Post-grad: "New trick pack unlocked: Impressive Tricks! Teach [Name] to crawl."

---

## 12. Data Model (Complete)

```
TrainingPlan {
  id: UUID
  user_id: UUID
  dog_id: UUID
  generated_at: timestamp
  last_adapted_at: timestamp (nullable)
  total_weeks: integer (default 12)
  current_week: integer
  current_phase: enum (foundation / building / advanced / ongoing)
  breed_profile_used: string
  generation_inputs: JSON
  status: enum (active / completed / paused)
  graduated_at: timestamp (nullable)
}

PlanWeek {
  id: UUID
  plan_id: UUID
  week_number: integer
  phase: enum
  title: string
  description: string
  milestone: string
  milestone_achieved: boolean
  started_at: timestamp (nullable)
  completed_at: timestamp (nullable)
  status: enum (locked / active / completed)
  buddy_start_message: string
  buddy_end_message: string
}

PlanDay {
  id: UUID
  week_id: UUID
  day_number: integer (1-7)
  estimated_minutes: integer
  status: enum (upcoming / available / completed / skipped)
}

PlanExercise {
  id: UUID
  day_id: UUID
  exercise_id: UUID
  order: integer
  type: enum (primary / reinforcement / bonus / trick_bonus)
  status: enum (upcoming / available / completed / skipped / needs_practice)
  completed_at: timestamp (nullable)
  user_rating: integer (nullable, 1-5)
  user_notes: string (nullable)
  xp_earned: integer (nullable)
  attempts: integer (default 0)
  breed_tip: string (nullable)
}

ExerciseCompletion {
  id: UUID
  user_id: UUID
  dog_id: UUID
  plan_exercise_id: UUID (nullable — tricks outside plan won't have this)
  exercise_id: UUID
  completed_at: timestamp
  rating: integer (nullable)
  notes: string (nullable)
  xp_earned: integer
  time_spent_seconds: integer (nullable)
  category: string
  is_trick: boolean
}

TrickPack {
  id: UUID
  name: string
  description: string
  slug: string
  icon_url: string
  unlock_condition: enum (plan_week / plan_complete / tricks_completed / manual)
  unlock_value: integer (nullable)
  sort_order: integer
  total_tricks: integer
  active: boolean
}

UserTrickPackProgress {
  id: UUID
  user_id: UUID
  dog_id: UUID
  trick_pack_id: UUID
  unlocked: boolean
  unlocked_at: timestamp (nullable)
  tricks_completed: integer
  tricks_total: integer
}

TrickProgress {
  id: UUID
  user_id: UUID
  dog_id: UUID
  exercise_id: UUID
  current_level: integer (1-3)
  level_1_completed_at: timestamp (nullable)
  level_2_completed_at: timestamp (nullable)
  level_3_completed_at: timestamp (nullable)
  attempts: integer
  user_rating: integer (nullable)
  notes: string (nullable)
  shared: boolean
  shared_at: timestamp (nullable)
}

PlanAdaptation {
  id: UUID
  plan_id: UUID
  triggered_at: timestamp
  trigger_type: enum (skill_mastered / skill_struggling / exercises_skipped / age_milestone / user_request / week_assessment / trick_preference)
  trigger_data: JSON
  changes_made: JSON
  week_affected: integer
  buddy_message: string (nullable)
}
```

---

## 13. API Endpoints

```
// Training Plan
POST /api/plans/generate                          — Generate plan after onboarding
GET /api/plans/{plan_id}                           — Full plan
GET /api/plans/{plan_id}/week/{week_number}        — Week detail (premium for week > 1)
GET /api/plans/{plan_id}/today                     — Current day's exercises
POST /api/plans/exercises/{id}/complete            — Mark exercise complete
POST /api/plans/exercises/{id}/skip                — Skip exercise
POST /api/plans/exercises/{id}/needs-practice      — Reschedule exercise
POST /api/plans/{plan_id}/adapt                    — Trigger adaptation
GET /api/plans/{plan_id}/progress                  — Progress dashboard data

// Trick Library
GET /api/tricks/packs                              — All trick packs with unlock status
GET /api/tricks/packs/{pack_id}                    — Pack detail with trick list
GET /api/tricks/{exercise_id}                      — Trick detail (personalized)
POST /api/tricks/{exercise_id}/complete            — Complete trick at specified level
GET /api/tricks/progress/{dog_id}                  — All trick progress for dog
POST /api/tricks/{exercise_id}/share               — Generate share card for trick
GET /api/tricks/suggested/{dog_id}                 — Next suggested tricks based on progress

// Shared
GET /api/exercises/{id}                            — Full exercise content (personalized)
GET /api/breeds/{breed}/profile                    — Breed profile
```

---

## 14. Technical Requirements

### Performance

| Requirement | Target |
|-------------|--------|
| Plan generation (12 weeks) | <5 seconds |
| Today's training load | <500ms |
| Exercise detail load | <300ms |
| Completion save | <500ms |
| Adaptation processing | <3 seconds |
| Trick library load | <500ms |
| Trick pack detail load | <300ms |

### Offline Support

- Today's exercises viewable offline (if previously loaded)
- Completions queued offline, synced on reconnect
- Trick library browseable from cache
- Generation and adaptation require connection

### Data Integrity

- Completions are idempotent (no duplicate XP)
- Adaptations are atomic
- Trick level progression is monotonic (can't go backwards)
- Plan regeneration preserves all completion and trick history

---

## 15. Edge Cases

| Scenario | Handling |
|----------|----------|
| User completes all 12 weeks | Celebration. Transition to post-graduation: maintenance + tricks. |
| User completes all available tricks | "More tricks coming soon!" Show completion stats. Content drops every 4-6 weeks. |
| Pauses >2 weeks | Buddy: "Welcome back!" Review exercises for regression. |
| Changes breed | Regenerate plan. Adjust trick recommendations for breed aptitude. |
| Trick has physical prereq breed can't do | Filter out. French Bulldogs don't see handstand. Dachshunds don't see jump tricks. |
| User tries trick before prereq met | Show prereq: "Learn Shake first — it's the foundation for High Five." Link to prereq. |
| 2+ dogs on different plan weeks | Fully independent plans and trick progress per dog. |
| Free user tries to access locked tricks | Show title and description. Lock content. "Unlock all tricks with Premium." |
| Trick pack content drop (new pack added) | Push notification. New pack appears in library. Existing progress unaffected. |
| User rates trick poorly but completes it | Track separately — poor rating doesn't prevent level progression but flags for Buddy to offer alternative approach. |
| Dog too young for certain tricks | Age gate on specific tricks. "Shake is best for puppies 12+ weeks." Show when appropriate. |

---

## 16. Open Questions

1. Exercise content: Certified trainer writes all ~180, or AI-generated + trainer reviewed?
2. Video content: Demo videos dramatically improve trick learning. Include in v1 or text-only? Could use short GIFs as compromise.
3. Breed profiles: All ~200 AKC breeds or top 50 + mixed breed default?
4. Plan duration: Always 12 weeks or variable by breed/age?
5. Trick video sharing: Should PupPal include a built-in video recording feature for tricks, or rely on "film with your phone, share the card"?
6. Trick content drops: What cadence for new trick packs? Monthly? Every 6 weeks?
7. Community tricks: Allow users to submit trick ideas for future packs?
8. CGC integration: Include Canine Good Citizen test prep as a specialized trick pack?
9. Trick chains: How complex should the "Freestyle Sequence Builder" be? Simple pick-3 or full choreography?

---

## 17. Dependencies

| Dependency | Purpose | Fallback |
|------------|---------|----------|
| Breed Profile database | Personalization + trick filtering | Default profile |
| Exercise + trick content library | Plan and trick content | Reduced library |
| Gamification (PRD #04) | XP on completion | Works without, add later |
| AI Chat (PRD #02) | Buddy context + adaptations | Works standalone |
| Health Tracker (PRD #05) | Health milestones | Works standalone |
| Photo Journal (PRD #12) | Trick photo capture | Share card only |
| Push notifications | Reminders + trick announcements | In-app only |

---

## 18. Acceptance Criteria

### Training Plan
- [ ] Plan generates in <5 seconds with personalized 12-week structure
- [ ] Plan varies across different breed/age/challenge combos (test 10+ profiles)
- [ ] Today's Training shows 2-3 exercises with correct content, time, difficulty
- [ ] Exercise detail shows personalized instructions with name, breed tips, age notes
- [ ] Mark Complete triggers XP, celebration, plan progress update
- [ ] Needs More Practice reschedules to upcoming day
- [ ] Skip offers skip-today vs remove options
- [ ] Adaptation triggers correctly for all 7 trigger types
- [ ] Week view shows 12 weeks with correct status
- [ ] Progress dashboard shows accurate stats, radar, timeline
- [ ] Free users access full Week 1, Week 2+ locked with upgrade CTA
- [ ] Bonus trick slot appears in daily exercises starting Week 4
- [ ] Plan state persists across sessions
- [ ] Completions queue offline and sync
- [ ] Buddy receives correct plan context
- [ ] Multiple dogs have independent plans

### Trick Library
- [ ] Trick Library screen shows all packs with unlock status
- [ ] Packs unlock at correct conditions (plan week, graduation, tricks completed)
- [ ] Trick detail shows 3-level progression (Learning / Fluent / Mastered)
- [ ] Completing a trick level awards correct XP
- [ ] Trick prerequisites enforced (can't start High Five without Shake)
- [ ] Breed-inappropriate tricks filtered out (no handstands for Dachshunds)
- [ ] Share CTA appears after trick completion with generated card
- [ ] Suggested next tricks are contextually appropriate
- [ ] Post-graduation home screen transitions to maintenance + tricks
- [ ] Free users see 1 free trick (Shake) + locked content
- [ ] Trick achievements trigger at correct thresholds
- [ ] All trick content reviewed for positive reinforcement and safety
- [ ] Analytics: trick_started, trick_level_completed, trick_shared, trick_pack_unlocked
