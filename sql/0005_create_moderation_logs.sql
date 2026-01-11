-- Moderation Logs Table
-- Tracks content moderation decisions (AI, human, and community)

CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content_library(id) ON DELETE CASCADE,

  -- Moderator information
  moderator_type VARCHAR(20), -- 'ai', 'human', 'community'
  moderator_id UUID,

  -- Moderation result
  status VARCHAR(20) NOT NULL, -- 'approved', 'rejected', 'flagged'
  flags TEXT[], -- ['nsfw', 'violence', 'spam', 'inappropriate']
  confidence DECIMAL(3,2), -- AI confidence score (0.00-1.00)

  -- Moderation notes
  notes TEXT,
  severity VARCHAR(20), -- 'low', 'medium', 'high'

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_moderation_logs_content_id ON moderation_logs(content_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_status ON moderation_logs(status);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_moderator_type ON moderation_logs(moderator_type);

-- Comments for documentation
COMMENT ON TABLE moderation_logs IS 'Audit trail of content moderation decisions';
COMMENT ON COLUMN moderation_logs.moderator_type IS 'Type of moderation: ai (automated), human (admin), or community (user reports)';
COMMENT ON COLUMN moderation_logs.confidence IS 'AI confidence score (0-100%) for automated decisions';
COMMENT ON COLUMN moderation_logs.flags IS 'Array of content flags: nsfw, violence, spam, inappropriate';
