create table public.mavros_staff_memberships (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'operator', 'support')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.mavros_staff_memberships enable row level security;

revoke all on table public.mavros_staff_memberships from anon, authenticated;
grant select on table public.mavros_staff_memberships to authenticated;

create policy "Mavros staff can read their own membership"
  on public.mavros_staff_memberships
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
