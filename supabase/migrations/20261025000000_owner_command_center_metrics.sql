-- Owner-only aggregate metrics for the Mavros Command Center.
--
-- This function is SECURITY DEFINER because the existing staff-owner RLS policy
-- permits a caller to read only their own staff membership, while this RPC
-- intentionally reads aggregate counts across all developer organizations.
-- Authorization is re-established inside the function from auth.uid(); no
-- caller-supplied identity, role, or organization identifier is accepted.

create function public.get_mavros_command_center_metrics()
returns table (
  organization_count bigint,
  active_membership_count bigint,
  project_count bigint,
  published_project_count bigint,
  inventory_unit_count bigint,
  available_inventory_unit_count bigint,
  lead_count bigint
)
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not exists (
    select 1
    from public.mavros_staff_memberships membership
    where membership.user_id = (select auth.uid())
      and membership.user_id = 'f2c67a31-2b22-4ba9-86bd-91e9977b4955'::uuid
      and membership.role = 'owner'
      and membership.is_active
  ) then
    raise exception 'Mavros Command Center owner authorization required'
      using errcode = '42501';
  end if;

  return query
  select
    (select count(*) from public.developer_organizations),
    (
      select count(*)
      from public.developer_organization_memberships
      where is_active
    ),
    (select count(*) from public.developer_projects),
    (
      select count(*)
      from public.developer_projects
      where status = 'published'
    ),
    (select count(*) from public.developer_project_units),
    (
      select count(*)
      from public.developer_project_units
      where status = 'available'
    ),
    (select count(*) from public.developer_leads);
end;
$function$;

revoke all on function public.get_mavros_command_center_metrics() from public, anon, authenticated;
grant execute on function public.get_mavros_command_center_metrics() to authenticated;
