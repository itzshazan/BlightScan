-- BlightScan schema (spec 5.1), with the extra columns the frontend uses.
-- Run in order: 0001 → 0004 (Supabase SQL Editor, or `supabase db push`).

-- Enums --------------------------------------------------------------------
create type user_role as enum ('farmer', 'expert', 'admin');
create type disease_label as enum ('healthy', 'early_blight', 'late_blight');
create type risk_level as enum ('low', 'medium', 'high');
create type review_status as enum ('none', 'requested', 'reviewed');
create type account_status as enum ('active', 'deactivated');

-- Profiles: one row per auth user --------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,                                   -- copied from auth.users for the admin user list
  role user_role not null default 'farmer',
  status account_status not null default 'active',
  phone text,
  state text,
  district text,
  language text not null default 'en',
  avatar_url text,
  notify_email boolean not null default true,
  notify_weekly boolean not null default false,
  created_at timestamptz not null default now()
);

-- Fields ---------------------------------------------------------------------
create table fields (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  crop text not null default 'tomato',
  variety text,
  area_acres numeric(8, 2) check (area_acres > 0),
  planting_date date,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  current_risk risk_level not null default 'low',
  created_at timestamptz not null default now()
);
create index on fields (user_id);

-- Model versions -------------------------------------------------------------
create table model_versions (
  id uuid primary key default gen_random_uuid(),
  version text unique not null,
  architecture text,
  accuracy numeric(5, 2),
  source_url text,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- Scans ----------------------------------------------------------------------
create table scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  field_id uuid references fields (id) on delete set null,
  image_path text not null,
  predicted_label disease_label not null,
  confidence numeric(5, 2) not null check (confidence between 0 and 100),
  probabilities jsonb not null,   -- {"healthy":0.03,"early_blight":0.91,"late_blight":0.06,"other":0.0}
  severity text check (severity in ('low', 'moderate', 'high')),
  notes text check (char_length(notes) <= 1000),
  model_version text references model_versions (version),
  model_note text,                -- e.g. "This looks most like Septoria leaf spot…"
  in_domain boolean,              -- false when the photo failed the out-of-distribution check
  review_status review_status not null default 'none',
  expert_label disease_label,
  expert_note text,
  reviewed_by uuid references profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index on scans (user_id, created_at desc);
create index on scans (field_id);
create index on scans (review_status) where review_status = 'requested';

-- Spread predictions ---------------------------------------------------------
create table spread_predictions (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references fields (id) on delete cascade,
  scan_id uuid references scans (id) on delete set null,
  disease disease_label not null,
  risk_level risk_level not null,
  risk_score numeric(5, 2) not null,  -- 0 to 100
  forecast jsonb not null,            -- [{"date":"2026-10-19","score":64}, ...]
  summary text,
  weather jsonb,
  created_at timestamptz not null default now()
);
create index on spread_predictions (field_id, created_at desc);

-- Disease library (mirrors web/lib/diseases.ts) ------------------------------
create table diseases (
  slug text primary key,
  label disease_label not null unique,
  name text not null,
  pathogen text,
  pathogen_type text,
  severity text,
  deck text,
  summary text,
  short_symptom text,
  symptoms text[],
  conditions jsonb,                   -- [{"key":"Warmth","value":"24–29 °C","note":"…"}]
  favourable_conditions text,
  spread_mode text,
  treatment_organic text[],
  treatment_chemical text[],
  prevention text[],
  related text,
  image_urls text[]
);

-- Contact messages -----------------------------------------------------------
create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  subject text check (subject in ('General', 'Bug report', 'Feedback', 'Collaboration')),
  message text not null check (char_length(message) between 20 and 5000),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Helpers & triggers ---------------------------------------------------------

-- Current user's role (security definer so RLS policies can call it without recursion).
create function public.my_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

-- Create a profile on signup. Google sign-in provides `name` / `picture` instead of full_name / avatar_url.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );
  return new;
end;
$$;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Keep profiles.email in step when a user changes their email.
create function public.sync_profile_email() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update profiles set email = new.email where id = new.id;
  return new;
end;
$$;
create trigger on_auth_user_email_changed
after update of email on auth.users
for each row execute function public.sync_profile_email();

-- Users may edit their own profile, but never their role, status or email.
-- Those change only through the admin API route (service role) or the SQL editor.
-- SECURITY INVOKER on purpose: current_user is 'authenticated' for browser requests.
create function public.protect_profile_columns() returns trigger
language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon')
     and (new.role is distinct from old.role
          or new.status is distinct from old.status
          or new.email is distinct from old.email
          or new.id is distinct from old.id) then
    raise exception 'Only an administrator can change role, status or email';
  end if;
  return new;
end;
$$;
create trigger protect_profile_columns
before update on profiles
for each row execute function public.protect_profile_columns();
