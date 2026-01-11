-- Cost Tracking Table
-- Daily aggregation of AI processing costs for budget management

CREATE TABLE IF NOT EXISTS cost_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE DEFAULT CURRENT_DATE,

  -- Usage statistics
  total_calls INT DEFAULT 0,
  total_tokens BIGINT DEFAULT 0,
  total_cost_usd DECIMAL(10,2) DEFAULT 0,

  -- Tier breakdown
  basic_calls INT DEFAULT 0,
  full_calls INT DEFAULT 0,
  rules_based_calls INT DEFAULT 0,

  -- User statistics
  unique_users INT DEFAULT 0,
  avg_cost_per_user DECIMAL(10,4),

  -- Cache effectiveness
  cache_hit_rate DECIMAL(3,2), -- 0.80 = 80% hit rate
  money_saved_by_cache DECIMAL(10,2) DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cost_tracking_date ON cost_tracking(date);

-- Trigger to auto-update updated_at
CREATE TRIGGER cost_tracking_updated_at
  BEFORE UPDATE ON cost_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_content_library_updated_at();

-- Function to aggregate daily stats
CREATE OR REPLACE FUNCTION aggregate_daily_cost_stats()
RETURNS void AS $$
BEGIN
  INSERT INTO cost_tracking (
    date,
    total_calls,
    total_cost_usd,
    basic_calls,
    full_calls,
    unique_users
  )
  SELECT
    DATE(created_at) as date,
    COUNT(*),
    COALESCE(SUM(cost_usd), 0),
    COUNT(*) FILTER (WHERE tier = 'basic'),
    COUNT(*) FILTER (WHERE tier = 'full'),
    COUNT(DISTINCT user_id)
  FROM user_processing_history
  WHERE DATE(created_at) = CURRENT_DATE
  ON CONFLICT (date)
  DO UPDATE SET
    total_calls = EXCLUDED.total_calls,
    total_cost_usd = EXCLUDED.total_cost_usd,
    basic_calls = EXCLUDED.basic_calls,
    full_calls = EXCLUDED.full_calls,
    unique_users = EXCLUDED.unique_users;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE cost_tracking IS 'Daily aggregated cost statistics for budget monitoring and optimization';
COMMENT ON COLUMN cost_tracking.cache_hit_rate IS 'Percentage of requests served from cache (higher is better)';
COMMENT ON COLUMN cost_tracking.money_saved_by_cache IS 'Estimated USD saved by serving cached content instead of reprocessing';
