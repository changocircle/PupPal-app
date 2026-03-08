-- ============================================================
-- PupPal Migration 003: Training Plans & Exercise Completions Sync
-- Source: PRD-03, Supabase Sync Phase 2
--
-- Design: one training_plans row per dog, plan structure stored
-- as JSONB. exercise_completions as separate table for easy
-- querying (progress stats, analytics, leaderboards later).
-- ============================================================

-- ============================================================
-- Training Plans table
-- ============================================================
CREATE TABLE public.training_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dog_id UUID NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,

  -- Plan metadata (top-level for easy querying)
  dog_name TEXT NOT NULL,
  breed TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'paused')),
  current_week INTEGER NOT NULL DEFAULT 1,
  current_day INTEGER NOT NULL DEFAULT 1,
  total_weeks INTEGER NOT NULL DEFAULT 12,

  -- Full plan structure (weeks > days > exercises)
  plan_data JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Gamification state (per-dog, tied to plan)
  total_xp INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  last_completion_date DATE,

  -- Timestamps
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One active plan per dog
  UNIQUE (dog_id)
);

-- Indexes
CREATE INDEX idx_training_plans_user_id ON public.training_plans(user_id);
CREATE INDEX idx_training_plans_dog_id ON public.training_plans(dog_id);

-- ============================================================
-- Exercise Completions table
-- ============================================================
CREATE TABLE public.exercise_completions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dog_id UUID NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.training_plans(id) ON DELETE CASCADE,

  exercise_id TEXT NOT NULL,
  plan_exercise_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  xp_earned INTEGER NOT NULL DEFAULT 0,
  time_spent_seconds INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_exercise_completions_plan ON public.exercise_completions(plan_id);
CREATE INDEX idx_exercise_completions_dog ON public.exercise_completions(dog_id);
CREATE INDEX idx_exercise_completions_date ON public.exercise_completions(completed_at);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own training plans"
  ON public.training_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own training plans"
  ON public.training_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own training plans"
  ON public.training_plans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own training plans"
  ON public.training_plans FOR DELETE
  USING (auth.uid() = user_id);

ALTER TABLE public.exercise_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own completions"
  ON public.exercise_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions"
  ON public.exercise_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own completions"
  ON public.exercise_completions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own completions"
  ON public.exercise_completions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Updated_at triggers (using the sync-safe version from 002)
-- ============================================================
CREATE TRIGGER training_plans_updated_at
  BEFORE UPDATE ON public.training_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER exercise_completions_updated_at
  BEFORE UPDATE ON public.exercise_completions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- Enable Realtime for cross-device sync
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.training_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.exercise_completions;
