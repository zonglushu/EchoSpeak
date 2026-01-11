-- AI 用量日志表
-- 用于追踪各个 AI 提供商的使用情况、成本和性能

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL, -- 提供商名称 (e.g., 'Google Gemini', '智谱 GLM')
  task TEXT NOT NULL, -- 任务类型 ('prosody', 'bilingualize', 'transcribe')
  model TEXT NOT NULL, -- 使用的模型 (e.g., 'gemini-3-flash-preview', 'glm-4-flash')
  latency INTEGER NOT NULL, -- 延迟 (毫秒)
  tokens INTEGER, -- Token 使用量
  status TEXT NOT NULL CHECK (status IN ('success', 'error')), -- 状态
  error TEXT, -- 错误信息
  cost NUMERIC(10, 6), -- 成本 (美元)
  input_text TEXT, -- 输入文本（用于调试）
  metadata JSONB, -- 额外元数据
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_provider ON ai_usage_logs(provider);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_task ON ai_usage_logs(task);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_status ON ai_usage_logs(status);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON ai_usage_logs(created_at DESC);

-- 创建成本汇总视图
CREATE OR REPLACE VIEW ai_usage_summary AS
SELECT
  provider,
  task,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE status = 'success') as successful_requests,
  COUNT(*) FILTER (WHERE status = 'error') as failed_requests,
  AVG(latency) as avg_latency,
  SUM(tokens) as total_tokens,
  SUM(cost) as total_cost,
  MIN(created_at) as first_use,
  MAX(created_at) as last_use
FROM ai_usage_logs
GROUP BY provider, task;

-- 添加注释
COMMENT ON TABLE ai_usage_logs IS 'AI 提供商使用日志，用于成本追踪和性能分析';
COMMENT ON COLUMN ai_usage_logs.provider IS 'AI 提供商名称';
COMMENT ON COLUMN ai_usage_logs.task IS '任务类型: prosody (打谱), bilingualize (翻译), transcribe (转写)';
COMMENT ON COLUMN ai_usage_logs.cost IS '成本，单位为美元';
COMMENT ON VIEW ai_usage_summary IS 'AI 使用情况汇总视图';
