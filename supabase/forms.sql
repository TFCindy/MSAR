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
