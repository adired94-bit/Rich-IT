-- Rich IT Solutions CRM — initial schema
-- Run in the Supabase SQL editor or via `supabase db push`.
-- Mirrors src/db/schema.ts (Drizzle). Keep both in sync.

create extension if not exists "pgcrypto";

-- ---------- Enums ----------
create type service_category as enum ('network_infrastructure','server_infrastructure','cybersecurity','physical_security','low_voltage','managed_it');
create type billing_type as enum ('hourly','fixed','retainer','hardware_markup');
create type sla_level as enum ('none','basic','standard','premium','enterprise');
create type client_status as enum ('active','inactive','lead');
create type vault_category as enum ('server','network','wifi','cloud','credentials','note');
create type work_order_status as enum ('draft','sent','viewed','signed','cancelled');
create type document_language as enum ('he','ru','dual');
create type item_type as enum ('service','hardware','labor','discount');
create type event_status as enum ('scheduled','in_progress','completed','cancelled');
create type event_type as enum ('visit','remote','task','meeting','reminder');
create type interaction_type as enum ('note','call','visit','remote','email','whatsapp','work_order','event','voice_log');
create type voice_log_status as enum ('processing','done','failed');
create type document_event as enum ('created','sent','viewed','signed','cancelled');

-- ---------- updated_at trigger ----------
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- Tables ----------
create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  phone text,
  email text,
  address text,
  notes text,
  sla_level sla_level not null default 'none',
  status client_status not null default 'active',
  preferred_language document_language not null default 'he',
  hourly_rate numeric(12,2),
  billing_info jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index clients_name_idx on clients (name);
create index clients_status_idx on clients (status);
create trigger clients_updated_at before update on clients for each row execute function set_updated_at();

create table client_vault (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  title text not null,
  category vault_category not null default 'credentials',
  encrypted_data text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index client_vault_client_idx on client_vault (client_id);
create trigger client_vault_updated_at before update on client_vault for each row execute function set_updated_at();

create table services (
  id uuid primary key default gen_random_uuid(),
  category service_category not null,
  sku text,
  title_he text not null,
  title_ru text not null,
  description_he text,
  description_ru text,
  keywords text[] not null default '{}'::text[],
  default_price numeric(12,2) not null,
  billing_type billing_type not null default 'fixed',
  unit text not null default 'unit',
  markup_percent numeric(5,2),
  included_hours numeric(6,2),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index services_category_idx on services (category);
create index services_active_idx on services (active);
create trigger services_updated_at before update on services for each row execute function set_updated_at();

create table retainers (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  service_id uuid references services(id) on delete set null,
  title text not null,
  total_hours numeric(6,2) not null,
  monthly_fee numeric(12,2) not null,
  overage_rate numeric(12,2),
  period_start timestamptz not null,
  period_end timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index retainers_client_idx on retainers (client_id);
create trigger retainers_updated_at before update on retainers for each row execute function set_updated_at();

create table work_orders (
  id uuid primary key default gen_random_uuid(),
  number text not null,
  client_id uuid not null references clients(id) on delete restrict,
  date timestamptz not null default now(),
  title text not null,
  summary text,
  internal_notes text,
  next_steps text,
  language document_language not null default 'he',
  status work_order_status not null default 'draft',
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  vat_rate numeric(5,4) not null default 0.18,
  vat_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  currency text not null default 'ILS',
  time_spent_minutes integer not null default 0,
  performer_name text,
  raw_audio_url text,
  transcript text,
  ai_result jsonb,
  signature_url text,
  signer_name text,
  pdf_url text,
  approval_token text not null default encode(gen_random_bytes(24), 'hex'),
  sent_at timestamptz,
  viewed_at timestamptz,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index work_orders_number_idx on work_orders (number);
create unique index work_orders_approval_token_idx on work_orders (approval_token);
create index work_orders_client_idx on work_orders (client_id);
create index work_orders_status_idx on work_orders (status);
create index work_orders_date_idx on work_orders (date);
create trigger work_orders_updated_at before update on work_orders for each row execute function set_updated_at();

create table work_order_items (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references work_orders(id) on delete cascade,
  service_id uuid references services(id) on delete set null,
  item_type item_type not null default 'service',
  description text not null,
  description_ru text,
  quantity numeric(10,2) not null default 1,
  unit text not null default 'unit',
  unit_price numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index work_order_items_wo_idx on work_order_items (work_order_id);

create table retainer_usage (
  id uuid primary key default gen_random_uuid(),
  retainer_id uuid not null references retainers(id) on delete cascade,
  work_order_id uuid references work_orders(id) on delete set null,
  hours numeric(6,2) not null,
  note text,
  used_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index retainer_usage_retainer_idx on retainer_usage (retainer_id);

create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  work_order_id uuid references work_orders(id) on delete set null,
  title text not null,
  description text,
  location text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  all_day boolean not null default false,
  status event_status not null default 'scheduled',
  type event_type not null default 'visit',
  google_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index calendar_events_start_idx on calendar_events (start_time);
create index calendar_events_client_idx on calendar_events (client_id);
create trigger calendar_events_updated_at before update on calendar_events for each row execute function set_updated_at();

create table interaction_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  type interaction_type not null default 'note',
  title text not null,
  body text,
  work_order_id uuid references work_orders(id) on delete set null,
  event_id uuid references calendar_events(id) on delete set null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index interaction_logs_client_idx on interaction_logs (client_id, occurred_at);

create table voice_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  work_order_id uuid references work_orders(id) on delete set null,
  audio_url text,
  duration_seconds integer,
  transcript text,
  language_detected text,
  ai_result jsonb,
  status voice_log_status not null default 'processing',
  error text,
  created_at timestamptz not null default now()
);
create index voice_logs_client_idx on voice_logs (client_id);

create table document_events (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references work_orders(id) on delete cascade,
  event document_event not null,
  meta jsonb not null default '{}'::jsonb,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index document_events_wo_idx on document_events (work_order_id);

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  keys jsonb not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create table app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------- Row Level Security ----------
-- The app is single-tenant: the engineer signs in with Supabase Auth.
-- Server code talks to Postgres through DATABASE_URL (bypasses RLS) and
-- gates every request through the auth middleware. RLS below protects the
-- tables from the public PostgREST API (anon key) and allows the authenticated
-- engineer full access when the Supabase client is used directly.
do $$
declare t text;
begin
  foreach t in array array['clients','client_vault','services','retainers','work_orders','work_order_items','retainer_usage','calendar_events','interaction_logs','voice_logs','document_events','push_subscriptions','app_settings']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "%s_authenticated_all" on %I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- The vault must never be readable through the public API, even for authenticated sessions:
-- decryption happens only in server code. Revoke the authenticated policy on it.
drop policy "client_vault_authenticated_all" on client_vault;

-- ---------- Storage buckets ----------
insert into storage.buckets (id, name, public) values
  ('audio', 'audio', false),
  ('documents', 'documents', false),
  ('signatures', 'signatures', false)
on conflict (id) do nothing;

create policy "authenticated manage audio" on storage.objects for all to authenticated using (bucket_id = 'audio') with check (bucket_id = 'audio');
create policy "authenticated manage documents" on storage.objects for all to authenticated using (bucket_id = 'documents') with check (bucket_id = 'documents');
create policy "authenticated manage signatures" on storage.objects for all to authenticated using (bucket_id = 'signatures') with check (bucket_id = 'signatures');

-- ---------- Work order numbering ----------
create sequence work_order_seq start 1;
create or replace function next_work_order_number() returns text language sql as $$
  select 'WO-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('work_order_seq')::text, 4, '0');
$$;
