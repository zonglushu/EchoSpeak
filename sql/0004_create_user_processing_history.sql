-- User Processing History Table
-- Tracks all processing requests to prevent abuse and track usage patterns

CREATE TABLE IF NOT EXISTS user_processing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  youtube_id VARCHAR(20) NOT NULL,

  -- Processing information
  tier VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'pending', 'completed', 'failed'

  -- Cost tracking
  cost_usd DECIMAL(10,4),
  quota_consumed INT DEFAULT 1,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_processing_history_user_id ON user_processing_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_processing_history_youtube_id ON user_processing_history(youtube_id);
CREATE INDEX IF NOT EXISTS idx_user_processing_history_status ON user_processing_history(status);

-- Comments for documentation
COMMENT ON TABLE user_processing_history IS 'Audit log of all user processing requests for abuse prevention and analytics';
COMMENT ON COLUMN user_processing_history.tier IS 'Requested processing tier: basic or full';
COMMENT ON COLUMN user_processing_history.cost_usd IS 'Actual cost in USD for this processing job';
COMMENT ON COLUMN user_processing_history.quota_consumed IS 'Number of quota points consumed (typically 1)';
