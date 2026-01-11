-- EchoSpeak Stage 2 core schema
-- Run via `supabase db push` or Supabase SQL editor before bootstrapping the admin app.
-- Updated: 2026-01-03 - Added pipelines table and refactored jobs table

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  duration_seconds integer,
  status text not null default 'draft' check (status in ('draft','processing','published','archived')),
  cover_url text,
  source_url text,
  tag_list text[],
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transcripts (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.media_assets(id) on delete cascade,
  sequence integer not null,
  start_time_ms integer not null,
  end_time_ms integer not null,
  text_en text,
  text_cn text,
  notation jsonb,
  lock_state text not null default 'unlocked' check (lock_state in ('unlocked','locked')),
  status text not null default 'pending' check (status in ('pending','ai_generating','ready','error')),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.media_assets(id) on delete cascade,
  type text not null check (type in ('upload','transcribe','translate','notation')),
  payload jsonb,
  status text not null default 'queued' check (status in ('queued','running','success','failed','canceled')),
  progress numeric default 0,
  error text,
  retries integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_transcripts_asset_sequence on public.transcripts(asset_id, sequence);
create index if not exists idx_jobs_asset_type on public.jobs(asset_id, type);

alter table if exists public.media_assets enable row level security;
alter table if exists public.transcripts enable row level security;
alter table if exists public.jobs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'media_assets'
      and policyname = 'Service role full access media_assets'
  ) then
    create policy "Service role full access media_assets"
      on public.media_assets
      for all
      to public
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'transcripts'
      and policyname = 'Service role full access transcripts'
  ) then
    create policy "Service role full access transcripts"
      on public.transcripts
      for all
      to public
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'jobs'
      and policyname = 'Service role full access jobs'
  ) then
    create policy "Service role full access jobs"
      on public.jobs
      for all
      to public
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Storage bucket + policies for signed uploads from the admin uploader
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('media-uploads', 'media-uploads', false)
on conflict (id) do update set public = excluded.public;

-- 允许管理员界面通过 Supabase 的 Signed Upload URL 将对象写入指定 bucket。
-- Signed Upload token 以 authenticated 角色执行，因此这里赋予 authenticated 角色最小权限。

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Allow authenticated select media uploads'
  ) then
    create policy "Allow authenticated select media uploads"
      on storage.objects
      for select
      to authenticated
      using (bucket_id = 'media-uploads');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Allow authenticated insert media uploads'
  ) then
    create policy "Allow authenticated insert media uploads"
      on storage.objects
      for insert
      to authenticated
      with check (bucket_id = 'media-uploads');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Allow authenticated update media uploads'
  ) then
    create policy "Allow authenticated update media uploads"
      on storage.objects
      for update
      to authenticated
      using (bucket_id = 'media-uploads')
      with check (bucket_id = 'media-uploads');
  end if;
end $$;
