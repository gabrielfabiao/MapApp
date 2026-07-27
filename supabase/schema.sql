-- BlooMap Supabase schema
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query).

-- ============================================================
-- PROJECTS
-- One row per project. Markers/buildings are stored as JSONB
-- to match the app's existing "save whole project object" pattern.
-- ============================================================
create table public.projects (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  image text,
  marker_type text not null default 'number',
  markers jsonb not null default '[]'::jsonb,
  buildings jsonb not null default '[]'::jsonb,
  pixels_per_unit numeric not null default 10,
  location jsonb not null default '{"lat":51.5,"lng":-0.1}'::jsonb,
  north_bearing numeric not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index projects_user_id_idx on public.projects (user_id);

alter table public.projects enable row level security;

create policy "select own projects" on public.projects
  for select using (auth.uid() = user_id);

create policy "insert own projects" on public.projects
  for insert with check (auth.uid() = user_id);

create policy "update own projects" on public.projects
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "delete own projects" on public.projects
  for delete using (auth.uid() = user_id);

-- ============================================================
-- USER SETTINGS
-- Replaces the old 'image_captioner_settings' localStorage key
-- (currently just the Pl@ntNet API key).
-- ============================================================
create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plant_api_key text,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "manage own settings" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKET
-- Public bucket for project/marker photos (Phase B). Reads are
-- open to anyone with the URL (random UUID filenames); writes are
-- restricted to the owner's own folder (${userId}/...).
-- ============================================================
insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true);

create policy "public read project images" on storage.objects
  for select using (bucket_id = 'project-images');

create policy "owners insert project images" on storage.objects
  for insert with check (
    bucket_id = 'project-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owners update project images" on storage.objects
  for update using (
    bucket_id = 'project-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owners delete project images" on storage.objects
  for delete using (
    bucket_id = 'project-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
