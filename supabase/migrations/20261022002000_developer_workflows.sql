create table public.developer_tasks (
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

create index developer_tasks_org_due_idx on public.developer_tasks (organization_id, due_at, status);
create index developer_tasks_org_assignee_idx on public.developer_tasks (organization_id, assigned_to, status);

create table public.developer_site_visits (
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

create index developer_site_visits_org_schedule_idx
  on public.developer_site_visits (organization_id, scheduled_at, status);

create table public.developer_knowledge_articles (
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

create index developer_knowledge_articles_org_status_idx
  on public.developer_knowledge_articles (organization_id, status, updated_at desc);

create table public.developer_campaigns (
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

create index developer_campaigns_org_status_idx
  on public.developer_campaigns (organization_id, status, starts_on);

create table public.developer_support_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.developer_organizations (id) on delete cascade,
  requested_by uuid not null default auth.uid() references auth.users (id),
  subject text not null check (length(trim(subject)) between 1 and 180),
  message text not null check (length(trim(message)) between 1 and 10000),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index developer_support_requests_org_created_idx
  on public.developer_support_requests (organization_id, created_at desc);

create table public.developer_notifications (
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

create index developer_notifications_recipient_unread_idx
  on public.developer_notifications (recipient_user_id, created_at desc)
  where read_at is null;

alter table public.developer_tasks enable row level security;
alter table public.developer_site_visits enable row level security;
alter table public.developer_knowledge_articles enable row level security;
alter table public.developer_campaigns enable row level security;
alter table public.developer_support_requests enable row level security;
alter table public.developer_notifications enable row level security;

revoke all on table public.developer_tasks, public.developer_site_visits,
  public.developer_knowledge_articles, public.developer_campaigns,
  public.developer_support_requests, public.developer_notifications
  from public, anon, authenticated;

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
revoke update on table public.developer_tasks, public.developer_site_visits,
  public.developer_knowledge_articles, public.developer_campaigns,
  public.developer_support_requests from authenticated;
grant update (project_id, lead_id, assigned_to, title, description, due_at, status)
  on table public.developer_tasks to authenticated;
grant update (project_id, lead_id, assigned_to, scheduled_at, duration_minutes, status, notes)
  on table public.developer_site_visits to authenticated;
grant update (title, category, content, status)
  on table public.developer_knowledge_articles to authenticated;
grant update (project_id, name, channel, status, planned_budget, starts_on, ends_on)
  on table public.developer_campaigns to authenticated;
grant update (status)
  on table public.developer_support_requests to authenticated;

create function public.touch_developer_workflow_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.touch_developer_workflow_updated_at() from public, anon, authenticated;
create trigger developer_tasks_touch_updated_at
  before update on public.developer_tasks
  for each row execute function public.touch_developer_workflow_updated_at();
create trigger developer_site_visits_touch_updated_at
  before update on public.developer_site_visits
  for each row execute function public.touch_developer_workflow_updated_at();
create trigger developer_knowledge_articles_touch_updated_at
  before update on public.developer_knowledge_articles
  for each row execute function public.touch_developer_workflow_updated_at();
create trigger developer_campaigns_touch_updated_at
  before update on public.developer_campaigns
  for each row execute function public.touch_developer_workflow_updated_at();
create trigger developer_support_requests_touch_updated_at
  before update on public.developer_support_requests
  for each row execute function public.touch_developer_workflow_updated_at();

create policy "Active members can read organization tasks"
  on public.developer_tasks for select to authenticated
  using (exists (
    select 1 from public.developer_organization_memberships m
    where m.organization_id = developer_tasks.organization_id
      and m.user_id = (select auth.uid()) and m.is_active
  ));
create policy "Authorized members can create organization tasks"
  on public.developer_tasks for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.developer_organization_memberships m
      where m.organization_id = developer_tasks.organization_id
        and m.user_id = (select auth.uid()) and m.is_active
        and m.role in ('owner', 'admin', 'sales')
    )
    and (assigned_to is null or public.is_active_developer_org_member(organization_id, assigned_to))
  );
create policy "Assigned sales and admins can update organization tasks"
  on public.developer_tasks for update to authenticated
  using (exists (
    select 1 from public.developer_organization_memberships m
    where m.organization_id = developer_tasks.organization_id
      and m.user_id = (select auth.uid()) and m.is_active
      and (m.role in ('owner', 'admin') or
        (m.role = 'sales' and developer_tasks.assigned_to = (select auth.uid())))
  ))
  with check (
    exists (
      select 1 from public.developer_organization_memberships m
      where m.organization_id = developer_tasks.organization_id
        and m.user_id = (select auth.uid()) and m.is_active
        and (m.role in ('owner', 'admin') or
          (m.role = 'sales' and assigned_to = (select auth.uid())))
    )
    and (assigned_to is null or public.is_active_developer_org_member(organization_id, assigned_to))
  );
create policy "Organization owners can delete tasks"
  on public.developer_tasks for delete to authenticated
  using (exists (
    select 1 from public.developer_organization_memberships m
    where m.organization_id = developer_tasks.organization_id
      and m.user_id = (select auth.uid()) and m.is_active and m.role = 'owner'
  ));

create policy "Active members can read organization site visits"
  on public.developer_site_visits for select to authenticated
  using (exists (
    select 1 from public.developer_organization_memberships m
    where m.organization_id = developer_site_visits.organization_id
      and m.user_id = (select auth.uid()) and m.is_active
  ));
create policy "Sales and admins can create organization site visits"
  on public.developer_site_visits for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.developer_organization_memberships m
      where m.organization_id = developer_site_visits.organization_id
        and m.user_id = (select auth.uid()) and m.is_active
        and m.role in ('owner', 'admin', 'sales')
    )
    and (assigned_to is null or public.is_active_developer_org_member(organization_id, assigned_to))
  );
create policy "Assigned sales and admins can update organization site visits"
  on public.developer_site_visits for update to authenticated
  using (exists (
    select 1 from public.developer_organization_memberships m
    where m.organization_id = developer_site_visits.organization_id
      and m.user_id = (select auth.uid()) and m.is_active
      and (m.role in ('owner', 'admin') or
        (m.role = 'sales' and developer_site_visits.assigned_to = (select auth.uid())))
  ))
  with check (
    exists (
      select 1 from public.developer_organization_memberships m
      where m.organization_id = developer_site_visits.organization_id
        and m.user_id = (select auth.uid()) and m.is_active
        and (m.role in ('owner', 'admin') or
          (m.role = 'sales' and assigned_to = (select auth.uid())))
    )
    and (assigned_to is null or public.is_active_developer_org_member(organization_id, assigned_to))
  );
create policy "Organization owners can delete site visits"
  on public.developer_site_visits for delete to authenticated
  using (exists (
    select 1 from public.developer_organization_memberships m
    where m.organization_id = developer_site_visits.organization_id
      and m.user_id = (select auth.uid()) and m.is_active and m.role = 'owner'
  ));

create policy "Active members can read organization knowledge articles"
  on public.developer_knowledge_articles for select to authenticated
  using (exists (
    select 1 from public.developer_organization_memberships m
    where m.organization_id = developer_knowledge_articles.organization_id
      and m.user_id = (select auth.uid()) and m.is_active
  ));
create policy "Authorized members can create knowledge articles"
  on public.developer_knowledge_articles for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.developer_organization_memberships m
      where m.organization_id = developer_knowledge_articles.organization_id
        and m.user_id = (select auth.uid()) and m.is_active
        and m.role in ('owner', 'admin', 'marketing')
    )
  );
create policy "Authorized members can update knowledge articles"
  on public.developer_knowledge_articles for update to authenticated
  using (exists (
    select 1 from public.developer_organization_memberships m
    where m.organization_id = developer_knowledge_articles.organization_id
      and m.user_id = (select auth.uid()) and m.is_active
      and m.role in ('owner', 'admin', 'marketing')
  ))
  with check (exists (
    select 1 from public.developer_organization_memberships m
    where m.organization_id = developer_knowledge_articles.organization_id
      and m.user_id = (select auth.uid()) and m.is_active
      and m.role in ('owner', 'admin', 'marketing')
  ));
create policy "Organization admins can delete knowledge articles"
  on public.developer_knowledge_articles for delete to authenticated
  using (exists (
    select 1 from public.developer_organization_memberships m
    where m.organization_id = developer_knowledge_articles.organization_id
      and m.user_id = (select auth.uid()) and m.is_active and m.role in ('owner', 'admin')
  ));

create policy "Active members can read organization campaigns"
  on public.developer_campaigns for select to authenticated
  using (exists (
    select 1 from public.developer_organization_memberships m
    where m.organization_id = developer_campaigns.organization_id
      and m.user_id = (select auth.uid()) and m.is_active
  ));
create policy "Owners admins and marketing can create campaigns"
  on public.developer_campaigns for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.developer_organization_memberships m
      where m.organization_id = developer_campaigns.organization_id
        and m.user_id = (select auth.uid()) and m.is_active
        and m.role in ('owner', 'admin', 'marketing')
    )
  );
create policy "Owners admins and marketing can update campaigns"
  on public.developer_campaigns for update to authenticated
  using (exists (
    select 1 from public.developer_organization_memberships m
    where m.organization_id = developer_campaigns.organization_id
      and m.user_id = (select auth.uid()) and m.is_active
      and m.role in ('owner', 'admin', 'marketing')
  ))
  with check (exists (
    select 1 from public.developer_organization_memberships m
    where m.organization_id = developer_campaigns.organization_id
      and m.user_id = (select auth.uid()) and m.is_active
      and m.role in ('owner', 'admin', 'marketing')
  ));
create policy "Organization owners can delete campaigns"
  on public.developer_campaigns for delete to authenticated
  using (exists (
    select 1 from public.developer_organization_memberships m
    where m.organization_id = developer_campaigns.organization_id
      and m.user_id = (select auth.uid()) and m.is_active and m.role = 'owner'
  ));

create policy "Users can read their own support requests"
  on public.developer_support_requests for select to authenticated
  using (
    requested_by = (select auth.uid())
    and exists (
      select 1 from public.developer_organization_memberships m
      where m.organization_id = developer_support_requests.organization_id
        and m.user_id = (select auth.uid()) and m.is_active
    )
  );
create policy "Organization admins can read all support requests"
  on public.developer_support_requests for select to authenticated
  using (exists (
    select 1 from public.developer_organization_memberships m
    where m.organization_id = developer_support_requests.organization_id
      and m.user_id = (select auth.uid()) and m.is_active and m.role in ('owner', 'admin')
  ));
create policy "Active members can create support requests"
  on public.developer_support_requests for insert to authenticated
  with check (
    requested_by = (select auth.uid())
    and exists (
      select 1 from public.developer_organization_memberships m
      where m.organization_id = developer_support_requests.organization_id
        and m.user_id = (select auth.uid()) and m.is_active
    )
  );
create policy "Organization admins can update support requests"
  on public.developer_support_requests for update to authenticated
  using (exists (
    select 1 from public.developer_organization_memberships m
    where m.organization_id = developer_support_requests.organization_id
      and m.user_id = (select auth.uid()) and m.is_active and m.role in ('owner', 'admin')
  ))
  with check (exists (
    select 1 from public.developer_organization_memberships m
    where m.organization_id = developer_support_requests.organization_id
      and m.user_id = (select auth.uid()) and m.is_active and m.role in ('owner', 'admin')
  ));

create policy "Recipients can read their organization notifications"
  on public.developer_notifications for select to authenticated
  using (
    recipient_user_id = (select auth.uid())
    and exists (
      select 1 from public.developer_organization_memberships m
      where m.organization_id = developer_notifications.organization_id
        and m.user_id = (select auth.uid()) and m.is_active
    )
  );
create policy "Recipients can mark their notifications read"
  on public.developer_notifications for update to authenticated
  using (
    recipient_user_id = (select auth.uid())
    and exists (
      select 1 from public.developer_organization_memberships m
      where m.organization_id = developer_notifications.organization_id
        and m.user_id = (select auth.uid()) and m.is_active
    )
  )
  with check (
    recipient_user_id = (select auth.uid())
    and exists (
      select 1 from public.developer_organization_memberships m
      where m.organization_id = developer_notifications.organization_id
        and m.user_id = (select auth.uid()) and m.is_active
    )
  );

create or replace function public.notify_developer_task_assignee()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.assigned_to is not null
    and (tg_op = 'INSERT' or old.assigned_to is distinct from new.assigned_to) then
    insert into public.developer_notifications (
      organization_id, recipient_user_id, kind, title, body, entity_type, entity_id
    )
    values (
      new.organization_id, new.assigned_to, 'task_assigned', 'Task assigned',
      new.title, 'task', new.id
    );
  end if;
  return new;
end;
$$;
revoke all on function public.notify_developer_task_assignee() from public, anon, authenticated;

create trigger developer_task_assignee_notification
  after insert or update of assigned_to on public.developer_tasks
  for each row execute function public.notify_developer_task_assignee();
