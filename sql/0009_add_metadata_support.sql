-- Migration: Add Metadata Support to Stage Executions
-- Description: 添加对 metadata 字段的支持，用于记录详细的处理步骤
-- Date: 2026-01-04

-- ============================================================================
-- Step 1: 更新 update_stage_execution 函数，支持 metadata 参数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_stage_execution(
  p_execution_id UUID,
  p_status TEXT DEFAULT NULL,
  p_progress INTEGER DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_stage_id UUID;
  v_pipeline_id UUID;
  v_stage TEXT;
BEGIN
  -- 更新 stage_executions 表
  UPDATE public.stage_executions
  SET
    status = COALESCE(p_status, status),
    progress = COALESCE(p_progress, progress),
    error_message = COALESCE(p_error_message, error_message),
    metadata = CASE
      WHEN p_metadata IS NOT NULL THEN
        -- 合并新的 metadata 到现有的 metadata
        COALESCE(metadata, '{}'::jsonb) || p_metadata
      ELSE metadata
    END,
    updated_at = NOW(),
    -- 根据状态更新时间戳
    started_at = CASE
      WHEN p_status = 'running' AND started_at IS NULL THEN NOW()
      ELSE started_at
    END,
    completed_at = CASE
      WHEN p_status = 'completed' THEN NOW()
      ELSE completed_at
    END,
    failed_at = CASE
      WHEN p_status = 'failed' THEN NOW()
      ELSE failed_at
    END
  WHERE id = p_execution_id
  RETURNING stage_id, pipeline_id, stage INTO v_stage_id, v_pipeline_id, v_stage;

  -- 同步更新 pipeline_stages 表
  IF v_stage_id IS NOT NULL THEN
    UPDATE public.pipeline_stages
    SET
      status = COALESCE(p_status, status),
      progress = COALESCE(p_progress, progress),
      metadata = CASE
        WHEN p_metadata IS NOT NULL THEN
          COALESCE(metadata, '{}'::jsonb) || p_metadata
        ELSE metadata
      END,
      current_execution_id = p_execution_id,
      updated_at = NOW()
    WHERE id = v_stage_id;
  END IF;

  -- 更新 pipelines 表的进度（可选，如果需要总体进度）
  IF v_pipeline_id IS NOT NULL THEN
    -- 计算所有 stage 的平均进度作为 pipeline 总进度
    UPDATE public.pipelines
    SET
      progress = (
        SELECT COALESCE(AVG(progress), 0)::INTEGER
        FROM public.pipeline_stages
        WHERE pipeline_id = v_pipeline_id
      ),
      updated_at = NOW(),
      current_stage = v_stage
    WHERE id = v_pipeline_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.update_stage_execution IS '更新 stage execution 状态，支持 metadata 字段记录详细步骤';

-- ============================================================================
-- Step 2: 更新 create_stage_execution 函数，支持 metadata 参数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_stage_execution(
  p_pipeline_id UUID,
  p_asset_id UUID,
  p_stage TEXT,
  p_status TEXT DEFAULT 'pending',
  p_progress INTEGER DEFAULT 0,
  p_source_language TEXT DEFAULT NULL,
  p_target_language TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_execution_id UUID;
  v_stage_id UUID;
BEGIN
  -- 首先确保 pipeline_stages 中有对应记录（UPSERT）
  INSERT INTO public.pipeline_stages (
    pipeline_id,
    asset_id,
    stage,
    status,
    progress,
    source_language,
    target_language,
    metadata,
    created_at,
    updated_at
  )
  VALUES (
    p_pipeline_id,
    p_asset_id,
    p_stage,
    p_status,
    p_progress,
    p_source_language,
    p_target_language,
    COALESCE(p_metadata, '{}'::jsonb),
    NOW(),
    NOW()
  )
  ON CONFLICT (pipeline_id, stage)
  DO UPDATE SET
    status = EXCLUDED.status,
    progress = EXCLUDED.progress,
    source_language = COALESCE(EXCLUDED.source_language, pipeline_stages.source_language),
    target_language = COALESCE(EXCLUDED.target_language, pipeline_stages.target_language),
    metadata = COALESCE(EXCLUDED.metadata, pipeline_stages.metadata),
    updated_at = NOW()
  RETURNING id INTO v_stage_id;

  -- 创建 stage_executions 记录
  INSERT INTO public.stage_executions (
    stage_id,
    pipeline_id,
    asset_id,
    stage,
    status,
    progress,
    source_language,
    target_language,
    metadata,
    created_at,
    started_at
  )
  VALUES (
    v_stage_id,
    p_pipeline_id,
    p_asset_id,
    p_stage,
    p_status,
    p_progress,
    p_source_language,
    p_target_language,
    COALESCE(p_metadata, '{}'::jsonb),
    NOW(),
    CASE WHEN p_status = 'running' THEN NOW() ELSE NULL END
  )
  RETURNING id INTO v_execution_id;

  -- 更新 pipeline_stages 的 current_execution_id
  UPDATE public.pipeline_stages
  SET current_execution_id = v_execution_id
  WHERE id = v_stage_id;

  RETURN v_execution_id;
END;
$$;

COMMENT ON FUNCTION public.create_stage_execution IS '创建新的 stage execution，支持 metadata 字段';

-- ============================================================================
-- Step 3: 创建辅助函数：获取当前步骤信息
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_stage_current_step(
  p_execution_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_metadata JSONB;
BEGIN
  SELECT metadata
  INTO v_metadata
  FROM public.stage_executions
  WHERE id = p_execution_id;

  -- 提取步骤信息
  RETURN jsonb_build_object(
    'current_step', v_metadata->>'current_step',
    'step_label', v_metadata->>'step_label',
    'steps_completed', (v_metadata->>'steps_completed')::INTEGER,
    'total_steps', (v_metadata->>'total_steps')::INTEGER
  );
END;
$$;

COMMENT ON FUNCTION public.get_stage_current_step IS '获取 execution 的当前步骤信息';

-- ============================================================================
-- Step 4: 创建视图：Pipeline 详细步骤信息
-- ============================================================================

CREATE OR REPLACE VIEW public.pipeline_detailed_steps AS
SELECT
  ps.pipeline_id,
  ps.asset_id,
  ps.stage,
  ps.status,
  ps.progress,
  ps.metadata->>'current_step' AS current_step,
  ps.metadata->>'step_label' AS step_label,
  (ps.metadata->>'steps_completed')::INTEGER AS steps_completed,
  (ps.metadata->>'total_steps')::INTEGER AS total_steps,
  se.started_at,
  se.completed_at,
  se.failed_at,
  se.error_message
FROM public.pipeline_stages ps
LEFT JOIN public.stage_executions se ON ps.current_execution_id = se.id
ORDER BY ps.pipeline_id, ps.stage;

COMMENT ON VIEW public.pipeline_detailed_steps IS 'Pipeline 各阶段的详细步骤信息';

-- ============================================================================
-- 迁移完成
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed: Metadata support for stage executions';
  RAISE NOTICE '📝 Updated function: update_stage_execution (added p_metadata parameter)';
  RAISE NOTICE '📝 Updated function: create_stage_execution (added p_metadata parameter)';
  RAISE NOTICE '📝 Created function: get_stage_current_step';
  RAISE NOTICE '📝 Created view: pipeline_detailed_steps';
  RAISE NOTICE '🎯 Now you can record detailed processing steps in metadata field';
END $$;
