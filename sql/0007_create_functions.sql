-- Increment content access statistics
CREATE OR REPLACE FUNCTION increment_content_stats(p_youtube_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE content_library
  SET
    view_count = view_count + 1,
    access_count = access_count + 1,
    last_accessed_at = NOW(),
    updated_at = NOW()
  WHERE youtube_id = p_youtube_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate and update cache tier based on access patterns
CREATE OR REPLACE FUNCTION update_cache_tier(p_content_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_view_count INT;
  v_access_count INT;
  v_last_accessed TIMESTAMP;
  v_is_featured BOOLEAN;
  v_days_since_last_access NUMERIC;
  v_new_tier TEXT;
BEGIN
  SELECT
    view_count,
    access_count,
    last_accessed_at,
    is_featured
  INTO
    v_view_count,
    v_access_count,
    v_last_accessed,
    v_is_featured
  FROM content_library
  WHERE id = p_content_id;

  -- Calculate days since last access
  v_days_since_last_access := EXTRACT(EPOCH FROM (NOW() - v_last_accessed_at)) / (24 * 3600);

  -- Determine new tier
  IF v_is_featured OR v_view_count >= 500 OR (v_days_since_last_access < 7 AND v_access_count >= 50) THEN
    v_new_tier := 'hot';
  ELSIF v_days_since_last_access < 30 AND v_access_count >= 10 THEN
    v_new_tier := 'warm';
  ELSE
    v_new_tier := 'cold';
  END IF;

  -- Update the tier
  UPDATE content_library
  SET cache_tier = v_new_tier
  WHERE id = p_content_id;

  RETURN v_new_tier;
END;
$$ LANGUAGE plpgsql;

-- Function to get user quota with auto-reset
CREATE OR REPLACE FUNCTION get_user_quota(p_user_id TEXT)
RETURNS JSON AS $$
DECLARE
  v_quota user_quotas%ROWTYPE;
  v_needs_reset BOOLEAN;
BEGIN
  SELECT * INTO v_quota
  FROM user_quotas
  WHERE user_id = p_user_id;

  -- If not found, create default quota
  IF NOT FOUND THEN
    INSERT INTO user_quotas (user_id, tier, daily_basic_limit, daily_full_limit, resets_at)
    VALUES (p_user_id, 'free', 3, 1, DATE(NOW() + INTERVAL '1 day'));

    SELECT * INTO v_quota
    FROM user_quotas
    WHERE user_id = p_user_id;
  END IF;

  -- Check if needs reset
  v_needs_reset := v_quota.resets_at <= NOW();

  IF v_needs_reset THEN
    UPDATE user_quotas
    SET
      basic_used_today = 0,
      full_used_today = 0,
      resets_at = DATE(NOW() + INTERVAL '1 day'),
      updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Refresh the quota data
    SELECT * INTO v_quota
    FROM user_quotas
    WHERE user_id = p_user_id;
  END IF;

  -- Return as JSON
  RETURN row_to_json(v_quota);
END;
$$ LANGUAGE plpgsql;

-- Increment processing queue retry count
CREATE OR REPLACE FUNCTION increment_retry_count(p_task_id TEXT)
RETURNS processing_queue AS $$
DECLARE
  v_task processing_queue%ROWTYPE;
BEGIN
  UPDATE processing_queue
  SET
    retry_count = retry_count + 1,
    completed_at = NOW()
  WHERE id = p_task_id
  RETURNING * INTO v_task;

  RETURN v_task;
END;
$$ LANGUAGE plpgsql;

-- Increment user quota usage
CREATE OR REPLACE FUNCTION increment_quota_usage(p_user_id TEXT, p_tier TEXT)
RETURNS user_quotas AS $$
DECLARE
  v_quota user_quotas%ROWTYPE;
  v_field TEXT;
  v_total_field TEXT;
BEGIN
  -- Determine which field to increment based on tier
  IF p_tier = 'basic' THEN
    v_field := 'basic_used_today';
    v_total_field := 'total_basic_used';
  ELSE
    v_field := 'full_used_today';
    v_total_field := 'total_full_used';
  END IF;

  -- Execute dynamic update
  EXECUTE format('
    UPDATE user_quotas
    SET
      %I = %I + 1,
      %I = %I + 1,
      updated_at = NOW()
    WHERE user_id = $1
    RETURNING *
  ', v_field, v_field, v_total_field, v_total_field)
  INTO v_quota
  USING p_user_id;

  RETURN v_quota;
END;
$$ LANGUAGE plpgsql;
