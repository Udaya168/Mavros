-- Owner-only support request view for the Mavros Command Center.
--
-- Support requests are protected by organization-scoped RLS policies. This
-- narrowly shaped SECURITY DEFINER function allows the verified Mavros owner
-- to review operational requests without exposing internal identifiers,
-- credentials, tokens, or full request messages.

create function public.list_mavros_command_center_support_requests(
  p_status text default null,
  p_limit integer default 100
)
returns table (
  request_id uuid,
  organization_name text,
  subject text,
  summary text,
  status text,
  requester_name text,
  created_at timestamptz,
  updated_at timestamptz
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

  if p_status is not null
    and p_status not in ('open', 'in_progress', 'resolved', 'closed') then
    raise exception 'Unsupported support request status.'
      using errcode = '22023';
  end if;

  if p_limit is null or p_limit < 1 or p_limit > 100 then
    raise exception 'Support request limit must be between 1 and 100.'
      using errcode = '22023';
  end if;

  return query
  select
    support_request.id as request_id,
    organization.name as organization_name,
    support_request.subject,
    left(support_request.message, 240) as summary,
    support_request.status,
    coalesce(nullif(trim(profile.full_name), ''), 'Authenticated user') as requester_name,
    support_request.created_at,
    support_request.updated_at
  from public.developer_support_requests support_request
  join public.developer_organizations organization
    on organization.id = support_request.organization_id
  left join public.profiles profile
    on profile.id = support_request.requested_by
  where p_status is null or support_request.status = p_status
  order by support_request.updated_at desc, support_request.created_at desc
  limit p_limit;
end;
$function$;

revoke all on function public.list_mavros_command_center_support_requests(text, integer)
  from public, anon, authenticated;

grant execute on function public.list_mavros_command_center_support_requests(text, integer)
  to authenticated;
