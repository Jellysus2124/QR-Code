-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'scanner', 'contributor');
create type public.qr_status as enum ('available', 'assigned', 'used');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.app_role not null default 'contributor',
  created_at timestamptz not null default now()
);

create table if not exists public.contributors (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  donation_quantity integer not null default 0 check (donation_quantity >= 0),
  imported_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  prefix text not null,
  sequence integer not null,
  status public.qr_status not null default 'available',
  assigned_email text,
  assigned_by uuid references auth.users(id),
  assigned_at timestamptz,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  unique(prefix, sequence)
);

create table if not exists public.scan_events (
  id uuid primary key default gen_random_uuid(),
  qr_code_id uuid not null references public.qr_codes(id),
  code text not null,
  recipient_email text not null,
  school_name text not null,
  class_name text not null,
  scanned_by uuid not null references auth.users(id),
  scanned_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_email text not null,
  qr_code_id uuid not null references public.qr_codes(id),
  scan_event_id uuid not null references public.scan_events(id),
  title text not null,
  body text not null,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_qr_codes_status on public.qr_codes(status);
create index if not exists idx_qr_codes_assigned_email on public.qr_codes(assigned_email);
create index if not exists idx_notifications_email_created on public.notifications(recipient_email, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_contributors_updated_at on public.contributors;
create trigger trg_contributors_updated_at
before update on public.contributors
for each row
execute function public.touch_updated_at();

create or replace function public.process_qr_scan(
  p_code text,
  p_scanner_id uuid,
  p_school_name text,
  p_class_name text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_qr public.qr_codes;
  v_scan_id uuid;
  v_message text;
begin
  select * into v_qr
  from public.qr_codes
  where code = upper(trim(p_code))
  for update;

  if not found then
    raise exception 'QR khong ton tai.';
  end if;

  if v_qr.status = 'used' then
    raise exception 'QR nay da duoc su dung.';
  end if;

  if v_qr.status <> 'assigned' or v_qr.assigned_email is null then
    raise exception 'QR chua duoc gan cho contributor.';
  end if;

  insert into public.scan_events (
    qr_code_id,
    code,
    recipient_email,
    school_name,
    class_name,
    scanned_by
  )
  values (
    v_qr.id,
    v_qr.code,
    v_qr.assigned_email,
    p_school_name,
    p_class_name,
    p_scanner_id
  )
  returning id into v_scan_id;

  update public.qr_codes
  set status = 'used',
      used_at = now()
  where id = v_qr.id;

  v_message := format(
    'Bo qua %s da trao thanh cong cho hoc sinh lop %s - %s.',
    v_qr.code,
    p_class_name,
    p_school_name
  );

  insert into public.notifications (
    recipient_email,
    qr_code_id,
    scan_event_id,
    title,
    body
  )
  values (
    v_qr.assigned_email,
    v_qr.id,
    v_scan_id,
    'Qua da duoc trao',
    v_message
  );

  return json_build_object('ok', true, 'message', v_message);
end;
$$;

alter table public.profiles enable row level security;
alter table public.contributors enable row level security;
alter table public.qr_codes enable row level security;
alter table public.scan_events enable row level security;
alter table public.notifications enable row level security;

create or replace function public.my_role()
returns public.app_role
language sql
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- profiles
create policy "read own profile" on public.profiles
for select using (id = auth.uid());

create policy "insert own profile" on public.profiles
for insert with check (id = auth.uid());

create policy "update own profile" on public.profiles
for update using (id = auth.uid());

create policy "admin manage profiles" on public.profiles
for all using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

-- contributors
create policy "admin manage contributors" on public.contributors
for all using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

-- qr_codes
create policy "admin and scanner read qr" on public.qr_codes
for select using (public.my_role() in ('admin', 'scanner'));

create policy "admin manage qr" on public.qr_codes
for all using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

-- scan_events
create policy "scanner/admin read scan_events" on public.scan_events
for select using (public.my_role() in ('admin', 'scanner'));

create policy "scanner/admin insert scan_events" on public.scan_events
for insert with check (public.my_role() in ('admin', 'scanner'));

-- notifications
create policy "read own notifications" on public.notifications
for select using (lower(recipient_email) = lower(auth.email()));

create policy "update own notifications" on public.notifications
for update using (lower(recipient_email) = lower(auth.email()));

create policy "admin read notifications" on public.notifications
for select using (public.my_role() = 'admin');

grant execute on function public.process_qr_scan(text, uuid, text, text) to authenticated;
