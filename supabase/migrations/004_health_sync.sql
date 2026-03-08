-- ============================================================
-- PupPal Migration 004: Health Records Sync
-- Source: PRD-05, Supabase Sync Phase 4
--
-- Covers: vaccinations, weight logs, medications,
--         medication events, vet visits, milestones,
--         vet contacts, health notes.
--
-- Design: one row per record, per dog. All tables use TEXT
-- primary keys (matching local nanoid values) so the app
-- can upsert with stable IDs across devices.
-- ============================================================

-- ============================================================
-- Vaccinations
-- ============================================================
CREATE TABLE public.vaccinations (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dog_id TEXT NOT NULL,

  vaccine_name TEXT NOT NULL,
  vaccine_key TEXT NOT NULL,
  vaccine_type TEXT NOT NULL,
  dose_number INTEGER NOT NULL DEFAULT 1,
  due_date DATE NOT NULL,
  due_window_start DATE NOT NULL,
  due_window_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming',
  completed_at DATE,
  completed_notes TEXT,
  vet_name TEXT,
  breed_note TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vaccinations_user_id ON public.vaccinations(user_id);
CREATE INDEX idx_vaccinations_dog_id ON public.vaccinations(dog_id);

-- ============================================================
-- Weight Logs
-- ============================================================
CREATE TABLE public.weight_logs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dog_id TEXT NOT NULL,

  weight_value NUMERIC(6,2) NOT NULL,
  weight_unit TEXT NOT NULL CHECK (weight_unit IN ('lbs', 'kg')),
  weight_kg NUMERIC(6,2) NOT NULL,
  measured_at DATE NOT NULL,
  age_at_measurement_weeks INTEGER NOT NULL,
  within_breed_range TEXT NOT NULL DEFAULT 'normal'
    CHECK (within_breed_range IN ('below', 'normal', 'above')),
  notes TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_weight_logs_user_id ON public.weight_logs(user_id);
CREATE INDEX idx_weight_logs_dog_id ON public.weight_logs(dog_id);
CREATE INDEX idx_weight_logs_measured_at ON public.weight_logs(measured_at);

-- ============================================================
-- Medications
-- ============================================================
CREATE TABLE public.medications (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dog_id TEXT NOT NULL,

  name TEXT NOT NULL,
  category TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  next_due DATE,
  notes TEXT,
  prescribed_by TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_medications_user_id ON public.medications(user_id);
CREATE INDEX idx_medications_dog_id ON public.medications(dog_id);

-- ============================================================
-- Medication Events (dose logs)
-- ============================================================
CREATE TABLE public.medication_events (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dog_id TEXT NOT NULL,
  medication_id TEXT NOT NULL,

  administered_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_medication_events_user_id ON public.medication_events(user_id);
CREATE INDEX idx_medication_events_dog_id ON public.medication_events(dog_id);
CREATE INDEX idx_medication_events_medication_id ON public.medication_events(medication_id);

-- ============================================================
-- Vet Visits
-- ============================================================
CREATE TABLE public.vet_visits (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dog_id TEXT NOT NULL,

  visit_type TEXT NOT NULL,
  visit_date DATE NOT NULL,
  vet_clinic TEXT,
  vet_name TEXT,
  reason TEXT NOT NULL,
  diagnosis TEXT,
  treatment TEXT,
  follow_up_needed BOOLEAN NOT NULL DEFAULT FALSE,
  follow_up_date DATE,
  follow_up_notes TEXT,
  cost NUMERIC(10,2),
  notes TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vet_visits_user_id ON public.vet_visits(user_id);
CREATE INDEX idx_vet_visits_dog_id ON public.vet_visits(dog_id);
CREATE INDEX idx_vet_visits_visit_date ON public.vet_visits(visit_date);

-- ============================================================
-- Vet Contacts
-- ============================================================
CREATE TABLE public.vet_contacts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  clinic_name TEXT NOT NULL,
  vet_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  is_emergency BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vet_contacts_user_id ON public.vet_contacts(user_id);

-- ============================================================
-- Milestones
-- ============================================================
CREATE TABLE public.milestones (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dog_id TEXT NOT NULL,

  milestone_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'active', 'completed', 'skipped')),
  expected_date_start DATE NOT NULL,
  expected_date_end DATE NOT NULL,
  actual_date DATE,
  notes TEXT,
  logged_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_milestones_user_id ON public.milestones(user_id);
CREATE INDEX idx_milestones_dog_id ON public.milestones(dog_id);

-- ============================================================
-- Health Notes
-- ============================================================
CREATE TABLE public.health_notes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dog_id TEXT NOT NULL,

  content TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  follow_up_date DATE,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_health_notes_user_id ON public.health_notes(user_id);
CREATE INDEX idx_health_notes_dog_id ON public.health_notes(dog_id);

-- ============================================================
-- Row Level Security
-- ============================================================

-- Vaccinations
ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own vaccinations"
  ON public.vaccinations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vaccinations"
  ON public.vaccinations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vaccinations"
  ON public.vaccinations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vaccinations"
  ON public.vaccinations FOR DELETE
  USING (auth.uid() = user_id);

-- Weight Logs
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own weight logs"
  ON public.weight_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weight logs"
  ON public.weight_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weight logs"
  ON public.weight_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weight logs"
  ON public.weight_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Medications
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own medications"
  ON public.medications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medications"
  ON public.medications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medications"
  ON public.medications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own medications"
  ON public.medications FOR DELETE
  USING (auth.uid() = user_id);

-- Medication Events
ALTER TABLE public.medication_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own medication events"
  ON public.medication_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medication events"
  ON public.medication_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medication events"
  ON public.medication_events FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own medication events"
  ON public.medication_events FOR DELETE
  USING (auth.uid() = user_id);

-- Vet Visits
ALTER TABLE public.vet_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own vet visits"
  ON public.vet_visits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vet visits"
  ON public.vet_visits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vet visits"
  ON public.vet_visits FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vet visits"
  ON public.vet_visits FOR DELETE
  USING (auth.uid() = user_id);

-- Vet Contacts
ALTER TABLE public.vet_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own vet contacts"
  ON public.vet_contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vet contacts"
  ON public.vet_contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vet contacts"
  ON public.vet_contacts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vet contacts"
  ON public.vet_contacts FOR DELETE
  USING (auth.uid() = user_id);

-- Milestones
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own milestones"
  ON public.milestones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own milestones"
  ON public.milestones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own milestones"
  ON public.milestones FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own milestones"
  ON public.milestones FOR DELETE
  USING (auth.uid() = user_id);

-- Health Notes
ALTER TABLE public.health_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own health notes"
  ON public.health_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health notes"
  ON public.health_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health notes"
  ON public.health_notes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own health notes"
  ON public.health_notes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- updated_at triggers (using the sync-safe version from 002)
-- ============================================================
CREATE TRIGGER vaccinations_updated_at
  BEFORE UPDATE ON public.vaccinations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER weight_logs_updated_at
  BEFORE UPDATE ON public.weight_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER medications_updated_at
  BEFORE UPDATE ON public.medications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER medication_events_updated_at
  BEFORE UPDATE ON public.medication_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER vet_visits_updated_at
  BEFORE UPDATE ON public.vet_visits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER vet_contacts_updated_at
  BEFORE UPDATE ON public.vet_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER milestones_updated_at
  BEFORE UPDATE ON public.milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER health_notes_updated_at
  BEFORE UPDATE ON public.health_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- Enable Realtime for cross-device sync
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.vaccinations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.weight_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.medications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.medication_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vet_visits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.milestones;
ALTER PUBLICATION supabase_realtime ADD TABLE public.health_notes;
