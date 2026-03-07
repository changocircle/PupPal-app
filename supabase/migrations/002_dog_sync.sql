-- ============================================================
-- PupPal Migration 002: Dog Sync Support
-- Adds missing columns, fixes updated_at trigger for sync,
-- and enables Realtime on the dogs table.
-- ============================================================

-- Add columns referenced by the app but missing from migration 001
ALTER TABLE public.dogs ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE public.dogs ADD COLUMN IF NOT EXISTS gotcha_date DATE;
ALTER TABLE public.dogs ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT TRUE;

-- ============================================================
-- Fix updated_at trigger to support sync clients
--
-- Problem: the old trigger always overwrites updated_at to NOW(),
-- which breaks conflict resolution because the sync layer needs
-- to preserve the client's local updated_at timestamp.
--
-- Fix: if the caller explicitly sets updated_at to a different
-- value, preserve it. Otherwise auto-set to NOW().
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- If the caller explicitly changed updated_at, preserve their value
  IF NEW.updated_at IS DISTINCT FROM OLD.updated_at THEN
    RETURN NEW;
  END IF;
  -- Otherwise auto-set to now
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Enable Supabase Realtime for the dogs table
-- (needed for cross-device sync subscriptions)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.dogs;
