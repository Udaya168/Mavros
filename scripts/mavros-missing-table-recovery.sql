-- Mavros missing-table recovery
-- Target project: mcvgqhnsrqrejmyhsebg
--
-- Review manually before execution. This script is intentionally limited to
-- the eight tables confirmed missing from the public table listing. It does
-- not replace existing functions, triggers, policies, grants, or tables.
-- It does not provision users or memberships.
--
-- Remaining security work is intentionally blocked until exact catalog rows
-- for policies, functions, triggers, and privileges are verified.

begin;

do $preflight$
declare
  object_name text;
begin
  if to_regclass('public.developer_organizations') is null
     or to_regclass('public.developer_organization_memberships') is null
     or to_regclass('public.developer_projects') is null
     or to_regclass('public.developer_project_towers') is null
     or to_regclass('public.developer_project_units') is null
     or to_regclass('public.developer_leads') is null then
    raise exception
      'Required core developer tables are missing; aborting without changes.';
  end if;

end;
$preflight$;

create table if not exists public.developer_activity_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.developer_organizations (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  entity_type text not null
    check (entity_type in ('project', 'inventory_unit', 'lead')),
  entity_id uuid not null,
  action text not null check (action in ('insert', 'update', 'delete')),
  created_at timestamptz not null default now()
);

create table if not exists public.developer_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.developer_organizations (id) on delete cascade,
  project_id uuid,
  lead_id uuid,
  assigned_to uuid references auth.users (id) on delete set null,
  created_by uuid not null default auth.uid() references auth.users (id),
  title text not null check (length(trim(title)) between 1 and 180),
  description text not null default '' check (length(description) <= 5000),
  due_at timestamptz,
  status text not null default 'open' check (status in ('open', 'in_progress', 'done', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint developer_tasks_project_fk foreign key (organization_id, project_id)
    references public.developer_projects (organization_id, id) on delete set null (project_id),
  constraint developer_tasks_lead_fk foreign key (organization_id, lead_id)
    references public.developer_leads (organization_id, id) on delete set null (lead_id)
);

create table if not exists public.developer_site_visits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.developer_organizations (id) on delete cascade,
  project_id uuid not null,
  lead_id uuid,
  assigned_to uuid references auth.users (id) on delete set null,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 60 check (duration_minutes between 15 and 480),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes text not null default '' check (length(notes) <= 5000),
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint developer_site_visits_project_fk foreign key (organization_id, project_id)
    references public.developer_projects (organization_id, id) on delete cascade,
  constraint developer_site_visits_lead_fk foreign key (organization_id, lead_id)
    references public.developer_leads (organization_id, id) on delete set null (lead_id)
);

create table if not exists public.developer_knowledge_articles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.developer_organizations (id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 200),
  category text not null default 'general' check (length(trim(category)) between 1 and 80),
  content text not null check (length(trim(content)) between 1 and 50000),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.developer_campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.developer_organizations (id) on delete cascade,
  project_id uuid,
  name text not null check (length(trim(name)) between 1 and 180),
  channel text not null check (length(trim(channel)) between 1 and 80),
  status text not null default 'planned'
    check (status in ('planned', 'active', 'paused', 'completed')),
  planned_budget numeric(14, 2) check (planned_budget is null or planned_budget >= 0),
  starts_on date,
  ends_on date,
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint developer_campaigns_date_range_check
    check (starts_on is null or ends_on is null or starts_on <= ends_on),
  constraint developer_campaigns_project_fk foreign key (organization_id, project_id)
    references public.developer_projects (organization_id, id) on delete set null (project_id)
);

create table if not exists public.developer_support_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.developer_organizations (id) on delete cascade,
  requested_by uuid not null default auth.uid() references auth.users (id),
  subject text not null check (length(trim(subject)) between 1 and 180),
  message text not null check (length(trim(message)) between 1 and 10000),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.developer_notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.developer_organizations (id) on delete cascade,
  recipient_user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('task_assigned')),
  title text not null check (length(title) between 1 and 180),
  body text not null default '' check (length(body) <= 1000),
  entity_type text not null check (entity_type in ('task')),
  entity_id uuid not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.developer_team_membership_audit (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.developer_organizations (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  target_user_id uuid not null references auth.users (id) on delete cascade,
  previous_role text not null
    check (previous_role in ('owner', 'admin', 'marketing', 'sales', 'analyst')),
  new_role text not null
    check (new_role in ('owner', 'admin', 'marketing', 'sales', 'analyst')),
  was_active boolean not null,
  is_active boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists developer_activity_events_organization_created_idx
  on public.developer_activity_events (organization_id, created_at desc);
create index if not exists developer_tasks_org_due_idx
  on public.developer_tasks (organization_id, due_at, status);
create index if not exists developer_tasks_org_assignee_idx
  on public.developer_tasks (organization_id, assigned_to, status);
create index if not exists developer_site_visits_org_schedule_idx
  on public.developer_site_visits (organization_id, scheduled_at, status);
create index if not exists developer_knowledge_articles_org_status_idx
  on public.developer_knowledge_articles (organization_id, status, updated_at desc);
create index if not exists developer_campaigns_org_status_idx
  on public.developer_campaigns (organization_id, status, starts_on);
create index if not exists developer_support_requests_org_created_idx
  on public.developer_support_requests (organization_id, created_at desc);
create index if not exists developer_notifications_recipient_unread_idx
  on public.developer_notifications (recipient_user_id, created_at desc)
  where read_at is null;
create index if not exists developer_team_membership_audit_org_created_idx
  on public.developer_team_membership_audit (organization_id, created_at desc);

alter table public.developer_activity_events enable row level security;
alter table public.developer_tasks enable row level security;
alter table public.developer_site_visits enable row level security;
alter table public.developer_knowledge_articles enable row level security;
alter table public.developer_campaigns enable row level security;
alter table public.developer_support_requests enable row level security;
alter table public.developer_notifications enable row level security;
alter table public.developer_team_membership_audit enable row level security;

revoke all on table public.developer_activity_events,
  public.developer_tasks,
  public.developer_site_visits,
  public.developer_knowledge_articles,
  public.developer_campaigns,
  public.developer_support_requests,
  public.developer_notifications,
  public.developer_team_membership_audit
  from public, anon, authenticated;

grant select on table public.developer_activity_events to authenticated;
grant select, update, delete on table public.developer_tasks to authenticated;
grant insert (organization_id, project_id, lead_id, assigned_to, title, description, due_at, status)
  on table public.developer_tasks to authenticated;
grant select, update, delete on table public.developer_site_visits to authenticated;
grant insert (organization_id, project_id, lead_id, assigned_to, scheduled_at, duration_minutes, status, notes)
  on table public.developer_site_visits to authenticated;
grant select, update, delete on table public.developer_knowledge_articles to authenticated;
grant insert (organization_id, title, category, content, status)
  on table public.developer_knowledge_articles to authenticated;
grant select, update, delete on table public.developer_campaigns to authenticated;
grant insert (organization_id, project_id, name, channel, status, planned_budget, starts_on, ends_on)
  on table public.developer_campaigns to authenticated;
grant select, update on table public.developer_support_requests to authenticated;
grant insert (organization_id, subject, message)
  on table public.developer_support_requests to authenticated;
grant select on table public.developer_notifications to authenticated;
grant update (read_at) on table public.developer_notifications to authenticated;
grant select on table public.developer_team_membership_audit to authenticated;

commit;

-- Intentionally not included: RLS policy creation, workflow timestamp
-- functions/triggers, activity triggers, task notification trigger, Team RPCs,
-- and membership-management RPC. Verify their exact remote state first and
-- add only missing definitions in a separately reviewed follow-up.
