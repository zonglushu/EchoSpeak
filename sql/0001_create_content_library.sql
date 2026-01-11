-- Content Library Table
-- Stores all processed YouTube content with prosody annotations
-- This is the central table for the EchoSpeak caching system

CREATE TABLE IF NOT EXISTS content_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id VARCHAR(20) UNIQUE NOT NULL,

  -- Layer 1: Raw subtitles (always present)
  raw_subtitles JSONB NOT NULL,
  language_code VARCHAR(5) DEFAULT 'en',
  extracted_at TIMESTAMP DEFAULT NOW(),

  -- Layer 2: Basic annotations (optional, low cost)
  basic_annotations JSONB,
  basic_processed_at TIMESTAMP,

  -- Layer 3: Full prosody notation (optional, high cost)
  full_prosody_data JSONB,
  full_processed_at TIMESTAMP,

  -- Metadata
  title TEXT,
  thumbnail_url TEXT,
  duration INT, -- seconds

  -- Usage statistics (for cache decision)
  view_count INT DEFAULT 0,
  unique_viewers INT DEFAULT 0,
  last_viewed_at TIMESTAMP,
  first_viewed_at TIMESTAMP,

  -- Content classification
  difficulty_level VARCHAR(20), -- 'beginner', 'intermediate', 'advanced'
  topic_tags TEXT[],
  is_featured BOOLEAN DEFAULT FALSE,

  -- Quality control
  moderation_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  moderation_notes TEXT,
  moderated_by UUID,
  moderated_at TIMESTAMP,

  -- Cost tracking
  processing_cost_usd DECIMAL(10,4) DEFAULT 0,
  ai_model_used VARCHAR(50),
  generation_time_ms INT,

  -- Cache management
  cache_tier VARCHAR(20) DEFAULT 'cold', -- 'hot', 'warm', 'cold'
  last_accessed_at TIMESTAMP DEFAULT NOW(),
  access_count INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_library_youtube_id ON content_library(youtube_id);
CREATE INDEX IF NOT EXISTS idx_content_library_cache_tier ON content_library(cache_tier, last_accessed_at);
CREATE INDEX IF NOT EXISTS idx_content_library_moderation ON content_library(moderation_status, is_featured);
CREATE INDEX IF NOT EXISTS idx_content_library_view_count ON content_library(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_content_library_language ON content_library(language_code);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_content_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER content_library_updated_at
  BEFORE UPDATE ON content_library
  FOR EACH ROW
  EXECUTE FUNCTION update_content_library_updated_at();

-- Comments for documentation
COMMENT ON TABLE content_library IS 'Stores all processed YouTube content with prosody annotations and usage statistics';
COMMENT ON COLUMN content_library.raw_subtitles IS 'Original YouTube subtitles with timing data';
COMMENT ON COLUMN content_library.basic_annotations IS 'Rule-based annotations (low cost)';
COMMENT ON COLUMN content_library.full_prosody_data IS 'AI-generated full prosody notation (high cost)';
COMMENT ON COLUMN content_library.cache_tier IS 'Cache temperature: hot (featured/high traffic), warm (moderate traffic), cold (low traffic)';
COMMENT ON COLUMN content_library.moderation_status IS 'Content moderation status: pending, approved, or rejected';
