-- Processing Queue Table
-- Manages async processing tasks for YouTube content

CREATE TABLE IF NOT EXISTS processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id VARCHAR(20) NOT NULL,

  -- Task information
  requested_by UUID,
  tier VARCHAR(20) NOT NULL, -- 'basic', 'full'
  priority INT DEFAULT 1,

  -- Status management
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  progress INT DEFAULT 0, -- 0-100

  -- Error handling
  error_message TEXT,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,

  -- Time tracking
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  estimated_completion_at TIMESTAMP
);

-- Indexes for queue management
CREATE INDEX IF NOT EXISTS idx_processing_queue_status ON processing_queue(status, priority, created_at);
CREATE INDEX IF NOT EXISTS idx_processing_queue_youtube_id ON processing_queue(youtube_id);
CREATE INDEX IF NOT EXISTS idx_processing_queue_requested_by ON processing_queue(requested_by);

-- Comments for documentation
COMMENT ON TABLE processing_queue IS 'Async task queue for YouTube content processing';
COMMENT ON COLUMN processing_queue.tier IS 'Processing tier: basic (Layer 2, low cost) or full (Layer 3, high cost)';
COMMENT ON COLUMN processing_queue.priority IS 'Task priority: premium users get higher priority (10), pro (5), free (1)';
COMMENT ON COLUMN processing_queue.status IS 'Task status: pending, processing, completed, or failed';
