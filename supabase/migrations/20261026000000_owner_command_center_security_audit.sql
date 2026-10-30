-- Owner-only security and operational audit events for the Mavros Command Center.
--
-- The source tables are protected by organization-scoped RLS policies, so the
-- owner Command Center uses this narrowly shaped SECURITY DEFINER RPC rather
-- than bypassing RLS from application code. The function returns no credentials,
-- tokens, user emails, entity IDs, or tenant IDs. It returns a display name only
-- when the existing profile row contains one.

create function public.list_mavros_command_center_security_audit(
  p_category text default null,
  p_limit integer default 50
)
returns table (
  event_id uuid,
  category text,
  organization_name text,
  actor_name text,
  entity_type text,
  action text,
  details text,
  occurred_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if (select auth.uid()) is distinct from 'f2c67a31-2b22-4ba9-86bd-91e9977b4955'::uuid
    or not exists (
      select 1
      from public.mavros_staff_memberships membership
      where membership.user_id = (select auth.uid())
        and membership.role = 'owner'
        and membership.is_active
    ) then
    raise exception 'Mavros Command Center owner authorization required'
      using errcode = '42501';
  end if;

  if p_category is not null
    and p_category not in ('activity', 'membership') then
    raise exception 'Unsupported audit category.'
      using errcode = '22023';
  end if;

  if p_limit is null or p_limit < 1 or p_limit > 100 then
    raise exception 'Audit limit must be between 1 and 100.'
      using errcode = '22023';
  end if;

  return query
  with audit_events as (
    select
      activity.id as event_id,
      'activity'::text as category,
      organization.name as organization_name,
      coalesce(nullif(trim(profile.full_name), ''), 'Authenticated user') as actor_name,
      activity.entity_type,
      activity.action,
      initcap(activity.action) || ' ' ||
        replace(activity.entity_type, '_', ' ') as details,
      activity.created_at as occurred_at
    from public.developer_activity_events activity
    join public.developer_organizations organization
      on organization.id = activity.organization_id
    left join public.profiles profile
      on profile.id = activity.actor_user_id
    where p_category is null or p_category = 'activity'

    union all

    select
      membership_audit.id as event_id,
      'membership'::text as category,
      organization.name as organization_name,
      coalesce(nullif(trim(profile.full_name), ''), 'Authenticated user') as actor_name,
      'organization_membership'::text as entity_type,
      'update'::text as action,
      'Role changed from ' || membership_audit.previous_role || ' to ' ||
        membership_audit.new_role ||
        '; active changed from ' || membership_audit.was_active::text || ' to ' ||
        membership_audit.is_active::text as details,
      membership_audit.created_at as occurred_at
    from public.developer_team_membership_audit membership_audit
    join public.developer_organizations organization
      on organization.id = membership_audit.organization_id
    left join public.profiles profile
      on profile.id = membership_audit.actor_user_id
    where p_category is null or p_category = 'membership'
  )
  select
    audit_events.event_id,
    audit_events.category,
    audit_events.organization_name,
    audit_events.actor_name,
    audit_events.entity_type,
    audit_events.action,
    audit_events.details,
    audit_events.occurred_at
  from audit_events
  order by audit_events.occurred_at desc
  limit p_limit;
end;
$function$;

revoke all on function public.list_mavros_command_center_security_audit(text, integer)
  from public, anon, authenticated;
grant execute on function public.list_mavros_command_center_security_audit(text, integer)
  to authenticated;
