-- User Quotas Table
-- Manages daily processing limits for users to control costs

CREATE TABLE IF NOT EXISTS user_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,

  -- Quota tier
  tier VARCHAR(20) DEFAULT 'free', -- 'free', 'pro', 'premium'

  -- Daily limits
  daily_basic_limit INT DEFAULT 3,
  daily_full_limit INT DEFAULT 1,
  resets_at TIMESTAMP DEFAULT (DATE(NOW() + INTERVAL '1 day')),

  -- Current usage
  basic_used_today INT DEFAULT 0,
  full_used_today INT DEFAULT 0,

  -- Historical statistics
  total_basic_used INT DEFAULT 0,
  total_full_used INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_quotas_user_id ON user_quotas(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quotas_tier ON user_quotas(tier);
CREATE INDEX IF NOT EXISTS idx_user_quotas_resets_at ON user_quotas(resets_at);

-- Trigger to auto-update updated_at
CREATE TRIGGER user_quotas_updated_at
  BEFORE UPDATE ON user_quotas
  FOR EACH ROW
  EXECUTE FUNCTION update_content_library_updated_at();

-- Function to reset daily quotas
CREATE OR REPLACE FUNCTION reset_daily_quotas()
RETURNS void AS $$
BEGIN
  UPDATE user_quotas
  SET basic_used_today = 0,
      full_used_today = 0,
      resets_at = DATE(NOW() + INTERVAL '1 day')
  WHERE resets_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE user_quotas IS 'Manages daily processing limits and usage tracking for cost control';
COMMENT ON COLUMN user_quotas.tier IS 'User tier: free (3 basic + 1 full/day), pro (20 basic + 5 full/day), premium (unlimited)';
COMMENT ON COLUMN user_quotas.daily_basic_limit IS 'Daily limit for Layer 2 (basic AI processing)';
COMMENT ON COLUMN user_quotas.daily_full_limit IS 'Daily limit for Layer 3 (full AI processing)';
