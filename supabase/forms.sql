-- MSAR website forms — run once in the Supabase SQL editor (Project → SQL Editor).
-- Safe to re-run: it only creates what is missing.
-- The website uses the public *publishable* key, so Row Level Security must allow
-- anonymous INSERT only — never SELECT, UPDATE or DELETE.

-- 1) Membership applications (this table already exists on the live project)
create table if not exists public.join_requests (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  full_name     text not null,
  email         text not null,
  phone         text,
  institution   text,
  programme     text,
  year_of_study text,
  interests     text[] default '{}',
  why_join      text
);
alter table public.join_requests enable row level security;
drop policy if exists "Website can submit join requests" on public.join_requests;
create policy "Website can submit join requests"
  on public.join_requests for insert to anon with check (true);

-- 2) Contact form messages (new)
create table if not exists public.contact_messages (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(name) <= 200),
  email       text not null check (char_length(email) <= 320),
  subject     text check (char_length(subject) <= 120),
  message     text not null check (char_length(message) <= 5000),
  handled     boolean not null default false
);
alter table public.contact_messages enable row level security;
drop policy if exists "Website can submit contact messages" on public.contact_messages;
create policy "Website can submit contact messages"
  on public.contact_messages for insert to anon with check (true);

-- Read submissions in the Supabase Table Editor (authenticated dashboard access).

-- 3) Event registrations (new) — one table for every event's registration form.
--    Event-specific answers (e.g. "Have you created a Jobra Talent Profile?") are stored in `answers` (JSON).
create table if not exists public.event_registrations (
  id             bigint generated always as identity primary key,
  created_at     timestamptz not null default now(),
  event_slug     text not null check (char_length(event_slug) <= 120),
  event_title    text check (char_length(event_title) <= 300),
  full_name      text not null check (char_length(full_name) <= 200),
  email          text not null check (char_length(email) <= 320),
  phone          text not null check (char_length(phone) <= 40),
  institution    text not null check (char_length(institution) <= 200),
  program        text not null check (char_length(program) <= 200),
  academic_year  text check (char_length(academic_year) <= 40),
  answers        jsonb not null default '{}'::jsonb
);
create index if not exists event_registrations_event_idx on public.event_registrations (event_slug, created_at);
alter table public.event_registrations enable row level security;
drop policy if exists "Website can submit event registrations" on public.event_registrations;
create policy "Website can submit event registrations"
  on public.event_registrations for insert to anon with check (true);

-- Handy view for exporting a clean list per event (Table Editor → event_registrations_flat → Export CSV)
create or replace view public.event_registrations_flat
with (security_invoker = true) as
select
  created_at, event_slug, full_name, email, phone, institution, program, academic_year,
  answers->>'year_other'            as academic_year_other,
  answers->>'msar_member'           as msar_member,
  answers->>'jobra_talent_profile'  as jobra_talent_profile,
  (select string_agg(x, '; ') from jsonb_array_elements_text(coalesce(answers->'interests', '[]'::jsonb)) as x) as interests
from public.event_registrations;
