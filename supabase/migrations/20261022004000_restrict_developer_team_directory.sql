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
        and actor.role in ('owner', 'admin')
    )
  order by member.is_active desc, lower(coalesce(nullif(trim(profile.full_name), ''), ''));
$$;

revoke all on function public.list_developer_org_team(uuid) from public, anon, authenticated;
grant execute on function public.list_developer_org_team(uuid) to authenticated;
