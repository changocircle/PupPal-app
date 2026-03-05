# PRD #15: Community & Social Features

## PupPal — Train Together

**Document version**: 1.0
**Priority**: P3 — Post-launch feature. Community is a retention multiplier and content generation engine, but it requires moderation infrastructure and a critical mass of users (~1,000+) to feel alive. Ship v1 without it, add when user base supports it.

---

## 1. Overview

A lightweight community feed where PupPal users share training wins, ask questions, celebrate milestones, and connect. NOT a full social network — a focused, moderated space for puppy parents.

### Why Community (Eventually)

1. **Retention**: Social connection keeps users returning even after training plan completes
2. **Content generation**: Users create the content (photos, tips, questions) — no content production cost
3. **Social proof**: New users see active, happy community → trust → conversion
4. **Support reduction**: Users help each other → fewer support tickets
5. **Virality**: Community screenshots shared externally → organic acquisition

### Why NOT Now

1. Empty community = worse than no community (ghost town effect)
2. Moderation requires resources (AI + human review)
3. User reports, blocking, and content policy add complexity
4. Community features in every app feel generic unless thoughtfully designed
5. Core experience must be solid first

### Launch Threshold

Launch community when: 1,000+ active premium users, or 5,000+ total installs, whichever comes first.

---

## 2. Feed Architecture

### Content Types

**Win Posts**: User shares a training milestone, trick video, or achievement. Auto-attached: achievement badge or milestone card. Encouraged by prompts after completions.

**Question Posts**: User asks training question to community. Buddy can optionally provide a "Buddy's Take" answer alongside community responses. Categories: potty, biting, obedience, health, socialization, behavior, tricks, general.

**Photo Posts**: Dog photos with captions. Most engaging content type on any pet platform. Optional breed tag.

**Milestone Auto-Posts** (opt-in): When user shares an achievement/streak/graduation from within the app, it can optionally post to community feed (requires user to tap "Share to Community" — never auto-posted without consent).

### What It Is NOT

- Not a messaging/DM platform (no 1:1 chat)
- Not a marketplace (no selling)
- Not a dating app for dogs (no matching)
- Not a full social graph (no follow/friend system in v1)

---

## 3. Feed UI

```
┌─────────────────────────────┐
│  Community                   │
│  [All] [Wins] [Questions]    │  ← Filter tabs
│  [Photos] [My Breed]         │  ← "My Breed" filters to same breed
│                              │
│  ┌─────────────────────────┐ │
│  │ 🐕 Luna's Mom · 2h ago  │ │  ← User display name + time
│  │ Golden Retriever · Wk 3  │ │
│  │                          │ │
│  │ Luna finally stopped     │ │  ← Post text
│  │ pulling on the leash!!   │ │
│  │ Week 3 exercises worked  │ │
│  │ like magic 🎉            │ │
│  │                          │ │
│  │ [PHOTO]                  │ │
│  │                          │ │
│  │ ❤️ 24  💬 8  🐾 Share    │ │  ← Like, comment, share
│  └─────────────────────────┘ │
│                              │
│  ┌─────────────────────────┐ │
│  │ ❓ Max's Dad · 5h ago    │ │  ← Question post
│  │ French Bulldog · Wk 1    │ │
│  │                          │ │
│  │ How long did potty       │ │
│  │ training take for your   │ │
│  │ Frenchie? Max is having  │ │
│  │ a rough time...          │ │
│  │                          │ │
│  │ 🤖 Buddy's Take:         │ │  ← Optional AI-assisted answer
│  │ French Bulldogs typically │ │
│  │ take 4-6 months for...   │ │
│  │                          │ │
│  │ ❤️ 12  💬 15             │ │
│  └─────────────────────────┘ │
│                              │
│  ┌───────────────────────┐   │
│  │  + Share a Win 🐾     │   │  ← Post creation FAB
│  └───────────────────────┘   │
└─────────────────────────────┘
```

### Buddy's Take

For question posts, Buddy can optionally provide an AI-generated answer based on the breed and question context. This appears as a highlighted card within the post. Buddy's answers are generated via Edge Function and cached.

Rules: Buddy's Take is a helpful starting point, not medical/behavioral authority. Always includes: "For specific concerns about {breed}, talk to your vet or a certified trainer."

---

## 4. Data Model

```
CommunityPost {
  id: UUID
  user_id: UUID
  dog_id: UUID
  post_type: enum (win/question/photo/milestone)
  content: string                     // Post text (max 500 chars)
  photo_urls: array of string (0-4)
  category: string (nullable)         // For questions: potty, biting, etc.
  breed_tag: string (nullable)        // Breed for filtering
  milestone_type: string (nullable)   // If shared from achievement
  milestone_data: JSON (nullable)     // Achievement/streak data
  buddy_take: string (nullable)       // AI-generated answer for questions
  likes_count: integer (default 0)
  comments_count: integer (default 0)
  reported: boolean (default false)
  hidden: boolean (default false)     // Mod action
  created_at: timestamp
}

CommunityComment {
  id: UUID
  post_id: UUID
  user_id: UUID
  content: string (max 300 chars)
  likes_count: integer (default 0)
  reported: boolean (default false)
  hidden: boolean (default false)
  created_at: timestamp
}

CommunityLike {
  id: UUID
  user_id: UUID
  target_type: enum (post/comment)
  target_id: UUID
  created_at: timestamp
  UNIQUE(user_id, target_type, target_id)
}

CommunityReport {
  id: UUID
  reporter_user_id: UUID
  target_type: enum (post/comment)
  target_id: UUID
  reason: enum (spam/inappropriate/harmful/harassment/off_topic/other)
  reason_text: string (nullable)
  status: enum (pending/reviewed/actioned/dismissed)
  reviewed_by: string (nullable)
  created_at: timestamp
}

UserBlock {
  id: UUID
  blocker_user_id: UUID
  blocked_user_id: UUID
  created_at: timestamp
}
```

---

## 5. Moderation

### AI Pre-Moderation

Before any post goes live:
1. Content scanned for: profanity, harassment, harmful advice, spam, self-promotion
2. Images scanned for: NSFW content, non-dog images (off-topic)
3. If flagged: post held for manual review, user sees "Post under review"
4. If clean: post goes live immediately

Use: Supabase Edge Function calling moderation API (OpenAI Moderation endpoint or similar).

### Community Guidelines

- Be kind and supportive
- Share training experiences and questions
- No medical advice (direct to vet)
- No selling or self-promotion
- No politics, religion, or off-topic content
- Photos must include your dog (no memes, stock photos)
- Respect privacy (don't share others' photos without permission)

### User Reporting

Any post or comment: "Report" option. Reasons: spam, inappropriate, harmful, harassment, off-topic, other. 3 reports = auto-hidden pending review. User gets notification if their post is removed.

### User Blocking

Block user: their posts hidden from blocker's feed, they can't comment on blocker's posts, no notification to blocked user.

---

## 6. Free vs Premium

| Feature | Free | Premium |
|---------|------|---------|
| Browse feed | ✅ Read-only | ✅ |
| Like posts | ❌ | ✅ |
| Comment | ❌ | ✅ |
| Create posts | ❌ | ✅ |
| "My Breed" filter | ✅ | ✅ |
| Buddy's Take on questions | ✅ Viewable | ✅ |

Free users can browse (social proof, see the community is active) but can't participate. This is a conversion lever: "Join the community with Premium."

---

## 7. Feed Algorithm (v1: Simple)

v1: Reverse chronological with basic boosting.

**Boost factors**: Posts with photos rank higher, posts from same breed rank higher for "My Breed" filter, questions with 0 answers rank higher (surface unanswered questions), posts with high like-to-view ratio rank higher.

**v2 (future)**: Machine learning ranking based on engagement prediction, personalized feed based on breed and training week.

---

## 8. API Endpoints

```
GET /api/community/feed                  — Paginated feed (filters: all/wins/questions/photos/breed)
POST /api/community/posts                — Create post
GET /api/community/posts/{id}            — Post detail with comments
DELETE /api/community/posts/{id}         — Delete own post
POST /api/community/posts/{id}/like      — Like/unlike
POST /api/community/posts/{id}/report    — Report post

GET /api/community/posts/{id}/comments   — Comments on post
POST /api/community/posts/{id}/comments  — Add comment
DELETE /api/community/comments/{id}      — Delete own comment
POST /api/community/comments/{id}/like   — Like comment
POST /api/community/comments/{id}/report — Report comment

POST /api/community/users/{id}/block     — Block user
DELETE /api/community/users/{id}/block   — Unblock user
GET /api/community/blocked               — List blocked users
```

---

## 9. Edge Cases

| Scenario | Handling |
|----------|----------|
| Empty feed (early days) | Show "Be the first to share!" + seed with team-created posts |
| Harmful training advice in community | AI moderation flags. Buddy's Take provides correct info. Report system. |
| User posts medical question | Buddy's Take always includes "consult your vet." Community guidelines state no medical advice. |
| Spam/self-promotion | AI pre-mod catches most. Report system for rest. Repeat offenders: shadow ban. |
| User posts non-dog photo | Image classification rejects. "Please share photos of your pup!" |
| Deleted user's posts | Anonymize: "Deleted User" with generic avatar. Posts remain unless explicitly deleted. |
| Blocked user comments on my post | Comment hidden from blocker. Others can still see it. |
| Post goes viral (1000+ likes) | No special handling in v1. Ensure feed pagination handles gracefully. |

---

## 10. Acceptance Criteria

- [ ] Community feed loads with pagination
- [ ] Filter tabs work (All/Wins/Questions/Photos/My Breed)
- [ ] Post creation with text + photos (0-4)
- [ ] Post types: win, question, photo, milestone
- [ ] Buddy's Take generates for question posts
- [ ] Like/unlike on posts and comments
- [ ] Comment threading works
- [ ] Report flow submits with reason
- [ ] 3 reports auto-hides post
- [ ] User blocking hides all content bidirectionally
- [ ] AI pre-moderation scans before publishing
- [ ] Free users read-only, premium can participate
- [ ] Delete own posts and comments
- [ ] Community guidelines accessible
- [ ] Feed performance: <500ms load for 20 posts
- [ ] Feature flag gated for gradual rollout
