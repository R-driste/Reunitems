-- Enable pgcrypto for UUID generation
create extension if not exists "pgcrypto";

-- =========================
-- SCHOOLS
-- =========================
create table schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  created_at timestamptz default now()
);

alter table schools enable row level security;

-- Authenticated users can create schools
create policy "authenticated users can create schools"
on schools
for insert
with check (auth.uid() is not null);

-- Members can read their own school
create policy "members can read their school"
on schools
for select
using (
  exists (
    select 1 from memberships
    where memberships.school_id = schools.id
      and memberships.user_id = auth.uid()
  )
);

-- =========================
-- MEMBERSHIPS
-- =========================
create table memberships (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references schools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','student')),
  created_at timestamptz default now(),
  unique (school_id, user_id)
);

alter table memberships enable row level security;

-- Users can read their own memberships
create policy "users can read own memberships"
on memberships
for select
using (user_id = auth.uid());

-- Admins can manage memberships within their school
create policy "admins can manage memberships"
on memberships
for all
using (
  exists (
    select 1 from memberships m
    where m.school_id = memberships.school_id
      and m.user_id = auth.uid()
      and m.role = 'admin'
  )
);

-- =========================
-- ITEMS
-- =========================
create table items (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references schools(id) on delete cascade,
  name text not null,
  location text,
  date_found date,
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

alter table items enable row level security;

-- Members can read items from their school
create policy "members can read items"
on items
for select
using (
  exists (
    select 1 from memberships
    where memberships.school_id = items.school_id
      and memberships.user_id = auth.uid()
  )
);

-- Members can insert items (must belong to school AND be creator)
create policy "members can insert items"
on items
for insert
with check (
  new.created_by = auth.uid()
  and exists (
    select 1 from memberships
    where memberships.school_id = new.school_id
      and memberships.user_id = auth.uid()
  )
);

-- Only admins can update items
create policy "admins can update items"
on items
for update
using (
  exists (
    select 1 from memberships
    where memberships.school_id = items.school_id
      and memberships.user_id = auth.uid()
      and memberships.role = 'admin'
  )
)
with check (
  exists (
    select 1 from memberships
    where memberships.school_id = new.school_id
      and memberships.user_id = auth.uid()
      and memberships.role = 'admin'
  )
);

-- Only admins can delete items
create policy "admins can delete items"
on items
for delete
using (
  exists (
    select 1 from memberships
    where memberships.school_id = items.school_id
      and memberships.user_id = auth.uid()
      and memberships.role = 'admin'
  )
);

-- =========================
-- CLAIMS
-- =========================
create table claims (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text,
  user_email text,
  message text,
  created_at timestamptz default now()
);

alter table claims enable row level security;

-- Members can insert claims (must belong to same school + not spoof user_id)
create policy "members can insert claims"
on claims
for insert
with check (
  new.user_id = auth.uid()
  and exists (
    select 1
    from items
    join memberships
      on items.school_id = memberships.school_id
    where items.id = new.item_id
      and memberships.user_id = auth.uid()
  )
);

-- Members can read claims for items in their school
create policy "members can read claims"
on claims
for select
using (
  exists (
    select 1
    from items
    join memberships
      on items.school_id = memberships.school_id
    where items.id = claims.item_id
      and memberships.user_id = auth.uid()
  )
);
