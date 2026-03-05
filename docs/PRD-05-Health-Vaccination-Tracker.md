# PRD #05: Health & Vaccination Tracker

## PupPal — The Peace-of-Mind Feature

**Document version**: 1.0
**Feature owner**: Ashley
**Status**: Draft
**Priority**: P1 — Not the reason people download PupPal, but a major reason they stay. Health tracking turns PupPal from a "training app I'll delete in 3 months" into a "puppy management hub I keep for years."

---

## 1. Overview & Purpose

New puppy parents are overwhelmed by health logistics: vaccination schedules, deworming, flea/tick treatment, spay/neuter timing, weight tracking, teething, growth milestones, vet appointments. Most people track this across scattered vet printouts, Google Calendar reminders, Notes app lists, and memory. It's chaotic.

The Health Tracker centralizes all puppy health management in one place, personalized to the dog's breed and age. It serves four purposes:

1. **Reduce anxiety** — "Is [Name] up to date on vaccinations?" answered instantly, always.
2. **Proactive reminders** — Push notifications before health events are due, not after they're overdue.
3. **Breed-specific health intelligence** — A Great Dane owner needs different health milestones than a Chihuahua owner. Breed-specific health risks, growth curves, and timelines built in.
4. **Long-term retention** — Training plans end at 12 weeks. Health tracking lasts the dog's entire life. This is the feature that keeps PupPal installed and the subscription active for years.

**What this is NOT**: This is NOT a medical diagnostic tool. It does not replace a veterinarian. It tracks schedules, provides reminders, logs health events, and offers breed-specific general information. All medical content includes appropriate disclaimers directing users to their vet.

### Success Metrics

| Metric | Target | How Measured |
|--------|--------|-------------|
| Health tracker activation rate | 60%+ of premium users log 1+ event in first month | Health events / premium users |
| Vaccination schedule completion | 70%+ log all puppy vaccinations on time | Vaccination events vs expected schedule |
| Reminder engagement | 40%+ of reminders result in logged event within 7 days | Event logged / reminder sent |
| Feature retention impact | Users with health events active 30%+ longer than those without | Cohort comparison |
| Weight tracking usage | 30%+ log weight monthly | Weight events / active users |
| Vet visit logging | 50%+ log at least 1 vet visit in 6 months | Vet events / premium users |

---

## 2. User Stories

- **US-1**: As a new puppy parent, I want to see exactly which vaccinations my puppy needs and when, based on their age and breed, so I never miss one.
- **US-2**: As a user, I want push notification reminders before health events are due so I can schedule vet appointments proactively.
- **US-3**: As a user, I want to log completed health events (vaccinations, vet visits, medications) so I have a permanent health record.
- **US-4**: As a user, I want to track my puppy's weight over time and see it compared to breed growth curves so I know if growth is on track.
- **US-5**: As a user, I want breed-specific health information (common conditions, risk factors, recommended screenings) so I know what to watch for.
- **US-6**: As a user, I want to see developmental milestones (teething, ears standing, coat change) based on breed and age so I know what's normal.
- **US-7**: As a user, I want to store my vet's contact information and quickly call or message them from the app.
- **US-8**: As a user, I want to export or share my dog's health record with a vet or boarding facility.
- **US-9**: As a free user, I want to see 1-2 upcoming health reminders so I understand the feature's value.
- **US-10**: As a user with multiple dogs, I want independent health records for each dog.

---

## 3. Health Dashboard

### Main Health Screen Layout

**Header**:
- "[Name]'s Health" with dog photo
- Quick status badges:
  - Vaccinations: "Up to date" (green) or "1 due soon" (yellow) or "1 overdue" (red)
  - Next vet visit: "Scheduled: Mar 15" or "None scheduled"
  - Weight: "[X] lbs — On track" or "Due for weigh-in"

**Upcoming Events Card** (prominent, top):
- Next 3 upcoming health events in chronological order
- Each shows: event type icon, title, due date, days until due
- Example:
  ```
  💉 DHPP Booster #3         Due in 12 days (Mar 15)
  🪱 Deworming dose #4       Due in 18 days (Mar 21)
  ⚖️ Monthly weigh-in        Due in 5 days (Mar 10)
  ```
- Tap any event to see details or log completion

**Quick Actions**:
- "Log Health Event" — manual entry for anything
- "Schedule Vet Visit" — add upcoming appointment
- "Weigh [Name]" — quick weight entry

**Section Navigation** (tabs or scrollable sections below):
- Vaccinations
- Medications & Treatments
- Weight & Growth
- Vet Visits
- Developmental Milestones
- Health Notes

---

## 4. Vaccination Tracker

### How It Works

At onboarding, PupPal generates a personalized vaccination schedule based on the dog's age and breed. This is the core of the health tracker and the feature most puppy parents desperately need.

### Standard Puppy Vaccination Schedule

Based on AAHA (American Animal Hospital Association) guidelines:

**Core Vaccines** (recommended for all dogs):

| Vaccine | Dose 1 | Dose 2 | Dose 3 | Dose 4 | Boosters |
|---------|--------|--------|--------|--------|----------|
| DHPP (Distemper, Hepatitis, Parainfluenza, Parvovirus) | 6-8 weeks | 10-12 weeks | 14-16 weeks | — | 1 year, then every 3 years |
| Rabies | 12-16 weeks | — | — | — | 1 year, then every 3 years |
| Bordetella (Kennel Cough) | 8 weeks | 12 weeks | — | — | Annually |

**Non-Core Vaccines** (recommended based on lifestyle/region):

| Vaccine | When | Who Needs It |
|---------|------|-------------|
| Leptospirosis | 12 weeks + booster at 16 weeks | Dogs with outdoor exposure, standing water, wildlife areas |
| Lyme Disease | 12 weeks + booster at 16 weeks | Dogs in tick-endemic areas |
| Canine Influenza (H3N2/H3N8) | 8 weeks + booster | Dogs in daycare, boarding, dog parks |
| Rattlesnake | 16+ weeks | Dogs in rattlesnake regions |

### Schedule Generation Logic

When dog is onboarded:

1. Calculate which vaccines are due based on current age
2. If puppy is 8 weeks: generate full schedule from scratch
3. If puppy is older: calculate which vaccines should already be done, mark as "unknown/not logged" and generate remaining schedule
4. If adult dog: show annual booster schedule only
5. Apply breed-specific notes (e.g., some breeds have vaccine sensitivity — Collies, Shelties, Australian Shepherds with MDR1 gene)

```
VaccinationSchedule {
  dog_id: UUID
  generated_at: timestamp
  items: array of ScheduledVaccination
}

ScheduledVaccination {
  id: UUID
  dog_id: UUID
  vaccine_name: string            // "DHPP Booster #2"
  vaccine_type: enum (core / non_core)
  dose_number: integer
  due_date: date                  // calculated from dog's DOB/age
  due_window_start: date          // earliest acceptable date
  due_window_end: date            // latest acceptable date
  status: enum (upcoming / due_soon / overdue / completed / skipped)
  completed_at: timestamp (nullable)
  completed_notes: string (nullable)
  vet_name: string (nullable)
  reminder_sent: boolean
  reminder_date: date (nullable)  // when reminder was/will be sent
  breed_note: string (nullable)   // breed-specific vaccine note
}
```

### Vaccination Screen

**Timeline view** (default):
Vertical timeline showing all vaccinations chronologically:
- Past (completed): green checkmark, date completed, vet name if logged
- Past (not logged): gray question mark, "Not logged — tap to add"
- Upcoming: blue clock icon, due date, days until due
- Overdue: red alert icon, "X days overdue"

**Each vaccination item shows**:
- Vaccine name and dose number
- Due date (or completed date)
- Status badge (completed/upcoming/overdue)
- Tap to expand: full details, log completion, add notes, see breed-specific info

**Log Vaccination**:
1. Tap upcoming or unlogged vaccination
2. Form fields:
   - Date administered (default: today)
   - Vet/clinic name (optional, saved for future autofill)
   - Lot number (optional — some owners track this)
   - Notes (optional)
   - Photo of vaccination record (optional — attach image)
3. Save
4. Status updates to "completed"
5. XP earned: +5 XP (from Gamification PRD #04)
6. Next dose in series auto-scheduled if applicable

**Non-core vaccine management**:
- During onboarding or in health settings: "Does [Name] need any of these?" with toggle for each non-core vaccine
- Brief explanation of each: "Leptospirosis — recommended if [Name] spends time near standing water or in wooded areas"
- User can add/remove non-core vaccines at any time
- Buddy can recommend: "Since you mentioned [Name] goes to dog parks, I'd suggest the Bordetella and Canine Influenza vaccines. Ask your vet!"

---

## 5. Medication & Treatment Tracker

### What It Tracks

Ongoing and one-time medications/treatments:

**Recurring treatments**:
- Flea & tick prevention (monthly or quarterly depending on product)
- Heartworm prevention (monthly)
- Deworming (varies by age — more frequent for puppies)
- Dental care products
- Joint supplements (larger breeds)
- Allergy medications (seasonal or ongoing)

**One-time or as-needed**:
- Antibiotic courses
- Pain medications
- Anti-nausea
- Eye/ear drops
- Post-surgery medications

### Medication Data Model

```
Medication {
  id: UUID
  dog_id: UUID
  name: string                    // "NexGard" or "Heartgard Plus"
  category: enum (flea_tick / heartworm / deworming / dental / supplement / antibiotic / pain / other)
  dosage: string (nullable)       // "68mg" or "1 chewable"
  frequency: enum (daily / weekly / biweekly / monthly / quarterly / as_needed / one_time)
  start_date: date
  end_date: date (nullable)       // null for ongoing
  next_due: date (nullable)       // calculated from frequency
  notes: string (nullable)
  prescribed_by: string (nullable) // vet name
  active: boolean
  created_at: timestamp
}

MedicationEvent {
  id: UUID
  medication_id: UUID
  dog_id: UUID
  administered_at: timestamp
  administered_by: string (nullable)  // "me" or "vet"
  notes: string (nullable)
  logged_at: timestamp
}
```

### Medication Screen

**Active Medications** (top section):
List of current active medications with:
- Name and category icon
- Dosage and frequency
- Next due date
- "Log dose" quick action button

**Log Dose**:
1. Tap "Log dose" on any active medication
2. Confirm date/time (default: now)
3. Optional notes
4. Save — next due date auto-calculates
5. +3 XP

**Add Medication**:
- Name (free text with autocomplete suggestions for common products)
- Category (dropdown)
- Dosage (free text)
- Frequency (dropdown)
- Start date
- End date (optional — leave blank for ongoing)
- Prescribed by (optional)
- Notes (optional)

**Reminders**: Push notification on due date morning: "[Name]'s [medication name] is due today!"

### Breed-Specific Medication Notes

Certain breeds have medication sensitivities:
- MDR1 gene breeds (Collies, Shelties, Aussies, Border Collies): Sensitivity to ivermectin and related drugs. Show warning: "Some [Breed]s carry the MDR1 gene which can cause sensitivity to certain medications. Discuss with your vet."
- Brachycephalic breeds: Anesthesia sensitivity notes for any surgical medications
- Giant breeds: Joint supplement recommendations starting earlier
- Toy breeds: Hypoglycemia medication awareness

These notes display as breed callouts within the medication section when relevant.

---

## 6. Weight & Growth Tracker

### Why It Matters

Puppy growth rate is one of the most important health indicators. Too fast = joint problems (especially large breeds). Too slow = potential health issues. Owners constantly wonder "is [Name] the right size?"

### Weight Logging

**Quick weight entry**:
1. Tap "Weigh [Name]" from health dashboard
2. Enter weight (numeric, with unit toggle: lbs / kg)
3. Date (default: today)
4. Optional notes
5. Save
6. +5 XP

**Weight history chart**:
- Line graph showing weight over time
- X-axis: age in weeks/months
- Y-axis: weight in lbs or kg
- User's data points connected by line
- Breed average growth curve overlaid as shaded range (see below)

### Breed Growth Curves

For each breed, display an expected growth curve showing:
- Average weight range (shaded band: 25th-75th percentile) by age
- User's dog plotted against this range
- Color coding: green (within range), yellow (slightly above/below), red (significantly off)

**Data source**: Breed growth data compiled from veterinary references and breed standards. Separate curves for male/female where significantly different. Mixed breeds use estimated curves based on detected breeds and expected adult weight.

```
BreedGrowthData {
  breed: string
  sex: enum (male / female / average)
  data_points: array of {
    age_weeks: integer,
    weight_low: float,      // 25th percentile
    weight_avg: float,      // 50th percentile
    weight_high: float      // 75th percentile
  }
  expected_adult_weight_low: float
  expected_adult_weight_high: float
}
```

**Display on chart**:
- Shaded band for breed range
- Dotted line for breed average
- Solid line for user's dog
- Tap any data point to see details

**Buddy integration**: If weight is significantly outside range, Buddy proactively mentions it: "[Name] is a bit above the typical range for a [Breed] at [age]. Probably nothing to worry about, but worth mentioning at your next vet visit!"

### Predicted Adult Weight

Based on current growth trajectory and breed data:
- "Based on [Name]'s current growth, estimated adult weight: [X]-[Y] lbs"
- Updated with each weight entry
- Disclaimer: "This is an estimate — ask your vet for a more precise prediction"

### Weight Data Model

```
WeightEntry {
  id: UUID
  dog_id: UUID
  weight_value: float
  weight_unit: enum (lbs / kg)
  weight_kg: float              // normalized for calculations
  measured_at: date
  notes: string (nullable)
  age_at_measurement_weeks: integer  // calculated
  within_breed_range: enum (below / normal / above)
  logged_at: timestamp
}
```

### Reminders

- Monthly weigh-in reminder: "[Name]'s monthly weigh-in is due! Track growth on the health dashboard."
- More frequent for puppies under 6 months (biweekly suggestion)
- Configurable frequency in settings

---

## 7. Vet Visit Tracker

### What It Tracks

All vet visits — routine, sick, emergency — logged with details for a complete medical history.

### Vet Visit Data Model

```
VetVisit {
  id: UUID
  dog_id: UUID
  visit_type: enum (wellness_check / vaccination / sick_visit / emergency / surgery / dental / grooming_medical / other)
  visit_date: date
  vet_clinic: string (nullable)
  vet_name: string (nullable)
  reason: string                 // "Annual wellness check" or "Limping on left front leg"
  diagnosis: string (nullable)
  treatment: string (nullable)
  follow_up_needed: boolean
  follow_up_date: date (nullable)
  follow_up_notes: string (nullable)
  cost: float (nullable)         // optional cost tracking
  documents: array of string     // photo URLs of vet records/receipts
  notes: string (nullable)
  logged_at: timestamp
}
```

### Vet Visit Screen

**Upcoming visits** (top):
- Scheduled appointments with date, clinic, reason
- Countdown: "In 5 days"

**Past visits** (chronological, most recent first):
- Date, type icon, clinic, brief reason
- Tap to expand full details
- Attached documents/photos viewable

**Log Visit**:
- Visit type (dropdown)
- Date
- Clinic/vet (autofill from previous entries)
- Reason (free text)
- Diagnosis (optional)
- Treatment (optional)
- Follow-up needed? (toggle)
- Follow-up date (if yes)
- Cost (optional)
- Attach photos of records (optional)
- Notes
- Save → +5 XP

**Follow-up reminders**: If follow-up_needed = true and follow_up_date set, push notification: "[Name] has a follow-up vet visit due on [date]. Have you scheduled it?"

### Vet Contact Storage

```
VetContact {
  id: UUID
  user_id: UUID
  clinic_name: string
  vet_name: string (nullable)
  phone: string
  email: string (nullable)
  address: string (nullable)
  is_primary: boolean
  is_emergency: boolean          // emergency vet clinic
  notes: string (nullable)
}
```

**Quick actions on vet contact**:
- Tap phone to call
- Tap email to compose
- Tap address to open maps
- Emergency vet contact always accessible from health dashboard

---

## 8. Developmental Milestones

### What It Tracks

Breed and age-specific developmental milestones that aren't training-related but that owners want to know about.

### Milestone Categories

**Physical Development**:
- Eyes open (if applicable — very young puppies)
- Ears standing up (breed-specific — German Shepherds, Corgis)
- Adult teeth coming in (4-6 months)
- Teething complete (6-7 months)
- Reaching adult height (breed-specific: 6-12 months for small, 12-24 months for large)
- Reaching adult weight (breed-specific)
- First heat cycle (females, unspayed — 6-12 months typically)
- Coat change (puppy coat to adult coat — breed-specific timing)

**Behavioral Development**:
- Fear period #1 (8-11 weeks) — important for socialization context
- Fear period #2 (6-14 months) — explains sudden behavior changes
- Adolescent phase onset (6-18 months depending on breed)
- Social maturity (1-3 years depending on breed/size)

**Health Milestones**:
- Spay/neuter recommended window (breed and size dependent)
- First annual wellness exam due
- Transition from puppy to adult food (breed-specific timing)
- Senior health screening starts (breed-specific — large breeds earlier)

### Milestone Data Model

```
DevelopmentalMilestone {
  id: UUID
  name: string                   // "Teething Complete"
  category: enum (physical / behavioral / health)
  description: string            // what it means, what to expect
  typical_age_weeks_start: integer
  typical_age_weeks_end: integer
  breed_modifier: JSON (nullable) // breed-specific timing adjustments
  size_modifier: JSON (nullable)  // size-specific adjustments
  tips: array of string          // what to do during this milestone
  buddy_message: string          // what Buddy says when milestone approaches
  is_trackable: boolean          // can user mark as "happened"
}

UserMilestone {
  id: UUID
  dog_id: UUID
  milestone_id: UUID
  status: enum (upcoming / active / completed / skipped)
  expected_date_start: date      // calculated from dog's age
  expected_date_end: date
  actual_date: date (nullable)   // when user marked it as happened
  notes: string (nullable)
  logged_at: timestamp (nullable)
}
```

### Milestone Display

**Timeline view** (integrated with training plan timeline from PRD #03):
- Milestones appear as distinct markers on the timeline
- Color coded by category: physical (blue), behavioral (orange), health (green)
- Upcoming milestones show expected date range
- Active milestones (currently in window) highlighted
- Completed milestones show actual date

**Milestone detail** (tap to expand):
- Description of what's happening developmentally
- What to expect: "During Fear Period #2, [Name] may suddenly seem afraid of things that didn't bother them before. This is completely normal."
- Tips: "Keep socialization positive. Don't force [Name] into scary situations. Let [Name] approach at their own pace."
- Breed note: "[Breed]s typically experience this between [X] and [Y] months."
- Buddy connection: "Ask Buddy for tips on handling this phase"
- Mark as "Happened" button (if trackable)

### Integration with Training Plan

Key developmental milestones trigger training plan adaptations (from PRD #03):
- Fear period approaching → plan adds extra gentle socialization exercises
- Teething peak → plan adds appropriate chew management exercises
- Adolescent onset → plan adds impulse control emphasis
- These are triggered via the adaptation engine, not manually

### Integration with AI Chat

Buddy is aware of upcoming milestones:
- "Heads up — [Name] is entering the second fear period around this age. If you notice [Name] being more cautious or reactive, that's totally normal. Want me to explain what to expect?"
- "[Name] should be starting to lose puppy teeth soon! Keep an eye out for teeth in toys or on the floor."

---

## 9. Health Notes / Journal

### Purpose

A simple, chronological log for anything health-related that doesn't fit neatly into the structured categories above. Users need a place to jot down observations.

### Examples of Health Notes

- "Noticed [Name] scratching ears a lot — monitor for infection"
- "Switched to new food brand today — watching for digestive issues"
- "Small lump on left side — vet said monitor, recheck in 30 days"
- "Ate something weird at the park — watching for vomiting"
- "First day at daycare — seemed tired but happy"

### Health Note Data Model

```
HealthNote {
  id: UUID
  dog_id: UUID
  content: text
  category: enum (observation / diet / behavior / skin_coat / digestive / injury / medication / general)
  severity: enum (info / monitor / concern / urgent)
  photos: array of string (nullable)
  follow_up_date: date (nullable)
  follow_up_reminder: boolean
  resolved: boolean
  resolved_at: timestamp (nullable)
  created_at: timestamp
  updated_at: timestamp
}
```

### Health Notes Screen

- Chronological list (most recent first)
- Filter by category and severity
- Unresolved notes at top with indicator
- Quick add: tap "+" for new note with category, text, optional photo, optional follow-up
- Follow-up reminders as push notifications

---

## 10. Health Reminders System

### Reminder Types

All health features generate reminders. Here is the complete notification strategy:

| Event Type | Reminder Timing | Push Copy |
|------------|----------------|-----------|
| Vaccination due | 7 days before due date | "[Name]'s [vaccine] is due next week. Time to schedule!" |
| Vaccination overdue | 1 day after due window | "[Name]'s [vaccine] is overdue. Contact your vet to schedule." |
| Medication due (monthly) | Day of | "[Name]'s [medication] is due today!" |
| Medication due (daily) | User-configured time | "Time for [Name]'s [medication]" |
| Weight check | Monthly (or biweekly for young puppies) | "Monthly weigh-in time! How much does [Name] weigh now?" |
| Vet visit follow-up | 3 days before follow-up date | "[Name]'s follow-up vet visit is on [date]. Have you scheduled?" |
| Developmental milestone approaching | When dog enters expected window | "[Name] is entering [milestone]. Here's what to expect!" |
| Spay/neuter window | When dog reaches breed-appropriate age | "[Name] is reaching the age to discuss spay/neuter with your vet." |
| Annual wellness | 1 year from last wellness visit (or from DOB) | "Time for [Name]'s annual wellness check!" |
| Health note follow-up | On follow-up date | "Follow up on your note about [Name]: [first 50 chars of note]" |

### Reminder Settings

Users can configure:
- Enable/disable each reminder category independently
- Set preferred reminder time (morning/afternoon/evening)
- Medication reminders: set specific daily time
- Snooze any individual reminder (1 day / 3 days / 1 week)
- Dismiss reminder (won't remind again for this specific event)

### Reminder Data Model

```
HealthReminder {
  id: UUID
  dog_id: UUID
  user_id: UUID
  source_type: enum (vaccination / medication / weight / vet_visit / milestone / health_note / annual)
  source_id: UUID                // references the specific vaccination, medication, etc.
  title: string
  body: string
  scheduled_for: timestamp
  status: enum (pending / sent / snoozed / dismissed / actioned)
  snoozed_until: timestamp (nullable)
  sent_at: timestamp (nullable)
  actioned_at: timestamp (nullable)  // user logged the related event
}
```

---

## 11. Health Record Export

### Why It Matters

Users need to share health records with:
- New vet clinics
- Boarding facilities (require vaccination proof)
- Dog daycare
- Pet sitters
- Groomers
- Travel documentation (international travel requires specific vaccination records)

### Export Format

**PDF Health Summary**:
- Dog profile: name, breed, age, weight, photo
- Vaccination history: table with vaccine name, date administered, next due
- Current medications: name, dosage, frequency
- Recent vet visits: date, type, clinic
- Allergies / special conditions (from health notes flagged as ongoing)
- Generated date and PupPal branding

**Share options**:
- Email (PDF attachment)
- Native share sheet (WhatsApp, iMessage, etc.)
- Save to device files
- Print

### Export Data Model

```
HealthExport {
  id: UUID
  dog_id: UUID
  user_id: UUID
  export_type: enum (full_record / vaccination_only / vet_summary)
  format: enum (pdf)
  generated_at: timestamp
  file_url: string
}
```

### Export API

```
POST /api/health/{dog_id}/export
  Body: { export_type, format }
  Response: { file_url }
  Auth: Premium only
```

---

## 12. Free vs Premium Health Access

### Free Tier

- See next 2 upcoming health events (vaccinations, milestones)
- Titles and due dates visible, full details locked
- 1 health reminder active (next vaccination)
- Weight entry: 1 entry (current weight), no history chart
- Breed growth curve preview (blurred/locked)
- "Upgrade to unlock full health tracking" CTA throughout
- Buddy can reference health features: "[Name]'s next vaccination is coming up — the health tracker can remind you automatically!"

### Premium Tier

- Full vaccination tracker with personalized schedule
- Unlimited medication tracking with reminders
- Complete weight history with breed growth curve comparison
- Unlimited vet visit logging with document attachments
- All developmental milestones with breed-specific timing
- Unlimited health notes with follow-up reminders
- Health record PDF export
- All health-related push reminders active
- Vet contact storage

### Why This Gating Works

Health tracking is inherently long-term. Free users see enough to understand the value (upcoming vaccination with date) but need premium for the full system. The gating is gentle — they know exactly what they're getting. And because health tracking extends FAR beyond the 12-week training plan, it's a reason to maintain the annual subscription indefinitely.

---

## 13. Breed-Specific Health Intelligence

### Breed Health Profiles

Each breed has a health profile with common conditions and recommended screenings.

```
BreedHealthProfile {
  breed: string
  common_conditions: array of {
    condition: string,           // "Hip Dysplasia"
    prevalence: enum (high / moderate / low),
    description: string,
    symptoms_to_watch: array of string,
    recommended_screening: string (nullable),
    screening_age: string (nullable)
  }
  life_expectancy_low: integer   // years
  life_expectancy_high: integer
  adult_weight_low: float        // lbs
  adult_weight_high: float
  size_category: enum (toy / small / medium / large / giant)
  spay_neuter_recommendation: string  // breed-specific timing guidance
  exercise_needs: string
  diet_notes: string (nullable)  // breed-specific dietary considerations
  heat_sensitivity: boolean      // brachycephalic breeds
  cold_sensitivity: boolean      // small/thin-coat breeds
  medication_sensitivities: array of string (nullable)  // MDR1 etc.
}
```

### Examples

**Golden Retriever**:
- Common: Hip dysplasia (high), elbow dysplasia (moderate), cancer (high), heart disease (moderate)
- Screenings: Hip evaluation, elbow evaluation, cardiac exam, eye exam
- Life expectancy: 10-12 years
- Diet: Prone to obesity, monitor caloric intake
- Spay/neuter: Discuss with vet; some research suggests waiting until 12-18 months for large breeds

**French Bulldog**:
- Common: Brachycephalic airway syndrome (high), allergies (high), spinal issues (moderate), cherry eye (moderate)
- Screenings: Cardiac, patellar, ophthalmological
- Heat sensitivity: YES — critical warning about heat exposure
- Diet: Food allergies common, hypoallergenic diet may be needed

**Pomeranian**:
- Common: Patellar luxation (high), dental disease (high), tracheal collapse (moderate), alopecia (low)
- Screenings: Patellar, cardiac, dental checks
- Diet: Small breed specific (frequent small meals, hypoglycemia risk as puppies)

### How It's Displayed

**Breed Health Card** (accessible from health dashboard):
- "[Name]'s Breed Health Profile: [Breed]"
- Common conditions listed with prevalence indicators
- Recommended screenings with suggested age
- General breed health tips
- Disclaimer: "This information is for general awareness. Consult your vet for [Name]'s specific health needs."

**Buddy integration**: Buddy references breed health naturally:
- "Since [Name] is a Golden Retriever, it's worth asking your vet about hip evaluations when [Name] is around 2 years old."
- "French Bulldogs can overheat easily. On hot days, keep outdoor time short and always have water available."

---

## 14. Integration Points

### With Training Plan (PRD #03)

- Health milestones appear on the training timeline
- Developmental milestones trigger plan adaptations (fear periods, teething, adolescence)
- Post-surgery or post-illness: user can pause training plan from health tracker
- Spay/neuter recovery: auto-suggest 7-14 day training pause

### With AI Mentor Chat (PRD #02)

- Buddy knows upcoming health events: "[Name]'s DHPP booster is due next week — have you scheduled the vet visit?"
- Buddy references breed health: breed-specific tips and awareness
- Buddy redirects medical questions to vet but can provide general health info
- Health events provide chat context (post-surgery care questions, etc.)

### With Gamification (PRD #04)

- Logging health events earns XP (+5 per event, +3 per medication dose)
- Future: Health-specific achievements ("Vaccination Champion" — all puppy vaccines on time)
- Weight logging earns XP (+5)

### With Push Notifications

- All health reminders (Section 10) sent as push notifications
- Respect notification settings and quiet hours
- Health reminders are independent of training/gamification notifications

---

## 15. Data Model (Complete)

(ScheduledVaccination, Medication, MedicationEvent, WeightEntry, VetVisit, VetContact, DevelopmentalMilestone, UserMilestone, HealthNote, HealthReminder, HealthExport, BreedHealthProfile, BreedGrowthData all defined in their respective sections above.)

### Summary of Core Models

```
ScheduledVaccination    — personalized vaccine schedule per dog
Medication              — active/past medications with frequency
MedicationEvent         — individual dose logs
WeightEntry             — weight measurements over time
VetVisit                — vet appointment records with documents
VetContact              — stored vet clinic/doctor info
DevelopmentalMilestone  — breed/age milestones (template)
UserMilestone           — per-dog milestone tracking
HealthNote              — freeform health journal entries
HealthReminder          — scheduled push notifications
HealthExport            — generated PDF records
BreedHealthProfile      — breed-specific conditions and screenings
BreedGrowthData         — breed growth curves for weight comparison
```

---

## 16. API Endpoints

```
// Vaccinations
GET /api/health/{dog_id}/vaccinations
  Response: Full vaccination schedule with statuses

POST /api/health/{dog_id}/vaccinations/{id}/complete
  Body: { date, vet_name, lot_number, notes, photo }
  Response: Updated vaccination + next dose scheduled

POST /api/health/{dog_id}/vaccinations/settings
  Body: { non_core_vaccines: array of enabled vaccine types }

// Medications
GET /api/health/{dog_id}/medications
  Response: Active and past medications

POST /api/health/{dog_id}/medications
  Body: { name, category, dosage, frequency, start_date, ... }
  Response: Created medication with first reminder scheduled

POST /api/health/{dog_id}/medications/{id}/log-dose
  Body: { date, notes }
  Response: Updated medication + next due calculated

PUT /api/health/{dog_id}/medications/{id}
  Body: { updates }

DELETE /api/health/{dog_id}/medications/{id}
  Soft delete (deactivate)

// Weight
GET /api/health/{dog_id}/weight
  Response: Weight history + breed growth curve data

POST /api/health/{dog_id}/weight
  Body: { weight_value, weight_unit, date, notes }
  Response: Weight entry + breed range comparison

GET /api/health/{dog_id}/weight/prediction
  Response: Predicted adult weight range

// Vet Visits
GET /api/health/{dog_id}/vet-visits
  Response: Paginated vet visit history

POST /api/health/{dog_id}/vet-visits
  Body: { visit_type, date, clinic, reason, diagnosis, treatment, follow_up, cost, documents, notes }

PUT /api/health/{dog_id}/vet-visits/{id}

// Vet Contacts
GET /api/health/vet-contacts
  Response: User's saved vet contacts

POST /api/health/vet-contacts
  Body: { clinic_name, vet_name, phone, email, address, is_primary, is_emergency }

// Milestones
GET /api/health/{dog_id}/milestones
  Response: All milestones with status and expected dates

POST /api/health/{dog_id}/milestones/{id}/complete
  Body: { actual_date, notes }

// Health Notes
GET /api/health/{dog_id}/notes
  Response: Paginated health notes
  Filters: category, severity, resolved status

POST /api/health/{dog_id}/notes
  Body: { content, category, severity, photos, follow_up_date }

PUT /api/health/{dog_id}/notes/{id}
DELETE /api/health/{dog_id}/notes/{id}

POST /api/health/{dog_id}/notes/{id}/resolve
  Body: { resolution_notes }

// Reminders
GET /api/health/{dog_id}/reminders
  Response: Pending and upcoming reminders

POST /api/health/{dog_id}/reminders/{id}/snooze
  Body: { snooze_until }

POST /api/health/{dog_id}/reminders/{id}/dismiss

// Export
POST /api/health/{dog_id}/export
  Body: { export_type, format }
  Response: { file_url }

// Breed Health
GET /api/breeds/{breed}/health-profile
  Response: BreedHealthProfile

GET /api/breeds/{breed}/growth-curve
  Response: BreedGrowthData
```

---

## 17. Technical Requirements

### Performance

| Requirement | Target |
|-------------|--------|
| Health dashboard load | <500ms |
| Vaccination schedule generation | <1 second |
| Weight chart render (with growth curve) | <1 second |
| Health event logging | <300ms |
| PDF export generation | <5 seconds |

### Offline Support

- Health dashboard viewable offline (cached)
- Log health events offline (queued, synced on reconnect)
- Weight entries cached and chartable offline
- Vaccination schedule viewable offline
- PDF export requires connection
- Reminders fire from local scheduling if offline

### Data Privacy

- All health data encrypted at rest
- Health data not shared with any third party
- Health record export controlled by user only
- Photo attachments (vet records) in private storage
- GDPR: user can delete all health data
- Health data excluded from any analytics that could identify individual dogs

### Image Handling

- Vet record photos: compress to 2MB max
- Store in private S3/R2 bucket
- Accessible only by authenticated user who owns the dog
- Support JPEG, PNG, HEIC
- Display in vet visit detail and vaccination detail

---

## 18. Edge Cases

| Scenario | Handling |
|----------|----------|
| Dog adopted as adult with unknown vaccination history | Allow marking all past vaccinations as "unknown." Generate schedule from current age forward. Recommend vet titer test to determine immunity. |
| User enters weight in wrong unit | Unit toggle (lbs/kg) with auto-conversion. Detect likely errors (e.g., 70kg for a Chihuahua) and prompt: "That seems high for a [Breed] — did you mean lbs?" |
| Multiple vaccination schedules differ from vet's recommendation | Display standard AAHA schedule with note: "Your vet may adjust this schedule. Always follow your vet's specific recommendations for [Name]." |
| Breed not in health profile database | Use breed group defaults (AKC grouping). Show general health info without breed-specific conditions. Note: "We don't have specific data for [breed] yet. Ask your vet about breed-specific health concerns." |
| Mixed breed health profile | Combine common conditions from both detected breeds. Use larger breed's growth curve if size uncertain. Note both breeds' risks. |
| User logs future vaccination (pre-scheduling) | Allow logging future date as "scheduled." Status: upcoming. Don't mark as completed until user confirms. |
| Medication frequency changes | Allow editing active medication. Recalculate next due date from change date. |
| Dog passes away | Sensitive handling. Allow archiving dog's profile and health records. Keep data accessible but remove from active dashboard and all reminders. No cheerful messaging. |
| Vaccination recalled or protocol changes | Admin can push updates to vaccination schedules. Notify affected users. |
| Spay/neuter recommendation controversial (timing debate) | Present balanced information with breed-specific data. Always recommend discussing with vet. Never prescriptive. |
| User attaches non-image file to vet visit | Only accept image files (JPEG, PNG, HEIC). Show error for other formats. Future: PDF support for vet records. |
| User in country with different vaccination schedule | V1: US-based AAHA schedule. Note: "Vaccination schedules may vary by region. Consult your local vet." Future: regional schedule support. |
| Health reminder sent but user already logged the event | Check before sending. If event already logged, skip reminder or send congratulatory message instead. |

---

## 19. Open Questions

1. **Vaccination data source**: Use AAHA guidelines as baseline. Need a veterinary advisor to review and validate all vaccine schedules and breed health profiles?
2. **Breed growth curves**: Data source? Compile from veterinary references, or partner with a data provider? Need male/female separate curves for all breeds or just sexually dimorphic ones?
3. **Insurance integration**: Future feature — partner with pet insurance providers? Show recommended coverage based on breed health profile?
4. **Vet integration**: Future — direct integration with vet clinics for automatic record sync? (Complex but high-value. Defer to v2+.)
5. **Regional vaccination schedules**: V1 US-only. When to add UK, EU, AU schedules?
6. **Medication database**: Should we build an autocomplete database of common pet medications (with dosage ranges per weight), or keep it freeform?
7. **Health alerts**: Should Buddy proactively alert about breed-specific seasonal risks (heatstroke for brachy breeds in summer, antifreeze risk in winter)?
8. **Multi-pet types**: Ever expand beyond dogs? (Cats, etc.) If so, health tracker architecture should be species-agnostic.
9. **PDF template design**: Branded PDF that looks professional when shared with vet/boarding. Who designs this?
10. **Wearable integration**: Future — integrate with Fi, Whistle, or other dog activity trackers for automatic activity and health data? 

---

## 20. Dependencies

| Dependency | Purpose | Fallback |
|------------|---------|----------|
| Breed Health Profile database | Breed-specific conditions, screenings | Generic health info |
| Breed Growth Curve data | Weight comparison charts | No comparison, just raw data |
| AAHA vaccination guidelines | Standard vaccine schedules | Simplified generic schedule |
| Push notification service | Health reminders | In-app reminders only |
| PDF generation library | Health record export | No export (defer) |
| Image storage (S3/R2) | Vet record photos | No photo attachment |
| AI Chat (PRD #02) | Buddy health context and references | Health works standalone |
| Training Plan (PRD #03) | Milestone-triggered plan adaptations | Health works standalone |
| Gamification (PRD #04) | XP on health logging | Health works without XP |

---

## 21. Acceptance Criteria

- [ ] Vaccination schedule generates correctly based on dog age and breed at onboarding
- [ ] Vaccination timeline displays all core vaccines with correct due dates and statuses
- [ ] Non-core vaccines configurable (add/remove) with appropriate recommendations
- [ ] Logging a vaccination updates status, schedules next dose, earns XP
- [ ] Overdue vaccinations show red alert with appropriate urgency
- [ ] Medication tracker supports adding, logging doses, editing, and deactivating
- [ ] Medication reminders fire at correct times based on frequency
- [ ] Weight entry works with lbs/kg toggle and auto-conversion
- [ ] Weight chart displays user data against breed growth curve
- [ ] Predicted adult weight calculates and displays with disclaimer
- [ ] Vet visits log with all fields including document photo attachments
- [ ] Follow-up reminders fire for vet visits with follow-up dates
- [ ] Vet contacts stored with quick-action call/email/maps
- [ ] Developmental milestones display with breed-specific timing
- [ ] Milestone detail shows description, tips, and breed notes
- [ ] Health notes support CRUD with category, severity, follow-up reminders
- [ ] Health reminders fire for all event types at configured times
- [ ] Reminder snooze and dismiss work correctly
- [ ] PDF health record exports with vaccination history, medications, and vet visits
- [ ] Breed health profile displays common conditions and screening recommendations
- [ ] Breed-specific medication sensitivity warnings display where applicable
- [ ] Free users see 2 upcoming events, locked detail, 1 active reminder
- [ ] Premium users have full access to all health features
- [ ] All health data encrypted at rest
- [ ] Multiple dogs have independent health records
- [ ] Buddy references upcoming health events in chat context
- [ ] Health milestones trigger training plan adaptations where configured
- [ ] Offline: dashboard viewable, events queueable, reminders fire locally
- [ ] All analytics tracked: health_event_logged, reminder_sent, reminder_actioned, export_generated, weight_logged
