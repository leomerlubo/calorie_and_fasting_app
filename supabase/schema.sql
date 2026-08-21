-- Run this in a fresh Supabase project.
-- The client must use a publishable key only. Never expose service_role keys.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  height_cm numeric(6,2) not null default 160,
  weight_kg numeric(6,2) not null default 70,
  dob date,
  gender text not null default 'male' check (gender in ('male','female')),
  activity_level text not null default 'sedentary' check (activity_level in ('sedentary','light','moderate','very','extra')),
  calorie_goal integer not null default 1800 check (calorie_goal between 200 and 10000),
  use_suggested_goal boolean not null default false,
  timezone text not null default 'Asia/Manila',
  hashtag_mode text not null default 'auto' check (hashtag_mode in ('auto','manual')),
  manual_hashtag text not null default '#HealthFirst',
  colors jsonb not null default '{"background":"#22333b","primary":"#eae0d5","secondary":"#c6ac8f","tabBackground":"#d1f0b1","textPrimary":"#eae0d5","textSecondary":"#c6ac8f","progressBar":"#00ff00","foodButton":"#943a1a","activityButton":"#2a722f"}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  name text not null check (char_length(name) between 1 and 120),
  calories integer not null check (calories between 1 and 20000),
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  name text not null check (char_length(name) between 1 and 120),
  duration_minutes integer not null check (duration_minutes between 1 and 1440),
  calories_burned integer not null check (calories_burned between 1 and 20000),
  created_at timestamptz not null default now()
);

create table if not exists public.food_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  calories integer not null check (calories between 1 and 20000),
  created_at timestamptz not null default now()
);
create unique index if not exists food_presets_user_lower_name_idx on public.food_presets(user_id, lower(name));

create table if not exists public.fasting_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  constraint fasting_end_after_start check (ended_at is null or ended_at >= started_at)
);
create unique index if not exists one_active_fast_per_user_idx on public.fasting_sessions(user_id) where ended_at is null;

create index if not exists food_logs_user_date_idx on public.food_logs(user_id, log_date desc);
create index if not exists activity_logs_user_date_idx on public.activity_logs(user_id, log_date desc);
create index if not exists fasting_sessions_user_started_idx on public.fasting_sessions(user_id, started_at desc);

alter table public.profiles enable row level security;
alter table public.food_logs enable row level security;
alter table public.activity_logs enable row level security;
alter table public.food_presets enable row level security;
alter table public.fasting_sessions enable row level security;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.food_logs to authenticated;
grant select, insert, update, delete on public.activity_logs to authenticated;
grant select, insert, update, delete on public.food_presets to authenticated;
grant select, insert, update, delete on public.fasting_sessions to authenticated;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "profiles_delete_own" on public.profiles for delete to authenticated using ((select auth.uid()) = user_id);

create policy "food_logs_select_own" on public.food_logs for select to authenticated using ((select auth.uid()) = user_id);
create policy "food_logs_insert_own" on public.food_logs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "food_logs_update_own" on public.food_logs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "food_logs_delete_own" on public.food_logs for delete to authenticated using ((select auth.uid()) = user_id);

create policy "activity_logs_select_own" on public.activity_logs for select to authenticated using ((select auth.uid()) = user_id);
create policy "activity_logs_insert_own" on public.activity_logs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "activity_logs_update_own" on public.activity_logs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "activity_logs_delete_own" on public.activity_logs for delete to authenticated using ((select auth.uid()) = user_id);

create policy "food_presets_select_own" on public.food_presets for select to authenticated using ((select auth.uid()) = user_id);
create policy "food_presets_insert_own" on public.food_presets for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "food_presets_update_own" on public.food_presets for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "food_presets_delete_own" on public.food_presets for delete to authenticated using ((select auth.uid()) = user_id);

create policy "fasting_select_own" on public.fasting_sessions for select to authenticated using ((select auth.uid()) = user_id);
create policy "fasting_insert_own" on public.fasting_sessions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "fasting_update_own" on public.fasting_sessions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "fasting_delete_own" on public.fasting_sessions for delete to authenticated using ((select auth.uid()) = user_id);
