# PRD #10: Growth Journal & Progress Timeline

## PupPal — "Timehop for Your Dog"

**Document version**: 1.0
**Feature owner**: Ashley
**Status**: Draft
**Priority**: P1 — The most emotionally powerful feature in PupPal. Drives long-term retention, sharing, and the "I can't delete this app — all my memories are here" lock-in effect.

---

## 1. Overview & Purpose

The Growth Journal is a chronological timeline that combines user-uploaded photos and notes with auto-generated training milestones, health events, and gamification achievements. It's where users go to see how far their puppy has come.

This is PupPal's secret retention weapon. The training plan solves a problem (anxiety). Tricks provide ongoing engagement. But the Growth Journal creates **emotional lock-in** — deleting PupPal means losing the record of your puppy's entire journey.

### Why This Feature Wins

1. **Backdating**: Users who join with a 6-month-old can upload baby photos and notes retroactively. Timeline is rich from Day 1.
2. **Auto-populated**: Training completions, health events, achievements all appear automatically. Beautiful timeline even if they never manually add anything.
3. **Monthly recaps**: Auto-generated "month in review" cards with stats and photos — most shareable content in the app.
4. **Before/after**: App automatically surfaces "X weeks ago" throwbacks. Tiny puppy next to today's adolescent is pure emotional gold.

### Success Metrics

| Metric | Target |
|--------|--------|
| Journal photo upload rate | 30%+ of premium users in first month |
| Backdated entries | 40%+ of users with dogs >12 weeks backdate at least 1 |
| Monthly recap view rate | 60%+ of premium users view recap |
| Monthly recap share rate | 15%+ of recap views generate share |
| Throwback engagement | 20%+ of throwback notifications opened |
| Journal-driven retention | 5+ entries = 2x retention at month 3 |

---

## 2. Timeline Architecture

### Entry Types

**Manual (user-created)**: Photo with optional caption and date, Note (text observation), Weight entry (also in Health Tracker).

**Auto-generated (system)**: Exercise milestones, achievement unlocks, streak milestones (7/14/30/60/90), GBS milestones (every 10 pts), level ups, trick completions, health events (vaccination, vet visit), developmental milestones, plan graduation, app milestones (1 week, 1 month, 6 months, 1 year).

### Data Model

```
JournalEntry {
  id: UUID
  user_id: UUID
  dog_id: UUID
  entry_type: enum (photo/note/weight/exercise_milestone/achievement/streak_milestone/score_milestone/level_up/trick_complete/health_event/developmental_milestone/plan_milestone/app_milestone)
  source: enum (user/system)
  title: string
  body: string (nullable)
  photo_urls: array of string (0-5)
  thumbnail_url: string (nullable)
  entry_date: date                    // supports backdating
  entry_time: time (nullable)
  dog_age_weeks: integer (nullable)   // calculated from entry_date
  dog_age_label: string (nullable)    // "10 weeks", "4 months"
  reference_type: string (nullable)
  reference_id: UUID (nullable)
  is_backdated: boolean (default false)
  is_pinned: boolean (default false)
  is_hidden: boolean (default false)  // for hiding auto entries
  is_shared: boolean (default false)
  shared_at: timestamp (nullable)
  created_at: timestamp
  updated_at: timestamp
}

JournalPhoto {
  id: UUID
  entry_id: UUID
  photo_url: string
  thumbnail_url: string
  width: integer
  height: integer
  sort_order: integer
  created_at: timestamp
}

MonthlyRecap {
  id: UUID
  user_id: UUID
  dog_id: UUID
  month: integer (1-12)
  year: integer
  exercises_completed: integer
  tricks_learned: integer
  streak_best: integer
  score_start: integer
  score_end: integer
  score_change: integer
  achievements_unlocked: integer
  photos_added: integer
  weight_start: float (nullable)
  weight_end: float (nullable)
  highlight_entry_ids: array of UUID
  cover_photo_url: string (nullable)
  recap_card_url: string (nullable)
  generated_at: timestamp
  viewed_at: timestamp (nullable)
  shared_at: timestamp (nullable)
}
```

---

## 3. Timeline UI

### Main Screen

Chronological feed grouped by month. Each entry shows: date, dog age at that date, entry card (photo/note/milestone). Filter tabs: All, Photos, Milestones. FAB button: "+ Add Memory."

**Photo entries**: Photo thumbnail(s) with caption. Tap for full gallery. Shows dog age.

**Note entries**: Text card with warm gold tint background (#FFF6E5). Optional photo.

**Auto milestone entries**: Compact cards with icon + title + brief description. Color-coded: coral (achievements), gold (gamification), sage (health), navy (plan).

### Age Labels

Calculated from dog birthdate: under 12w = "X weeks", 12w-6mo = "X weeks/months", 6mo-2yr = "X months", 2yr+ = "X years, Y months".

---

## 4. Adding Entries

### Photo Entry

1-5 photos via camera or library. Optional caption. Date defaults to today, tap to change (backdating). Dog age auto-calculated. EXIF date extracted as suggestion.

### Note Entry

Text area + optional photos. Same date/backdating UI.

### Backdating Flow

Calendar picker allows any date from dog birthdate to today. Backdated entries show subtle badge. On onboarding for dogs >12 weeks: Buddy prompts "Want to add some early memories?"

### Photo Storage

Supabase Storage private bucket, RLS-protected. Thumbnails auto-generated (300px). Originals max 2000px compressed. Path: `journals/{user_id}/{dog_id}/{entry_id}/{photo_id}.jpg`.

---

## 5. Auto-Generated Entries

System creates entries on events: first exercise complete, week complete, plan graduation, achievement unlock, streak milestone, GBS milestone, level up, trick mastered, vaccination logged, vet visit, developmental milestone, app anniversary milestones.

**Rules**: Created silently, visible immediately, cannot be deleted (can be hidden), don't trigger individual notifications.

---

## 6. Monthly Recaps

Generated on 1st of month via cron Edge Function. Calculates: exercises completed, tricks learned, best streak, score change, achievements, photos, weight change. Selects top 3-5 highlights. Generates shareable card image.

**Recap card (shareable)**: Dog name, month, 2 best photos, stats grid, highlights list, referral link. Optimized for Instagram Stories (1080×1920).

**In-app recap**: Cover photo/collage, stat cards (animated), score progression, highlight entries, share button.

**Push notification**: "📸 {dog_name}'s {month} recap is ready!"

---

## 7. Throwback / "On This Day"

When entries exist 1/3/6/12 months ago: surface throwback card on home screen and send push notification.

**Home screen card**: "ON THIS DAY — 3 months ago" with old photo, dog age then, caption.

**Before/after generator**: Side-by-side old photo vs recent photo with stat comparisons (weight, score, tricks). Requires recent photo within 7 days — if none, prompts user to add one. Shareable with referral link.

---

## 8. Free vs Premium

| Feature | Free | Premium |
|---------|------|---------|
| View auto timeline (Week 1) | ✅ | ✅ |
| View all auto timeline | Preview titles only | ✅ |
| Add photos/notes | ❌ | ✅ |
| Backdate entries | ❌ | ✅ |
| Monthly recaps | Cover card only | ✅ Full |
| Throwbacks | ❌ | ✅ |
| Before/after | ❌ | ✅ |
| Share moments | Week 1 only | ✅ All |
| Pin entries | ❌ | ✅ |

---

## 9. API Endpoints

```
GET /api/journal/{dog_id}                       — Timeline (paginated, filtered)
POST /api/journal/{dog_id}/entry                — Create entry
PUT /api/journal/entry/{id}                     — Update entry
DELETE /api/journal/entry/{id}                  — Delete manual entry
POST /api/journal/entry/{id}/pin                — Pin/unpin
POST /api/journal/entry/{id}/hide               — Hide auto entry
POST /api/journal/{dog_id}/upload-photo         — Upload photo
GET /api/journal/{dog_id}/recap/{year}/{month}  — Monthly recap
GET /api/journal/{dog_id}/throwback             — Today's throwback
POST /api/journal/{dog_id}/before-after         — Generate before/after
POST /api/share/journal-entry/{id}              — Share card
POST /api/share/recap/{recap_id}                — Share recap
```

---

## 10. Edge Cases

| Scenario | Handling |
|----------|----------|
| Backdate before birthdate | Prevent. Picker min = birthdate. |
| No recent photo for before/after | Prompt to add photo. Don't generate incomplete. |
| Zero-activity month recap | Generate: "Quiet month! {name} is resting." |
| Delete manual entry | Soft delete. Photos purged after 30 days. |
| Delete auto entry | Can't delete. Can hide. |
| Dog birthdate unknown | Use estimate. Age shows "~X weeks". |
| Change dog birthdate | Recalculate all age labels. |
| Multiple dogs | Independent journals. Filter by dog. |
| Photo upload fails | Queue locally. Retry on reconnect. |

---

## 11. Acceptance Criteria

- [ ] Timeline displays manual + auto entries chronologically
- [ ] Filter tabs (All/Photos/Milestones) work
- [ ] Photo entry supports 1-5 photos with caption and date
- [ ] Backdating with calendar picker from birthdate to today
- [ ] EXIF date pre-fills entry date
- [ ] Dog age correct on every entry
- [ ] Auto entries generate for all trigger events
- [ ] Auto entries can be hidden, not deleted
- [ ] Photos upload with thumbnails generated
- [ ] Monthly recap generates on 1st of month
- [ ] Recap shareable with stats and photos
- [ ] Throwback shows on home screen at 1/3/6/12 month intervals
- [ ] Before/after generates side-by-side with stats
- [ ] Share cards include referral link
- [ ] Free gating correct per matrix
- [ ] Timeline paginated (20 per page)
- [ ] All analytics events fire
