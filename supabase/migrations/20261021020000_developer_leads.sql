create table public.developer_leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.developer_organizations (id) on delete cascade,
  project_id uuid,
  assigned_to uuid references auth.users (id) on delete set null,
  full_name text not null check (length(trim(full_name)) between 1 and 160),
  email text check (
    email is null
    or (
      length(email) <= 320
      and email = lower(email)
      and email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    )
  ),
  phone text check (phone is null or phone ~ '^\+?[0-9]{7,15}$'),
  source text not null default 'other'
    check (source in ('website', 'phone', 'referral', 'campaign', 'walk_in', 'other')),
  status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'site_visit', 'negotiation', 'won', 'lost')),
  budget_min numeric(14, 2) check (budget_min is null or budget_min >= 0),
  budget_max numeric(14, 2) check (budget_max is null or budget_max >= 0),
  preferred_configuration text check (
    preferred_configuration is null or length(preferred_configuration) <= 120
  ),
  notes text check (notes is null or length(notes) <= 10000),
  next_follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint developer_leads_budget_range_check
    check (budget_min is null or budget_max is null or budget_min <= budget_max),
  constraint developer_leads_organization_id_id_unique
    unique (organization_id, id),
  constraint developer_leads_project_organization_fk
    foreign key (organization_id, project_id)
    references public.developer_projects (organization_id, id) on delete set null (project_id)
);

create index developer_leads_organization_status_created_idx
  on public.developer_leads (organization_id, status, created_at desc);
create index developer_leads_organization_follow_up_idx
  on public.developer_leads (organization_id, next_follow_up_at)
  where next_follow_up_at is not null;
create index developer_leads_organization_project_idx
  on public.developer_leads (organization_id, project_id);
create index developer_leads_organization_assignee_idx
  on public.developer_leads (organization_id, assigned_to);
create index developer_leads_organization_email_idx
  on public.developer_leads (organization_id, lower(email))
  where email is not null;
create index developer_leads_organization_phone_idx
  on public.developer_leads (organization_id, phone)
  where phone is not null;

alter table public.developer_leads enable row level security;
revoke all on table public.developer_leads from public, anon, authenticated;
grant select, delete on table public.developer_leads to authenticated;
grant insert (
  organization_id,
  project_id,
  assigned_to,
  full_name,
  email,
  phone,
  source,
  status,
  budget_min,
  budget_max,
  preferred_configuration,
  notes,
  next_follow_up_at
) on table public.developer_leads to authenticated;
grant update (
  project_id,
  assigned_to,
  full_name,
  email,
  phone,
  source,
  status,
  budget_min,
  budget_max,
  preferred_configuration,
  notes,
  next_follow_up_at
) on table public.developer_leads to authenticated;

create function public.is_active_developer_org_member(
  p_organization_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.developer_organization_memberships actor
    join public.developer_organization_memberships target
      on target.organization_id = actor.organization_id
    where actor.organization_id = p_organization_id
      and actor.user_id = (select auth.uid())
      and actor.is_active
      and target.user_id = p_user_id
      and target.is_active
  );
$$;
revoke all on function public.is_active_developer_org_member(uuid, uuid) from public, anon;
grant execute on function public.is_active_developer_org_member(uuid, uuid) to authenticated;

create function public.list_developer_org_lead_assignees(p_organization_id uuid)
returns table (user_id uuid, full_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select membership.user_id, coalesce(nullif(trim(profile.full_name), ''), 'Organization member')
  from public.developer_organization_memberships membership
  left join public.profiles profile on profile.id = membership.user_id
  where membership.organization_id = p_organization_id
    and membership.is_active
    and exists (
      select 1
      from public.developer_organization_memberships actor
      where actor.organization_id = p_organization_id
        and actor.user_id = (select auth.uid())
        and actor.is_active
    )
  order by lower(coalesce(nullif(trim(profile.full_name), ''), 'Organization member'));
$$;
revoke all on function public.list_developer_org_lead_assignees(uuid) from public, anon;
grant execute on function public.list_developer_org_lead_assignees(uuid) to authenticated;

create policy "Active organization members can read developer leads"
  on public.developer_leads for select to authenticated
  using (
    exists (
      select 1 from public.developer_organization_memberships membership
      where membership.organization_id = developer_leads.organization_id
        and membership.user_id = (select auth.uid())
        and membership.is_active
    )
  );

create policy "Sales and organization admins can create developer leads"
  on public.developer_leads for insert to authenticated
  with check (
    exists (
      select 1 from public.developer_organization_memberships membership
      where membership.organization_id = developer_leads.organization_id
        and membership.user_id = (select auth.uid())
        and membership.is_active
        and membership.role in ('owner', 'admin', 'sales')
        and (
          membership.role in ('owner', 'admin')
          or assigned_to is null
          or assigned_to = (select auth.uid())
        )
    )
    and (
      assigned_to is null
      or public.is_active_developer_org_member(organization_id, assigned_to)
    )
  );

create policy "Assigned sales and organization admins can update developer leads"
  on public.developer_leads for update to authenticated
  using (
    exists (
      select 1 from public.developer_organization_memberships membership
      where membership.organization_id = developer_leads.organization_id
        and membership.user_id = (select auth.uid())
        and membership.is_active
        and (
          membership.role in ('owner', 'admin')
          or (membership.role = 'sales' and developer_leads.assigned_to = (select auth.uid()))
        )
    )
  )
  with check (
    exists (
      select 1 from public.developer_organization_memberships membership
      where membership.organization_id = developer_leads.organization_id
        and membership.user_id = (select auth.uid())
        and membership.is_active
        and (
          membership.role in ('owner', 'admin')
          or (
            membership.role = 'sales'
            and assigned_to = (select auth.uid())
          )
        )
    )
    and (
      assigned_to is null
      or public.is_active_developer_org_member(organization_id, assigned_to)
    )
  );

create policy "Only organization owners can delete developer leads"
  on public.developer_leads for delete to authenticated
  using (
    exists (
      select 1 from public.developer_organization_memberships membership
      where membership.organization_id = developer_leads.organization_id
        and membership.user_id = (select auth.uid())
        and membership.is_active
        and membership.role = 'owner'
    )
  );

create function public.touch_developer_lead_updated_at()
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
revoke all on function public.touch_developer_lead_updated_at() from public, anon, authenticated;

create trigger developer_leads_touch_updated_at
  before update on public.developer_leads
  for each row execute function public.touch_developer_lead_updated_at();
