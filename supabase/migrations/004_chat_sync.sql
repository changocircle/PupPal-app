-- ============================================================
-- PupPal Migration 004: Chat Sessions, Messages, and Summaries
-- Source: PRD-02, Supabase Sync Phase 3
--
-- Design: chat_sessions tracks conversation boundaries per dog,
-- chat_messages stores the full message history, and
-- chat_summaries stores cross-session memory for Buddy.
-- Per-dog isolation via dog_id on every row.
-- ============================================================

-- ============================================================
-- Chat Sessions table
-- One row per conversation session per dog
-- ============================================================
CREATE TABLE public.chat_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dog_id UUID NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,

  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  message_count INTEGER NOT NULL DEFAULT 0,

  -- Session metadata
  summary TEXT,
  topics TEXT[] DEFAULT '{}',
  sentiment TEXT NOT NULL DEFAULT 'neutral'
    CHECK (sentiment IN ('positive', 'neutral', 'frustrated', 'concerned')),
  escalation_triggered BOOLEAN NOT NULL DEFAULT FALSE,
  escalation_type TEXT NOT NULL DEFAULT 'none'
    CHECK (escalation_type IN ('medical', 'behavioral', 'emotional', 'none')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_dog_id ON public.chat_sessions(dog_id);
CREATE INDEX idx_chat_sessions_started_at ON public.chat_sessions(started_at DESC);

-- ============================================================
-- Chat Messages table
-- Full message history per session
-- ============================================================
CREATE TABLE public.chat_messages (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dog_id UUID NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,

  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  photo_url TEXT,

  -- Feedback
  feedback TEXT NOT NULL DEFAULT 'none'
    CHECK (feedback IN ('positive', 'negative', 'none')),

  -- Performance metadata (nullable, populated by edge function)
  tokens_used INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_chat_messages_session ON public.chat_messages(session_id);
CREATE INDEX idx_chat_messages_dog ON public.chat_messages(dog_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- ============================================================
-- Chat Summaries table
-- Cross-session memory for Buddy (PRD-02 Section 4)
-- Injected into Buddy's system prompt on each session start.
-- ============================================================
CREATE TABLE public.chat_summaries (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dog_id UUID NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  session_id TEXT REFERENCES public.chat_sessions(id) ON DELETE SET NULL,

  summary_text TEXT NOT NULL,
  key_topics TEXT[] DEFAULT '{}',
  advice_given TEXT[] DEFAULT '{}',
  follow_up_needed TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_chat_summaries_dog ON public.chat_summaries(dog_id);
CREATE INDEX idx_chat_summaries_created_at ON public.chat_summaries(created_at DESC);

-- ============================================================
-- Row Level Security
-- ============================================================

-- chat_sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own chat sessions"
  ON public.chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat sessions"
  ON public.chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
  ON public.chat_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions"
  ON public.chat_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own chat messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat messages"
  ON public.chat_messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages"
  ON public.chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- chat_summaries
ALTER TABLE public.chat_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own chat summaries"
  ON public.chat_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat summaries"
  ON public.chat_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat summaries"
  ON public.chat_summaries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat summaries"
  ON public.chat_summaries FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Updated_at triggers (uses the shared trigger from 002)
-- ============================================================
CREATE TRIGGER chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER chat_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER chat_summaries_updated_at
  BEFORE UPDATE ON public.chat_summaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- Enable Realtime for cross-device sync
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_summaries;
