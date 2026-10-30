create table public.developer_team_membership_audit (
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

create index developer_team_membership_audit_org_created_idx
  on public.developer_team_membership_audit (organization_id, created_at desc);

alter table public.developer_team_membership_audit enable row level security;
revoke all on table public.developer_team_membership_audit from public, anon, authenticated;
grant select on table public.developer_team_membership_audit to authenticated;

create policy "Organization admins can read membership audit"
  on public.developer_team_membership_audit for select to authenticated
  using (
    exists (
      select 1 from public.developer_organization_memberships membership
      where membership.organization_id = developer_team_membership_audit.organization_id
        and membership.user_id = (select auth.uid())
        and membership.is_active
        and membership.role in ('owner', 'admin')
    )
  );

create function public.manage_developer_org_member(
  p_organization_id uuid,
  p_target_user_id uuid,
  p_role text,
  p_is_active boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_actor_role text;
  v_previous_role text;
  v_was_active boolean;
  v_active_owner_count integer;
  v_organization_id uuid;
begin
  if v_actor_id is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  if p_role is null
    or p_role not in ('owner', 'admin', 'marketing', 'sales', 'analyst')
    or p_is_active is null then
    raise exception 'Invalid membership role or status.'
      using errcode = '22023';
  end if;

  select organization.id into v_organization_id
  from public.developer_organizations organization
  where organization.id = p_organization_id
  for update;

  if not found then
    raise exception 'Organization was not found.'
      using errcode = 'P0002';
  end if;

  select membership.role into v_actor_role
  from public.developer_organization_memberships membership
  where membership.organization_id = p_organization_id
    and membership.user_id = v_actor_id
    and membership.is_active
  for update;

  if v_actor_role not in ('owner', 'admin') or v_actor_role is null then
    raise exception 'An active organization owner or admin is required.'
      using errcode = '42501';
  end if;

  if p_target_user_id = v_actor_id then
    raise exception 'You cannot change your own organization membership.'
      using errcode = '42501';
  end if;

  select membership.role, membership.is_active
    into v_previous_role, v_was_active
  from public.developer_organization_memberships membership
  where membership.organization_id = p_organization_id
    and membership.user_id = p_target_user_id
  for update;

  if not found then
    raise exception 'Organization member was not found.'
      using errcode = 'P0002';
  end if;

  if v_actor_role = 'admin'
    and (v_previous_role = 'owner' or p_role = 'owner') then
    raise exception 'Only an organization owner can manage owner memberships.'
      using errcode = '42501';
  end if;

  if v_previous_role = 'owner'
    and v_was_active
    and (p_role <> 'owner' or not p_is_active) then
    select count(*) into v_active_owner_count
    from public.developer_organization_memberships membership
    where membership.organization_id = p_organization_id
      and membership.role = 'owner'
      and membership.is_active;

    if v_active_owner_count <= 1 then
      raise exception 'The last active organization owner cannot be deactivated.'
        using errcode = '23514';
    end if;
  end if;

  if v_previous_role = p_role and v_was_active = p_is_active then
    return;
  end if;

  update public.developer_organization_memberships
  set role = p_role, is_active = p_is_active
  where organization_id = p_organization_id
    and user_id = p_target_user_id;

  insert into public.developer_team_membership_audit (
    organization_id, actor_user_id, target_user_id,
    previous_role, new_role, was_active, is_active
  )
  values (
    p_organization_id, v_actor_id, p_target_user_id,
    v_previous_role, p_role, v_was_active, p_is_active
  );
end;
$$;

revoke all on function public.manage_developer_org_member(uuid, uuid, text, boolean)
  from public, anon;
grant execute on function public.manage_developer_org_member(uuid, uuid, text, boolean)
  to authenticated;
