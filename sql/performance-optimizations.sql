-- Performance Optimizations for EchoSpeak Supabase Project
-- Run these SQL commands in Supabase SQL Editor to improve performance
-- Generated: 2025-12-30

-- ============================================================================
-- 1. Add missing indexes for foreign keys (INFO level)
-- ============================================================================

-- Index for media_assets.created_by
CREATE INDEX IF NOT EXISTS idx_media_assets_created_by
ON public.media_assets(created_by);

-- Index for transcripts.updated_by
CREATE INDEX IF NOT EXISTS idx_transcripts_updated_by
ON public.transcripts(updated_by);

-- ============================================================================
-- 2. Optimize RLS policies to use initplan (WARN level)
-- ============================================================================

-- Drop existing policies (they will be recreated with optimized versions)
DROP POLICY IF EXISTS "Service role full access jobs" ON public.jobs;
DROP POLICY IF EXISTS "Service role full access media_assets" ON public.media_assets;
DROP POLICY IF EXISTS "Service role full access transcripts" ON public.transcripts;

-- Recreate optimized policies for service role
CREATE POLICY "Service role full access jobs"
ON public.jobs
TO service_role
USING ((select auth.uid()) is not null)
WITH CHECK ((select auth.uid()) is not null);

CREATE POLICY "Service role full access media_assets"
ON public.media_assets
TO service_role
USING ((select auth.uid()) is not null)
WITH CHECK ((select auth.uid()) is not null);

CREATE POLICY "Service role full access transcripts"
ON public.transcripts
TO service_role
USING ((select auth.uid()) is not null)
WITH CHECK ((select auth.uid()) is not null);

-- ============================================================================
-- 3. Add additional useful indexes for common query patterns
-- ============================================================================

-- Index for media_assets status filtering (common in content library)
CREATE INDEX IF NOT EXISTS idx_media_assets_status
ON public.media_assets(status) WHERE status IN ('processing', 'published');

-- Index for jobs status and type filtering (common in job watcher)
CREATE INDEX IF NOT EXISTS idx_jobs_status_type
ON public.jobs(status, type) WHERE status IN ('queued', 'running');

-- Index for transcripts asset_id lookup (common for fetching subtitles)
CREATE INDEX IF NOT EXISTS idx_transcripts_asset_id_sequence
ON public.transcripts(asset_id, sequence);

-- ============================================================================
-- 4. Verify indexes were created
-- ============================================================================

-- List all indexes on our tables
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('media_assets', 'transcripts', 'jobs')
ORDER BY tablename, indexname;

-- ============================================================================
-- 5. Verify RLS policies were updated
-- ============================================================================

SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('media_assets', 'transcripts', 'jobs')
ORDER BY tablename, policyname;

-- ============================================================================
-- Expected Results
-- ============================================================================
-- After running this script:
-- 1. The "Unindexed foreign keys" warnings should be resolved
-- 2. The "Auth RLS Initialization Plan" warnings should be resolved
-- 3. Additional indexes will improve query performance for common patterns
-- 4. RLS policies will use optimized initplan instead of per-row evaluation
-- ============================================================================

-- Documentation:
-- https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys
-- https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
