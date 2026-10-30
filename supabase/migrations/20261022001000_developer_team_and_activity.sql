create table public.developer_activity_events (
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

create index developer_activity_events_organization_created_idx
  on public.developer_activity_events (organization_id, created_at desc);

alter table public.developer_activity_events enable row level security;
revoke all on table public.developer_activity_events from public, anon, authenticated;
grant select on table public.developer_activity_events to authenticated;

create policy "Active organization members can read activity events"
  on public.developer_activity_events for select to authenticated
  using (
    exists (
      select 1
      from public.developer_organization_memberships membership
      where membership.organization_id = developer_activity_events.organization_id
        and membership.user_id = (select auth.uid())
        and membership.is_active
    )
  );

create or replace function public.list_developer_org_team(p_organization_id uuid)
returns table (
  user_id uuid,
  role text,
  is_active boolean,
  full_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    member.user_id,
    member.role,
    member.is_active,
    coalesce(nullif(trim(profile.full_name), ''), 'Organization member')
  from public.developer_organization_memberships member
  left join public.profiles profile on profile.id = member.user_id
  where member.organization_id = p_organization_id
    and exists (
      select 1
      from public.developer_organization_memberships actor
      where actor.organization_id = p_organization_id
        and actor.user_id = (select auth.uid())
        and actor.is_active
    )
  order by member.is_active desc, lower(coalesce(nullif(trim(profile.full_name), ''), ''));
$$;
revoke all on function public.list_developer_org_team(uuid) from public, anon;
grant execute on function public.list_developer_org_team(uuid) to authenticated;

create or replace function public.record_developer_activity_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_organization_id uuid;
  v_entity_id uuid;
begin
  if tg_op = 'DELETE' then
    v_organization_id := old.organization_id;
    v_entity_id := old.id;
  else
    v_organization_id := new.organization_id;
    v_entity_id := new.id;
  end if;

  insert into public.developer_activity_events (
    organization_id,
    actor_user_id,
    entity_type,
    entity_id,
    action
  )
  values (
    v_organization_id,
    (select auth.uid()),
    tg_argv[0],
    v_entity_id,
    lower(tg_op)
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;
revoke all on function public.record_developer_activity_event() from public, anon, authenticated;

drop trigger if exists developer_projects_activity_event on public.developer_projects;
create trigger developer_projects_activity_event
  after insert or update or delete on public.developer_projects
  for each row execute function public.record_developer_activity_event('project');

drop trigger if exists developer_project_units_activity_event on public.developer_project_units;
create trigger developer_project_units_activity_event
  after insert or update or delete on public.developer_project_units
  for each row execute function public.record_developer_activity_event('inventory_unit');

drop trigger if exists developer_leads_activity_event on public.developer_leads;
create trigger developer_leads_activity_event
  after insert or update or delete on public.developer_leads
  for each row execute function public.record_developer_activity_event('lead');
