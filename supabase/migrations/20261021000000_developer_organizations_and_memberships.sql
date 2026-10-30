create table if not exists public.developer_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.developer_organization_memberships (
  organization_id uuid not null references public.developer_organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'marketing', 'sales', 'analyst')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index if not exists developer_org_memberships_user_active_idx
  on public.developer_organization_memberships (user_id, is_active);

alter table public.developer_organizations enable row level security;
alter table public.developer_organization_memberships enable row level security;

revoke all on table public.developer_organizations from public, anon, authenticated;
revoke all on table public.developer_organization_memberships from public, anon, authenticated;
grant select on table public.developer_organizations to authenticated;
grant select on table public.developer_organization_memberships to authenticated;

drop policy if exists "Active members can read their organizations"
  on public.developer_organizations;
create policy "Active members can read their organizations"
  on public.developer_organizations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.developer_organization_memberships membership
      where membership.organization_id = developer_organizations.id
        and membership.user_id = (select auth.uid())
        and membership.is_active
    )
  );

drop policy if exists "Users can read their own developer memberships"
  on public.developer_organization_memberships;
create policy "Users can read their own developer memberships"
  on public.developer_organization_memberships
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
