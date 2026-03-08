-- ============================================================
-- PupPal Migration 006: Gamification Sync
-- Source: PRD-04, Supabase Sync Phase 5
--
-- Syncs XP events, streak data, GBS scores, achievements,
-- achievement progress, and weekly challenges.
--
-- Design: per-dog isolation on all tables. XP events are
-- append-only (idempotent upsert by id). Streak and GBS are
-- a single row per dog (upserted). Achievements and progress
-- are per slug per dog.
-- ============================================================

-- ============================================================
-- XP Events table (append-only, one row per XP event)
-- ============================================================
CREATE TABLE public.xp_events (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  dog_id TEXT NOT NULL,

  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  source_id TEXT,
  earned_at TIMESTAMPTZ NOT NULL,
  label TEXT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_xp_events_user_id ON public.xp_events(user_id);
CREATE INDEX idx_xp_events_dog_id ON public.xp_events(dog_id);
CREATE INDEX idx_xp_events_earned_at ON public.xp_events(earned_at);

-- ============================================================
-- Gamification summaries table (one row per dog)
-- Stores aggregated state: totalXp, currentLevel, GBS, streaks.
-- ============================================================
CREATE TABLE public.gamification_summaries (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  dog_id TEXT NOT NULL,

  -- XP totals
  total_xp INTEGER NOT NULL DEFAULT 0,
  daily_xp INTEGER NOT NULL DEFAULT 0,
  daily_xp_date DATE,

  -- Level
  current_level INTEGER NOT NULL DEFAULT 1,
  current_level_title TEXT NOT NULL DEFAULT 'Puppy Newbie',

  -- Good Boy Score
  good_boy_score INTEGER NOT NULL DEFAULT 0,
  gbs_dimensions JSONB NOT NULL DEFAULT '{}'::jsonb,
  gbs_last_calculated TIMESTAMPTZ,

  -- Streak
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  freezes_available INTEGER NOT NULL DEFAULT 1,
  freezes_used_this_week INTEGER NOT NULL DEFAULT 0,
  freeze_last_reset DATE,
  total_active_days INTEGER NOT NULL DEFAULT 0,

  -- Active weekly challenge (stored as JSONB)
  active_challenge JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One summary row per dog
  UNIQUE (dog_id)
);

CREATE INDEX idx_gamification_summaries_user_id ON public.gamification_summaries(user_id);
CREATE INDEX idx_gamification_summaries_dog_id ON public.gamification_summaries(dog_id);

-- ============================================================
-- Unlocked achievements table (one row per achievement per dog)
-- ============================================================
CREATE TABLE public.unlocked_achievements (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  dog_id TEXT NOT NULL,

  slug TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  shared BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One unlock per slug per dog
  UNIQUE (dog_id, slug)
);

CREATE INDEX idx_unlocked_achievements_user_id ON public.unlocked_achievements(user_id);
CREATE INDEX idx_unlocked_achievements_dog_id ON public.unlocked_achievements(dog_id);
CREATE INDEX idx_unlocked_achievements_slug ON public.unlocked_achievements(slug);

-- ============================================================
-- Achievement progress table (one row per slug per dog)
-- ============================================================
CREATE TABLE public.achievement_progress (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  dog_id TEXT NOT NULL,

  slug TEXT NOT NULL,
  current INTEGER NOT NULL DEFAULT 0,
  target INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One progress row per slug per dog
  UNIQUE (dog_id, slug)
);

CREATE INDEX idx_achievement_progress_user_id ON public.achievement_progress(user_id);
CREATE INDEX idx_achievement_progress_dog_id ON public.achievement_progress(dog_id);

-- ============================================================
-- Row Level Security
-- ============================================================

-- xp_events
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own xp events"
  ON public.xp_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own xp events"
  ON public.xp_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own xp events"
  ON public.xp_events FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own xp events"
  ON public.xp_events FOR DELETE
  USING (auth.uid() = user_id);

-- gamification_summaries
ALTER TABLE public.gamification_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own gamification summary"
  ON public.gamification_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gamification summary"
  ON public.gamification_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gamification summary"
  ON public.gamification_summaries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own gamification summary"
  ON public.gamification_summaries FOR DELETE
  USING (auth.uid() = user_id);

-- unlocked_achievements
ALTER TABLE public.unlocked_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own unlocked achievements"
  ON public.unlocked_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own unlocked achievements"
  ON public.unlocked_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own unlocked achievements"
  ON public.unlocked_achievements FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own unlocked achievements"
  ON public.unlocked_achievements FOR DELETE
  USING (auth.uid() = user_id);

-- achievement_progress
ALTER TABLE public.achievement_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own achievement progress"
  ON public.achievement_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievement progress"
  ON public.achievement_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievement progress"
  ON public.achievement_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own achievement progress"
  ON public.achievement_progress FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Updated_at triggers
-- ============================================================
CREATE TRIGGER xp_events_updated_at
  BEFORE UPDATE ON public.xp_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER gamification_summaries_updated_at
  BEFORE UPDATE ON public.gamification_summaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER unlocked_achievements_updated_at
  BEFORE UPDATE ON public.unlocked_achievements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER achievement_progress_updated_at
  BEFORE UPDATE ON public.achievement_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- Enable Realtime for cross-device sync
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.gamification_summaries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.xp_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.unlocked_achievements;
