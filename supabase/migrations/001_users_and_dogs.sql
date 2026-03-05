-- ============================================================
-- PupPal Migration 001: Users & Dogs
-- Source: PRD-01, PRD-11, PRD-06, PRD-14
-- ============================================================

-- Custom types
CREATE TYPE public.subscription_status AS ENUM (
  'free', 'trial', 'active', 'expired', 'cancelled'
);

CREATE TYPE public.owner_experience AS ENUM (
  'first_time', 'some_experience', 'experienced'
);

CREATE TYPE public.gender AS ENUM (
  'male', 'female', 'unknown'
);

CREATE TYPE public.size_category AS ENUM (
  'small', 'medium', 'large', 'giant'
);

-- ============================================================
-- Users table (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  photo_url TEXT,

  -- Subscription (PRD-06)
  subscription_status public.subscription_status NOT NULL DEFAULT 'free',
  subscription_product_id TEXT,
  trial_start_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,

  -- Referral (PRD-08)
  referral_code TEXT UNIQUE,
  referred_by TEXT,

  -- State
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  notification_preferences JSONB NOT NULL DEFAULT '{
    "training_reminders": true,
    "streak_alerts": true,
    "achievements": true,
    "health_reminders": true,
    "buddy_tips": true,
    "marketing": true
  }'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create user row on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Dogs table
-- ============================================================
CREATE TABLE public.dogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,

  -- Breed info (PRD-01 Screen 3)
  breed TEXT,
  breed_detected BOOLEAN NOT NULL DEFAULT FALSE,
  breed_confidence REAL,

  -- Profile
  photo_url TEXT,
  date_of_birth DATE,
  age_months_at_creation INTEGER,
  gender public.gender DEFAULT 'unknown',
  weight_kg REAL,
  size_category public.size_category,

  -- Onboarding data
  challenges TEXT[] NOT NULL DEFAULT '{}',
  owner_experience public.owner_experience NOT NULL DEFAULT 'first_time',

  -- Multi-dog (PRD-11)
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast dog lookups by user
CREATE INDEX idx_dogs_user_id ON public.dogs(user_id);
CREATE INDEX idx_dogs_active ON public.dogs(user_id, is_active) WHERE is_active = TRUE;

-- ============================================================
-- Row Level Security
-- ============================================================

-- Users table RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Dogs table RLS
ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own dogs"
  ON public.dogs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dogs"
  ON public.dogs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dogs"
  ON public.dogs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own dogs"
  ON public.dogs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER dogs_updated_at
  BEFORE UPDATE ON public.dogs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
