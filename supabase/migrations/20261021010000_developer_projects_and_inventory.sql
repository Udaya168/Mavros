create table public.developer_projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.developer_organizations (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 160),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  location text not null default '' check (length(location) <= 240),
  rera_id text check (rera_id is null or length(rera_id) <= 120),
  possession text check (possession is null or length(possession) <= 120),
  status text not null default 'draft' check (status in ('draft', 'published')),
  tagline text not null default '' check (length(tagline) <= 240),
  description text not null default '' check (length(description) <= 5000),
  amenities text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint developer_projects_organization_slug_unique unique (organization_id, slug),
  constraint developer_projects_organization_id_id_unique unique (organization_id, id)
);

create table public.developer_project_towers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  project_id uuid not null,
  name text not null check (length(trim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint developer_project_towers_project_fk
    foreign key (organization_id, project_id)
    references public.developer_projects (organization_id, id) on delete cascade,
  constraint developer_project_towers_project_name_unique unique (project_id, name),
  constraint developer_project_towers_organization_project_id_unique
    unique (organization_id, project_id, id)
);

create table public.developer_project_units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  project_id uuid not null,
  tower_id uuid not null,
  unit_number text not null check (length(trim(unit_number)) between 1 and 80),
  unit_type text not null check (length(trim(unit_type)) between 1 and 80),
  area_sqft numeric(12, 2) check (area_sqft is null or area_sqft > 0),
  approved_price numeric(14, 2) check (approved_price is null or approved_price >= 0),
  status text not null default 'available'
    check (status in ('available', 'held', 'booked', 'sold', 'unlisted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint developer_project_units_project_fk
    foreign key (organization_id, project_id)
    references public.developer_projects (organization_id, id) on delete cascade,
  constraint developer_project_units_tower_fk
    foreign key (organization_id, project_id, tower_id)
    references public.developer_project_towers (organization_id, project_id, id) on delete cascade,
  constraint developer_project_units_project_number_unique unique (project_id, unit_number)
);

create index developer_projects_organization_status_updated_idx
  on public.developer_projects (organization_id, status, updated_at desc);
create index developer_project_towers_organization_project_idx
  on public.developer_project_towers (organization_id, project_id);
create index developer_project_units_organization_project_status_idx
  on public.developer_project_units (organization_id, project_id, status, updated_at desc);

alter table public.developer_projects enable row level security;
alter table public.developer_project_towers enable row level security;
alter table public.developer_project_units enable row level security;

revoke all on table public.developer_projects from public, anon, authenticated;
revoke all on table public.developer_project_towers from public, anon, authenticated;
revoke all on table public.developer_project_units from public, anon, authenticated;
grant select, insert, update, delete on table public.developer_projects to authenticated;
grant select, insert, update, delete on table public.developer_project_towers to authenticated;
grant select, insert, update, delete on table public.developer_project_units to authenticated;

create policy "Active organization members can read developer projects"
  on public.developer_projects for select to authenticated
  using (
    exists (
      select 1 from public.developer_organization_memberships membership
      where membership.organization_id = developer_projects.organization_id
        and membership.user_id = (select auth.uid())
        and membership.is_active
    )
  );
create policy "Organization owners and admins can create developer projects"
  on public.developer_projects for insert to authenticated
  with check (
    exists (
      select 1 from public.developer_organization_memberships membership
      where membership.organization_id = developer_projects.organization_id
        and membership.user_id = (select auth.uid())
        and membership.is_active
        and membership.role in ('owner', 'admin')
    )
  );
create policy "Organization owners and admins can update developer projects"
  on public.developer_projects for update to authenticated
  using (
    exists (
      select 1 from public.developer_organization_memberships membership
      where membership.organization_id = developer_projects.organization_id
        and membership.user_id = (select auth.uid())
        and membership.is_active
        and membership.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.developer_organization_memberships membership
      where membership.organization_id = developer_projects.organization_id
        and membership.user_id = (select auth.uid())
        and membership.is_active
        and membership.role in ('owner', 'admin')
    )
  );
create policy "Organization owners and admins can delete developer projects"
  on public.developer_projects for delete to authenticated
  using (
    exists (
      select 1 from public.developer_organization_memberships membership
      where membership.organization_id = developer_projects.organization_id
        and membership.user_id = (select auth.uid())
        and membership.is_active
        and membership.role in ('owner', 'admin')
    )
  );

create policy "Active organization members can read project towers"
  on public.developer_project_towers for select to authenticated
  using (
    exists (
      select 1 from public.developer_organization_memberships membership
      where membership.organization_id = developer_project_towers.organization_id
        and membership.user_id = (select auth.uid())
        and membership.is_active
    )
  );
create policy "Organization owners and admins can manage project towers"
  on public.developer_project_towers for all to authenticated
  using (
    exists (
      select 1 from public.developer_organization_memberships membership
      where membership.organization_id = developer_project_towers.organization_id
        and membership.user_id = (select auth.uid())
        and membership.is_active
        and membership.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.developer_organization_memberships membership
      where membership.organization_id = developer_project_towers.organization_id
        and membership.user_id = (select auth.uid())
        and membership.is_active
        and membership.role in ('owner', 'admin')
    )
  );

create policy "Active organization members can read project inventory"
  on public.developer_project_units for select to authenticated
  using (
    exists (
      select 1 from public.developer_organization_memberships membership
      where membership.organization_id = developer_project_units.organization_id
        and membership.user_id = (select auth.uid())
        and membership.is_active
    )
  );
create policy "Organization owners and admins can manage project inventory"
  on public.developer_project_units for all to authenticated
  using (
    exists (
      select 1 from public.developer_organization_memberships membership
      where membership.organization_id = developer_project_units.organization_id
        and membership.user_id = (select auth.uid())
        and membership.is_active
        and membership.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.developer_organization_memberships membership
      where membership.organization_id = developer_project_units.organization_id
        and membership.user_id = (select auth.uid())
        and membership.is_active
        and membership.role in ('owner', 'admin')
    )
  );

create function public.touch_developer_project_updated_at()
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
revoke all on function public.touch_developer_project_updated_at() from public, anon, authenticated;

create trigger developer_projects_touch_updated_at
  before update on public.developer_projects
  for each row execute function public.touch_developer_project_updated_at();
create trigger developer_project_towers_touch_updated_at
  before update on public.developer_project_towers
  for each row execute function public.touch_developer_project_updated_at();
create trigger developer_project_units_touch_updated_at
  before update on public.developer_project_units
  for each row execute function public.touch_developer_project_updated_at();
