-- P0 Features Schema Migration
-- Core Retention Mechanisms: Check-ins, History, Playlist, Badges, Leaderboard
-- Created: 2026-01-09

-- ============================================================================
-- 1. DAILY CHECK-IN SYSTEM (P0-1)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date date NOT NULL,
  streak_count integer NOT NULL DEFAULT 1, -- Current consecutive days
  total_checkins integer NOT NULL DEFAULT 1, -- Lifetime check-ins
  practice_duration_seconds integer DEFAULT 0, -- Duration practiced on this day
  sentences_practiced integer DEFAULT 0, -- Number of sentences practiced
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, checkin_date)
);

-- Index for streak calculations
CREATE INDEX IF NOT EXISTS idx_user_checkins_user_date ON public.user_checkins(user_id, checkin_date DESC);

-- RLS Policies
ALTER TABLE public.user_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checkins"
  ON public.user_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins"
  ON public.user_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access checkins"
  ON public.user_checkins FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 2. PRACTICE HISTORY (P0-2)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.practice_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES public.media_assets(id) ON DELETE SET NULL,
  video_id text, -- For YouTube videos not in media_assets
  video_title text NOT NULL,
  video_thumbnail text,
  practice_date date NOT NULL,
  duration_seconds integer NOT NULL DEFAULT 0,
  sentences_completed integer DEFAULT 0,
  sentences_total integer DEFAULT 0,
  progress_percentage numeric DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for history queries
CREATE INDEX IF NOT EXISTS idx_practice_history_user_date ON public.practice_history(user_id, practice_date DESC);
CREATE INDEX IF NOT EXISTS idx_practice_history_asset ON public.practice_history(asset_id);

-- RLS Policies
ALTER TABLE public.practice_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own history"
  ON public.practice_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history"
  ON public.practice_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access history"
  ON public.practice_history FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 3. PRACTICE PLAYLIST / FAVORITES (P0-3)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.practice_playlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES public.media_assets(id) ON DELETE CASCADE,
  video_id text, -- For YouTube videos
  video_title text NOT NULL,
  video_thumbnail text,
  video_duration integer, -- in seconds
  sort_order integer NOT NULL DEFAULT 0, -- For drag-and-drop reordering
  notes text, -- User's personal notes
  tags text[], -- User's custom tags
  added_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for playlist queries
CREATE INDEX IF NOT EXISTS idx_practice_playlist_user_order ON public.practice_playlist(user_id, sort_order);

-- RLS Policies
ALTER TABLE public.practice_playlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own playlist"
  ON public.practice_playlist FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access playlist"
  ON public.practice_playlist FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 4. VIEW HISTORY FOR TRENDING (P0-6)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.view_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  asset_id uuid REFERENCES public.media_assets(id) ON DELETE SET NULL,
  video_id text,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  view_duration_seconds integer DEFAULT 0,
  completed boolean DEFAULT false
);

-- Indexes for trending calculations
CREATE INDEX IF NOT EXISTS idx_view_history_asset_date ON public.view_history(asset_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_view_history_date ON public.view_history(viewed_at DESC);

-- RLS Policies
ALTER TABLE public.view_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own view history"
  ON public.view_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own views"
  ON public.view_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access view history"
  ON public.view_history FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 5. ACHIEVEMENT BADGES SYSTEM (P0-4)
-- ============================================================================

-- Achievement definitions
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL, -- e.g., 'streak_7', 'first_100_sentences'
  name text NOT NULL,
  description text NOT NULL,
  icon_name text NOT NULL, -- Emoji or icon identifier
  category text NOT NULL, -- 'streak', 'practice', 'milestone', 'skill'
  requirement_type text NOT NULL, -- 'streak_days', 'total_practice', 'sentences', etc.
  requirement_value integer NOT NULL,
  rarity text NOT NULL DEFAULT 'common' CHECK (rarity in ('common', 'rare', 'epic', 'legendary')),
  xp_reward integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  progress_value integer DEFAULT 0, -- For progressive achievements
  is_displayed boolean DEFAULT true, -- User can hide certain badges
  UNIQUE(user_id, achievement_id)
);

-- Indexes for achievement queries
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_active ON public.achievements(is_active) WHERE is_active = true;

-- RLS Policies
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Everyone can view active achievements
CREATE POLICY "Anyone can view achievements"
  ON public.achievements FOR SELECT
  USING (is_active = true);

-- Users can view own achievements
CREATE POLICY "Users can view own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

-- System can grant achievements
CREATE POLICY "Service role full access achievements"
  ON public.user_achievements FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access achievement definitions"
  ON public.achievements FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 6. USER STATS SUMMARY (for quick dashboard queries)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_practice_seconds integer DEFAULT 0,
  total_sentences_practiced integer DEFAULT 0,
  total_videos_completed integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  total_checkins integer DEFAULT 0,
  total_xp integer DEFAULT 0,
  level integer DEFAULT 1,
  last_practice_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats"
  ON public.user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access stats"
  ON public.user_stats FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 7. INSERT INITIAL ACHIEVEMENT DEFINITIONS
-- ============================================================================

INSERT INTO public.achievements (code, name, description, icon_name, category, requirement_type, requirement_value, rarity, xp_reward) VALUES
  -- Streak achievements (P0-1)
  ('streak_3', '3-Day Streak', 'Practice for 3 consecutive days', '🔥', 'streak', 'streak_days', 3, 'common', 50),
  ('streak_7', 'Week Warrior', 'Practice for 7 consecutive days', '🔥', 'streak', 'streak_days', 7, 'rare', 100),
  ('streak_30', 'Monthly Master', 'Practice for 30 consecutive days', '🔥', 'streak', 'streak_days', 30, 'epic', 500),
  ('streak_100', 'Centurion', 'Practice for 100 consecutive days', '🔥', 'streak', 'streak_days', 100, 'legendary', 2000),

  -- Practice milestones (P0-2)
  ('first_practice', 'First Steps', 'Complete your first practice session', '🎯', 'practice', 'total_practices', 1, 'common', 20),
  ('practice_10', 'Getting Started', 'Complete 10 practice sessions', '📚', 'practice', 'total_practices', 10, 'common', 50),
  ('practice_50', 'Dedicated Learner', 'Complete 50 practice sessions', '📚', 'practice', 'total_practices', 50, 'rare', 200),
  ('practice_100', 'Century Club', 'Complete 100 practice sessions', '📚', 'practice', 'total_practices', 100, 'epic', 500),

  -- Sentence milestones
  ('sentences_10', 'Sentence Starter', 'Practice 10 sentences', '💬', 'sentences', 'total_sentences', 10, 'common', 30),
  ('sentences_100', 'Conversation Ready', 'Practice 100 sentences', '💬', 'sentences', 'total_sentences', 100, 'rare', 150),
  ('sentences_500', 'Fluent Speaker', 'Practice 500 sentences', '💬', 'sentences', 'total_sentences', 500, 'epic', 500),
  ('sentences_1000', 'Oratory Master', 'Practice 1000 sentences', '💬', 'sentences', 'total_sentences', 1000, 'legendary', 1500),

  -- Time milestones
  ('time_60min', 'Hour of Power', 'Practice for 60 minutes total', '⏱️', 'time', 'total_seconds', 3600, 'common', 50),
  ('time_5hours', 'Dedicated Student', 'Practice for 5 hours total', '⏱️', 'time', 'total_seconds', 18000, 'rare', 200),
  ('time_20hours', 'Time Lord', 'Practice for 20 hours total', '⏱️', 'time', 'total_seconds', 72000, 'epic', 600),

  -- Playlist achievements (P0-3)
  ('first_favorite', 'Collector', 'Add your first video to playlist', '⭐', 'playlist', 'playlist_count', 1, 'common', 20),
  ('playlist_10', 'Curator', 'Add 10 videos to your playlist', '⭐', 'playlist', 'playlist_count', 10, 'rare', 100),

ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 8. HELPER FUNCTIONS
-- ============================================================================

-- Function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats(p_user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_stats (user_id, total_practice_seconds, total_sentences_practiced, total_videos_completed, current_streak, longest_streak, total_checkins)
  SELECT
    p_user_id,
    COALESCE(SUM(duration_seconds), 0),
    COALESCE(SUM(sentences_completed), 0),
    COUNT(DISTINCT asset_id),
    (
      SELECT COALESCE(streak_count, 0)
      FROM user_checkins
      WHERE user_id = p_user_id
      ORDER BY checkin_date DESC
      LIMIT 1
    ),
    (
      SELECT COALESCE(MAX(streak_count), 0)
      FROM user_checkins
      WHERE user_id = p_user_id
    ),
    (SELECT COUNT(*) FROM user_checkins WHERE user_id = p_user_id)
  FROM public.practice_history
  WHERE user_id = p_user_id
  ON CONFLICT (user_id) DO UPDATE SET
    total_practice_seconds = EXCLUDED.total_practice_seconds,
    total_sentences_practiced = EXCLUDED.total_sentences_practiced,
    total_videos_completed = EXCLUDED.total_videos_completed,
    current_streak = EXCLUDED.current_streak,
    longest_streak = EXCLUDED.longest_streak,
    total_checkins = EXCLUDED.total_checkins,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. TRIGGERS
-- ============================================================================

-- Update user stats after practice history insert
CREATE OR REPLACE FUNCTION trigger_update_stats_on_practice()
RETURNS trigger AS $$
BEGIN
  PERFORM update_user_stats(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_stats_after_practice ON public.practice_history;
CREATE TRIGGER update_stats_after_practice
  AFTER INSERT ON public.practice_history
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_stats_on_practice();

-- Update user stats after checkin
CREATE OR REPLACE FUNCTION trigger_update_stats_on_checkin()
RETURNS trigger AS $$
BEGIN
  PERFORM update_user_stats(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_stats_after_checkin ON public.user_checkins;
CREATE TRIGGER update_stats_after_checkin
  AFTER INSERT ON public.user_checkins
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_stats_on_checkin();
