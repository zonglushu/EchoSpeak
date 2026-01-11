-- Migration: Separate Transcribe and Translate Stages
-- Description: 将提取字幕和翻译字幕分离成两个独立阶段，支持多语言翻译
-- Date: 2026-01-04

-- ============================================================================
-- Step 1: 扩展 transcripts 表，支持多语言翻译
-- ============================================================================

-- 添加语言字段和翻译 JSON 字段
ALTER TABLE public.transcripts 
ADD COLUMN IF NOT EXISTS source_language VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';

-- 添加注释
COMMENT ON COLUMN public.transcripts.source_language IS '原始字幕的语言代码，如：en, zh, ja';
COMMENT ON COLUMN public.transcripts.translations IS '翻译结果的 JSON 对象，格式：{"zh": "中文翻译", "ja": "日语翻译"}';

-- 创建索引以加速多语言查询
CREATE INDEX IF NOT EXISTS idx_transcripts_source_language 
ON public.transcripts(source_language);

CREATE INDEX IF NOT EXISTS idx_transcripts_translations 
ON public.transcripts USING GIN (translations);

-- ============================================================================
-- Step 2: 检查并确保 pipelines 表存在（如果不存在则创建）
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'running', 'completed', 'failed', 'canceled')),
  current_stage TEXT CHECK (current_stage IN ('upload', 'transcribe', 'translate', 'notation', 'publish')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  CONSTRAINT unique_pipeline_per_asset UNIQUE(asset_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_pipelines_asset ON public.pipelines(asset_id);
CREATE INDEX IF NOT EXISTS idx_pipelines_status ON public.pipelines(status);
CREATE INDEX IF NOT EXISTS idx_pipelines_current_stage ON public.pipelines(current_stage);

-- RLS 策略
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pipelines'
      AND policyname = 'Service role full access pipelines'
  ) THEN
    CREATE POLICY "Service role full access pipelines"
      ON public.pipelines
      FOR ALL
      TO public
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- Step 3: 更新 jobs 表，支持新的 stage 类型和翻译相关字段
-- ============================================================================

-- 检查 jobs 表结构，如果还在使用旧的 type 字段，需要迁移
DO $$
BEGIN
  -- 检查是否存在 stage 列
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'jobs' 
      AND column_name = 'stage'
  ) THEN
    -- 添加新的 stage 列
    ALTER TABLE public.jobs ADD COLUMN stage TEXT;
    
    -- 从旧的 type 列迁移数据
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'jobs' 
        AND column_name = 'type'
    ) THEN
      UPDATE public.jobs SET stage = type WHERE stage IS NULL;
    END IF;
    
    -- 添加约束
    ALTER TABLE public.jobs 
    ADD CONSTRAINT jobs_stage_check 
    CHECK (stage IN ('upload', 'transcribe', 'translate', 'notation', 'publish'));
  END IF;
  
  -- 检查是否存在 pipeline_id 列
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'jobs' 
      AND column_name = 'pipeline_id'
  ) THEN
    ALTER TABLE public.jobs 
    ADD COLUMN pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE CASCADE;
    
    CREATE INDEX idx_jobs_pipeline ON public.jobs(pipeline_id);
  END IF;
  
  -- 添加翻译相关字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'jobs' 
      AND column_name = 'source_language'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN source_language VARCHAR(10);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'jobs' 
      AND column_name = 'target_language'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN target_language VARCHAR(10);
  END IF;
  
  -- 更新 status 约束以匹配新系统
  ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
  ALTER TABLE public.jobs 
  ADD CONSTRAINT jobs_status_check 
  CHECK (status IN ('pending', 'queued', 'running', 'completed', 'failed', 'retrying', 'canceled'));
  
END $$;

-- 添加注释
COMMENT ON COLUMN public.jobs.stage IS '任务阶段：upload, transcribe, translate, notation, publish';
COMMENT ON COLUMN public.jobs.source_language IS '源语言（用于 translate 阶段）';
COMMENT ON COLUMN public.jobs.target_language IS '目标语言（用于 translate 阶段）';

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_jobs_stage ON public.jobs(stage);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_asset_stage ON public.jobs(asset_id, stage);

-- ============================================================================
-- Step 4: 创建辅助函数：获取字幕的特定语言翻译
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_transcript_translation(
  transcript_row public.transcripts,
  lang_code TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- 如果请求的就是源语言，返回原文
  IF transcript_row.source_language = lang_code THEN
    -- 根据语言返回对应字段（兼容旧数据）
    CASE lang_code
      WHEN 'en' THEN RETURN transcript_row.text_en;
      WHEN 'zh', 'cn' THEN RETURN transcript_row.text_cn;
      ELSE RETURN NULL;
    END CASE;
  END IF;
  
  -- 否则从 translations JSON 中获取
  RETURN transcript_row.translations->>lang_code;
END;
$$;

COMMENT ON FUNCTION public.get_transcript_translation IS '获取字幕的指定语言翻译';

-- ============================================================================
-- Step 5: 创建辅助函数：批量更新翻译
-- ============================================================================

CREATE OR REPLACE FUNCTION public.batch_update_translations(
  p_asset_id UUID,
  p_target_language TEXT,
  p_translations JSONB -- 格式：[{"id": "uuid", "translation": "text"}]
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count INTEGER := 0;
  translation_item JSONB;
BEGIN
  -- 遍历翻译数组
  FOR translation_item IN SELECT * FROM jsonb_array_elements(p_translations)
  LOOP
    -- 更新 translations JSON 字段
    UPDATE public.transcripts
    SET 
      translations = jsonb_set(
        COALESCE(translations, '{}'::jsonb),
        ARRAY[p_target_language],
        to_jsonb((translation_item->>'translation')::text)
      ),
      updated_at = NOW()
    WHERE id = (translation_item->>'id')::uuid
      AND asset_id = p_asset_id;
    
    IF FOUND THEN
      updated_count := updated_count + 1;
    END IF;
  END LOOP;
  
  RETURN updated_count;
END;
$$;

COMMENT ON FUNCTION public.batch_update_translations IS '批量更新字幕翻译（用于 Translate Job）';

-- ============================================================================
-- Step 6: 创建视图：方便查询多语言字幕
-- ============================================================================

CREATE OR REPLACE VIEW public.transcripts_with_translations AS
SELECT 
  t.id,
  t.asset_id,
  t.sequence,
  t.start_time_ms,
  t.end_time_ms,
  t.source_language,
  t.text_en AS text_original_en,  -- 保留旧字段兼容性
  t.text_cn AS text_original_cn,  -- 保留旧字段兼容性
  t.translations,
  -- 提取常用翻译到单独列（方便查询）
  t.translations->>'zh' AS text_zh,
  t.translations->>'ja' AS text_ja,
  t.translations->>'ko' AS text_ko,
  t.translations->>'es' AS text_es,
  t.translations->>'fr' AS text_fr,
  t.translations->>'de' AS text_de,
  t.notation,
  t.lock_state,
  t.status,
  t.updated_by,
  t.updated_at
FROM public.transcripts t;

COMMENT ON VIEW public.transcripts_with_translations IS '字幕多语言视图，方便查询各语言翻译';

-- ============================================================================
-- Step 7: 数据迁移：将现有数据适配新结构
-- ============================================================================

-- 迁移现有的双语字幕到新格式
UPDATE public.transcripts
SET 
  source_language = CASE
    WHEN text_en IS NOT NULL AND text_en != '' THEN 'en'
    WHEN text_cn IS NOT NULL AND text_cn != '' THEN 'zh'
    ELSE 'en'
  END,
  translations = CASE
    WHEN text_en IS NOT NULL AND text_cn IS NOT NULL THEN
      jsonb_build_object('zh', text_cn)
    ELSE '{}'::jsonb
  END
WHERE translations = '{}'::jsonb OR translations IS NULL;

-- ============================================================================
-- Step 8: 创建配置表：存储翻译配置
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.translation_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  source_language VARCHAR(10) NOT NULL,
  target_languages TEXT[] NOT NULL DEFAULT '{}',
  auto_translate BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_translation_config_per_asset UNIQUE(asset_id)
);

CREATE INDEX IF NOT EXISTS idx_translation_configs_asset 
ON public.translation_configs(asset_id);

-- RLS 策略
ALTER TABLE public.translation_configs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'translation_configs'
      AND policyname = 'Service role full access translation_configs'
  ) THEN
    CREATE POLICY "Service role full access translation_configs"
      ON public.translation_configs
      FOR ALL
      TO public
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

COMMENT ON TABLE public.translation_configs IS '视频翻译配置表';
COMMENT ON COLUMN public.translation_configs.source_language IS '源语言';
COMMENT ON COLUMN public.translation_configs.target_languages IS '目标语言列表';
COMMENT ON COLUMN public.translation_configs.auto_translate IS '是否自动翻译';

-- ============================================================================
-- 迁移完成
-- ============================================================================

-- 记录迁移日志
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed: Transcribe and Translate separation';
  RAISE NOTICE '📝 Added columns: transcripts.source_language, transcripts.translations';
  RAISE NOTICE '📝 Added columns: jobs.source_language, jobs.target_language';
  RAISE NOTICE '📝 Created table: translation_configs';
  RAISE NOTICE '📝 Created functions: get_transcript_translation, batch_update_translations';
  RAISE NOTICE '📝 Created view: transcripts_with_translations';
END $$;
