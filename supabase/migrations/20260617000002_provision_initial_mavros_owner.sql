do $provision_initial_owner$
declare
  verified_user_id uuid;
begin
  select id
  into verified_user_id
  from auth.users
  where id = 'f2c67a31-2b22-4ba9-86bd-91e9977b4955'::uuid
    and lower(email) = lower('admin@mavros.com');

  if verified_user_id is null then
    raise exception
      'Owner provisioning stopped: the supplied Auth UUID does not match admin@mavros.com.';
  end if;

  insert into public.mavros_staff_memberships (user_id, role, is_active)
  values (verified_user_id, 'owner', true)
  on conflict (user_id) do update
    set role = excluded.role,
        is_active = excluded.is_active;
end;
$provision_initial_owner$;
