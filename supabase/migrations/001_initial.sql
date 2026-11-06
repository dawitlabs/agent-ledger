-- Relay multiplayer AI workspace schema
-- Run against Supabase Postgres (SQL editor or CLI).

create extension if not exists "pgcrypto";

-- Profiles (extends auth.users when using Supabase Auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null,
  color text not null default '#1a1a1a',
  initials text not null default '??',
  created_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id text primary key,
  workspace_id text references public.workspaces (id) on delete set null,
  slug text not null,
  title text not null,
  prompt text not null,
  status text not null default 'idle'
    check (status in ('idle', 'running', 'paused', 'completed', 'failed')),
  owner_id text not null,
  owner_name text not null,
  current_owner_id text not null,
  current_owner_name text not null,
  invite_code text not null unique,
  artifact_title text not null,
  artifact_content text not null default '',
  artifact_updated_at timestamptz not null default now(),
  plan jsonb not null default '[]'::jsonb,
  current_step_index integer not null default 0,
  pending_steer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rooms_updated_at_idx on public.rooms (updated_at desc);
create index if not exists rooms_invite_code_idx on public.rooms (invite_code);

create table if not exists public.room_members (
  room_id text not null references public.rooms (id) on delete cascade,
  user_id text not null,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  name text not null,
  email text not null,
  color text not null,
  initials text not null,
  primary key (room_id, user_id)
);

create table if not exists public.room_events (
  id text primary key,
  room_id text not null references public.rooms (id) on delete cascade,
  kind text not null,
  at timestamptz not null default now(),
  actor_id text,
  actor_name text,
  title text not null,
  body text,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists room_events_room_at_idx
  on public.room_events (room_id, at asc);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists rooms_set_updated_at on public.rooms;
create trigger rooms_set_updated_at
  before update on public.rooms
  for each row execute function public.set_updated_at();

-- Helper: is the caller a member of the room?
create or replace function public.is_room_member(p_room_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.room_members m
    where m.room_id = p_room_id
      and m.user_id = auth.uid()::text
  );
$$;

create or replace function public.room_role(p_room_id text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.role
  from public.room_members m
  where m.room_id = p_room_id
    and m.user_id = auth.uid()::text
  limit 1;
$$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.room_events enable row level security;

-- Profiles
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- Rooms: members can read; owners/editors can write
drop policy if exists "rooms_select_member" on public.rooms;
create policy "rooms_select_member"
  on public.rooms for select
  to authenticated
  using (public.is_room_member(id));

drop policy if exists "rooms_insert_authenticated" on public.rooms;
create policy "rooms_insert_authenticated"
  on public.rooms for insert
  to authenticated
  with check (owner_id = auth.uid()::text);

drop policy if exists "rooms_update_editor" on public.rooms;
create policy "rooms_update_editor"
  on public.rooms for update
  to authenticated
  using (public.room_role(id) in ('owner', 'editor'))
  with check (public.room_role(id) in ('owner', 'editor'));

-- Members
drop policy if exists "members_select_member" on public.room_members;
create policy "members_select_member"
  on public.room_members for select
  to authenticated
  using (public.is_room_member(room_id));

drop policy if exists "members_insert_editor" on public.room_members;
create policy "members_insert_editor"
  on public.room_members for insert
  to authenticated
  with check (
    user_id = auth.uid()::text
    or public.room_role(room_id) in ('owner', 'editor')
  );

drop policy if exists "members_update_owner" on public.room_members;
create policy "members_update_owner"
  on public.room_members for update
  to authenticated
  using (public.room_role(room_id) = 'owner');

-- Events: append-only for members; editors+ can insert agent/human actions
drop policy if exists "events_select_member" on public.room_events;
create policy "events_select_member"
  on public.room_events for select
  to authenticated
  using (public.is_room_member(room_id));

drop policy if exists "events_insert_member" on public.room_events;
create policy "events_insert_member"
  on public.room_events for insert
  to authenticated
  with check (public.is_room_member(room_id));

-- Realtime publication
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_events;
alter publication supabase_realtime add table public.room_members;

-- Service role bypasses RLS for the Next.js agent runner.
-- Prefer the service role key only on the server.
