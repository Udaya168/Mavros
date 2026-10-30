-- Mavros migration reconciliation catalog
-- Target project: mcvgqhnsrqrejmyhsebg
-- Read-only SQL Editor script. Run one section at a time.

-- 00. Migration history availability. A missing relation is itself a result.
select
  table_schema,
  table_name
from information_schema.tables
where table_schema = 'supabase_migrations'
  and table_name = 'schema_migrations';

-- 01. Expected tables, RLS state, and owners.
-- Covers migrations 20260617000000, 20260617000001,
-- 20261021000000, 20261021010000, 20261021020000,
-- 20261022001000, 20261022002000, and 20261022003000.
with expected(table_name, migration_version) as (
  values
    ('mavros_staff_memberships', '20260617000000'),
    ('profiles', '20260617000001'),
    ('developer_organizations', '20261021000000'),
    ('developer_organization_memberships', '20261021000000'),
    ('developer_projects', '20261021010000'),
    ('developer_project_towers', '20261021010000'),
    ('developer_project_units', '20261021010000'),
    ('developer_leads', '20261021020000'),
    ('developer_activity_events', '20261022001000'),
    ('developer_tasks', '20261022002000'),
    ('developer_site_visits', '20261022002000'),
    ('developer_knowledge_articles', '20261022002000'),
    ('developer_campaigns', '20261022002000'),
    ('developer_support_requests', '20261022002000'),
    ('developer_notifications', '20261022002000'),
    ('developer_team_membership_audit', '20261022003000')
)
select
  expected.migration_version,
  expected.table_name,
  (catalog.oid is not null) as table_exists,
  catalog.relrowsecurity as rls_enabled,
  catalog.relforcerowsecurity as force_rls,
  pg_get_userbyid(catalog.relowner) as owner
from expected
left join pg_namespace schema_catalog
  on schema_catalog.nspname = 'public'
left join pg_class catalog
  on catalog.relname = expected.table_name
 and catalog.relnamespace = schema_catalog.oid
order by expected.migration_version, expected.table_name;

-- 02. Expected columns, types, nullability, and defaults.
with expected(table_name, column_name, migration_version) as (
  values
    ('mavros_staff_memberships', 'user_id', '20260617000000'),
    ('mavros_staff_memberships', 'role', '20260617000000'),
    ('mavros_staff_memberships', 'is_active', '20260617000000'),
    ('mavros_staff_memberships', 'created_at', '20260617000000'),
    ('profiles', 'id', '20260617000001'),
    ('profiles', 'full_name', '20260617000001'),
    ('profiles', 'created_at', '20260617000001'),
    ('profiles', 'updated_at', '20260617000001'),
    ('developer_organizations', 'id', '20261021000000'),
    ('developer_organizations', 'name', '20261021000000'),
    ('developer_organizations', 'slug', '20261021000000'),
    ('developer_organizations', 'created_at', '20261021000000'),
    ('developer_organizations', 'updated_at', '20261021000000'),
    ('developer_organization_memberships', 'organization_id', '20261021000000'),
    ('developer_organization_memberships', 'user_id', '20261021000000'),
    ('developer_organization_memberships', 'role', '20261021000000'),
    ('developer_organization_memberships', 'is_active', '20261021000000'),
    ('developer_organization_memberships', 'created_at', '20261021000000'),
    ('developer_projects', 'id', '20261021010000'),
    ('developer_projects', 'organization_id', '20261021010000'),
    ('developer_projects', 'name', '20261021010000'),
    ('developer_projects', 'slug', '20261021010000'),
    ('developer_projects', 'location', '20261021010000'),
    ('developer_projects', 'rera_id', '20261021010000'),
    ('developer_projects', 'possession', '20261021010000'),
    ('developer_projects', 'status', '20261021010000'),
    ('developer_projects', 'tagline', '20261021010000'),
    ('developer_projects', 'description', '20261021010000'),
    ('developer_projects', 'amenities', '20261021010000'),
    ('developer_projects', 'created_at', '20261021010000'),
    ('developer_projects', 'updated_at', '20261021010000'),
    ('developer_project_towers', 'id', '20261021010000'),
    ('developer_project_towers', 'organization_id', '20261021010000'),
    ('developer_project_towers', 'project_id', '20261021010000'),
    ('developer_project_towers', 'name', '20261021010000'),
    ('developer_project_towers', 'created_at', '20261021010000'),
    ('developer_project_towers', 'updated_at', '20261021010000'),
    ('developer_project_units', 'id', '20261021010000'),
    ('developer_project_units', 'organization_id', '20261021010000'),
    ('developer_project_units', 'project_id', '20261021010000'),
    ('developer_project_units', 'tower_id', '20261021010000'),
    ('developer_project_units', 'unit_number', '20261021010000'),
    ('developer_project_units', 'unit_type', '20261021010000'),
    ('developer_project_units', 'area_sqft', '20261021010000'),
    ('developer_project_units', 'approved_price', '20261021010000'),
    ('developer_project_units', 'status', '20261021010000'),
    ('developer_project_units', 'created_at', '20261021010000'),
    ('developer_project_units', 'updated_at', '20261021010000'),
    ('developer_leads', 'id', '20261021020000'),
    ('developer_leads', 'organization_id', '20261021020000'),
    ('developer_leads', 'project_id', '20261021020000'),
    ('developer_leads', 'assigned_to', '20261021020000'),
    ('developer_leads', 'full_name', '20261021020000'),
    ('developer_leads', 'email', '20261021020000'),
    ('developer_leads', 'phone', '20261021020000'),
    ('developer_leads', 'source', '20261021020000'),
    ('developer_leads', 'status', '20261021020000'),
    ('developer_leads', 'budget_min', '20261021020000'),
    ('developer_leads', 'budget_max', '20261021020000'),
    ('developer_leads', 'preferred_configuration', '20261021020000'),
    ('developer_leads', 'notes', '20261021020000'),
    ('developer_leads', 'next_follow_up_at', '20261021020000'),
    ('developer_leads', 'created_at', '20261021020000'),
    ('developer_leads', 'updated_at', '20261021020000'),
    ('developer_activity_events', 'id', '20261022001000'),
    ('developer_activity_events', 'organization_id', '20261022001000'),
    ('developer_activity_events', 'actor_user_id', '20261022001000'),
    ('developer_activity_events', 'entity_type', '20261022001000'),
    ('developer_activity_events', 'entity_id', '20261022001000'),
    ('developer_activity_events', 'action', '20261022001000'),
    ('developer_activity_events', 'created_at', '20261022001000'),
    ('developer_tasks', 'id', '20261022002000'),
    ('developer_tasks', 'organization_id', '20261022002000'),
    ('developer_tasks', 'project_id', '20261022002000'),
    ('developer_tasks', 'lead_id', '20261022002000'),
    ('developer_tasks', 'assigned_to', '20261022002000'),
    ('developer_tasks', 'created_by', '20261022002000'),
    ('developer_tasks', 'title', '20261022002000'),
    ('developer_tasks', 'description', '20261022002000'),
    ('developer_tasks', 'due_at', '20261022002000'),
    ('developer_tasks', 'status', '20261022002000'),
    ('developer_tasks', 'created_at', '20261022002000'),
    ('developer_tasks', 'updated_at', '20261022002000'),
    ('developer_site_visits', 'id', '20261022002000'),
    ('developer_site_visits', 'organization_id', '20261022002000'),
    ('developer_site_visits', 'project_id', '20261022002000'),
    ('developer_site_visits', 'lead_id', '20261022002000'),
    ('developer_site_visits', 'assigned_to', '20261022002000'),
    ('developer_site_visits', 'scheduled_at', '20261022002000'),
    ('developer_site_visits', 'duration_minutes', '20261022002000'),
    ('developer_site_visits', 'status', '20261022002000'),
    ('developer_site_visits', 'notes', '20261022002000'),
    ('developer_site_visits', 'created_by', '20261022002000'),
    ('developer_site_visits', 'created_at', '20261022002000'),
    ('developer_site_visits', 'updated_at', '20261022002000'),
    ('developer_knowledge_articles', 'id', '20261022002000'),
    ('developer_knowledge_articles', 'organization_id', '20261022002000'),
    ('developer_knowledge_articles', 'title', '20261022002000'),
    ('developer_knowledge_articles', 'category', '20261022002000'),
    ('developer_knowledge_articles', 'content', '20261022002000'),
    ('developer_knowledge_articles', 'status', '20261022002000'),
    ('developer_knowledge_articles', 'created_by', '20261022002000'),
    ('developer_knowledge_articles', 'created_at', '20261022002000'),
    ('developer_knowledge_articles', 'updated_at', '20261022002000'),
    ('developer_campaigns', 'id', '20261022002000'),
    ('developer_campaigns', 'organization_id', '20261022002000'),
    ('developer_campaigns', 'project_id', '20261022002000'),
    ('developer_campaigns', 'name', '20261022002000'),
    ('developer_campaigns', 'channel', '20261022002000'),
    ('developer_campaigns', 'status', '20261022002000'),
    ('developer_campaigns', 'planned_budget', '20261022002000'),
    ('developer_campaigns', 'starts_on', '20261022002000'),
    ('developer_campaigns', 'ends_on', '20261022002000'),
    ('developer_campaigns', 'created_by', '20261022002000'),
    ('developer_campaigns', 'created_at', '20261022002000'),
    ('developer_campaigns', 'updated_at', '20261022002000'),
    ('developer_support_requests', 'id', '20261022002000'),
    ('developer_support_requests', 'organization_id', '20261022002000'),
    ('developer_support_requests', 'requested_by', '20261022002000'),
    ('developer_support_requests', 'subject', '20261022002000'),
    ('developer_support_requests', 'message', '20261022002000'),
    ('developer_support_requests', 'status', '20261022002000'),
    ('developer_support_requests', 'created_at', '20261022002000'),
    ('developer_support_requests', 'updated_at', '20261022002000'),
    ('developer_notifications', 'id', '20261022002000'),
    ('developer_notifications', 'organization_id', '20261022002000'),
    ('developer_notifications', 'recipient_user_id', '20261022002000'),
    ('developer_notifications', 'kind', '20261022002000'),
    ('developer_notifications', 'title', '20261022002000'),
    ('developer_notifications', 'body', '20261022002000'),
    ('developer_notifications', 'entity_type', '20261022002000'),
    ('developer_notifications', 'entity_id', '20261022002000'),
    ('developer_notifications', 'read_at', '20261022002000'),
    ('developer_notifications', 'created_at', '20261022002000'),
    ('developer_team_membership_audit', 'id', '20261022003000'),
    ('developer_team_membership_audit', 'organization_id', '20261022003000'),
    ('developer_team_membership_audit', 'actor_user_id', '20261022003000'),
    ('developer_team_membership_audit', 'target_user_id', '20261022003000'),
    ('developer_team_membership_audit', 'previous_role', '20261022003000'),
    ('developer_team_membership_audit', 'new_role', '20261022003000'),
    ('developer_team_membership_audit', 'was_active', '20261022003000'),
    ('developer_team_membership_audit', 'is_active', '20261022003000'),
    ('developer_team_membership_audit', 'created_at', '20261022003000')
)
select
  expected.migration_version,
  expected.table_name,
  expected.column_name,
  columns.data_type,
  columns.udt_name,
  columns.is_nullable,
  columns.column_default,
  columns.character_maximum_length,
  columns.numeric_precision,
  columns.numeric_scale
from expected
left join information_schema.columns
  on columns.table_schema = 'public'
 and columns.table_name = expected.table_name
 and columns.column_name = expected.column_name
order by expected.migration_version, expected.table_name, expected.column_name;

-- 03. Expected named constraints and exact definitions for expected tables.
with expected(table_name, constraint_name, migration_version) as (
  values
    ('developer_projects', 'developer_projects_organization_slug_unique', '20261021010000'),
    ('developer_projects', 'developer_projects_organization_id_id_unique', '20261021010000'),
    ('developer_project_towers', 'developer_project_towers_project_fk', '20261021010000'),
    ('developer_project_towers', 'developer_project_towers_project_name_unique', '20261021010000'),
    ('developer_project_towers', 'developer_project_towers_organization_project_id_unique', '20261021010000'),
    ('developer_project_units', 'developer_project_units_project_fk', '20261021010000'),
    ('developer_project_units', 'developer_project_units_tower_fk', '20261021010000'),
    ('developer_project_units', 'developer_project_units_project_number_unique', '20261021010000'),
    ('developer_leads', 'developer_leads_budget_range_check', '20261021020000'),
    ('developer_leads', 'developer_leads_organization_id_id_unique', '20261021020000'),
    ('developer_leads', 'developer_leads_project_organization_fk', '20261021020000'),
    ('developer_tasks', 'developer_tasks_project_fk', '20261022002000'),
    ('developer_tasks', 'developer_tasks_lead_fk', '20261022002000'),
    ('developer_site_visits', 'developer_site_visits_project_fk', '20261022002000'),
    ('developer_site_visits', 'developer_site_visits_lead_fk', '20261022002000'),
    ('developer_campaigns', 'developer_campaigns_date_range_check', '20261022002000'),
    ('developer_campaigns', 'developer_campaigns_project_fk', '20261022002000')
)
select
  expected.migration_version,
  expected.table_name,
  expected.constraint_name,
  (constraints.oid is not null) as constraint_exists,
  pg_get_constraintdef(constraints.oid, true) as definition
from expected
left join pg_class cls
  on cls.relname = expected.table_name
left join pg_namespace ns
  on ns.oid = cls.relnamespace
 and ns.nspname = 'public'
left join pg_constraint constraints
  on constraints.conrelid = cls.oid
 and constraints.conname = expected.constraint_name
where cls.oid is null
   or ns.nspname = 'public'
order by expected.migration_version, expected.table_name, expected.constraint_name;

-- 03b. All actual constraints on expected public tables, including unnamed checks.
select
  cls.relname as table_name,
  con.conname as constraint_name,
  con.contype as constraint_type,
  pg_get_constraintdef(con.oid, true) as definition
from pg_constraint con
join pg_class cls on cls.oid = con.conrelid
join pg_namespace ns on ns.oid = cls.relnamespace
where ns.nspname = 'public'
  and cls.relname in (
    'mavros_staff_memberships', 'profiles',
    'developer_organizations', 'developer_organization_memberships',
    'developer_projects', 'developer_project_towers', 'developer_project_units',
    'developer_leads', 'developer_activity_events',
    'developer_tasks', 'developer_site_visits', 'developer_knowledge_articles',
    'developer_campaigns', 'developer_support_requests',
    'developer_notifications', 'developer_team_membership_audit'
  )
order by cls.relname, con.conname;

-- 04. Expected and actual indexes.
with expected(index_name, table_name, migration_version) as (
  values
    ('developer_org_memberships_user_active_idx', 'developer_organization_memberships', '20261021000000'),
    ('developer_projects_organization_status_updated_idx', 'developer_projects', '20261021010000'),
    ('developer_project_towers_organization_project_idx', 'developer_project_towers', '20261021010000'),
    ('developer_project_units_organization_project_status_idx', 'developer_project_units', '20261021010000'),
    ('developer_leads_organization_status_created_idx', 'developer_leads', '20261021020000'),
    ('developer_leads_organization_follow_up_idx', 'developer_leads', '20261021020000'),
    ('developer_leads_organization_project_idx', 'developer_leads', '20261021020000'),
    ('developer_leads_organization_assignee_idx', 'developer_leads', '20261021020000'),
    ('developer_leads_organization_email_idx', 'developer_leads', '20261021020000'),
    ('developer_leads_organization_phone_idx', 'developer_leads', '20261021020000'),
    ('developer_activity_events_organization_created_idx', 'developer_activity_events', '20261022001000'),
    ('developer_tasks_org_due_idx', 'developer_tasks', '20261022002000'),
    ('developer_tasks_org_assignee_idx', 'developer_tasks', '20261022002000'),
    ('developer_site_visits_org_schedule_idx', 'developer_site_visits', '20261022002000'),
    ('developer_knowledge_articles_org_status_idx', 'developer_knowledge_articles', '20261022002000'),
    ('developer_campaigns_org_status_idx', 'developer_campaigns', '20261022002000'),
    ('developer_support_requests_org_created_idx', 'developer_support_requests', '20261022002000'),
    ('developer_notifications_recipient_unread_idx', 'developer_notifications', '20261022002000'),
    ('developer_team_membership_audit_org_created_idx', 'developer_team_membership_audit', '20261022003000')
)
select
  expected.migration_version,
  expected.index_name,
  expected.table_name,
  (indexes.indexname is not null) as index_exists,
  indexes.indexdef
from expected
left join pg_indexes indexes
  on indexes.schemaname = 'public'
 and indexes.indexname = expected.index_name
order by expected.migration_version, expected.index_name;

-- 05. Exact RLS policies and expressions.
select
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'mavros_staff_memberships', 'profiles',
    'developer_organizations', 'developer_organization_memberships',
    'developer_projects', 'developer_project_towers', 'developer_project_units',
    'developer_leads', 'developer_activity_events',
    'developer_tasks', 'developer_site_visits', 'developer_knowledge_articles',
    'developer_campaigns', 'developer_support_requests',
    'developer_notifications', 'developer_team_membership_audit'
  )
order by tablename, policyname;

-- 06. Table and column grants.
select
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated', 'service_role')
  and table_name in (
    'mavros_staff_memberships', 'profiles',
    'developer_organizations', 'developer_organization_memberships',
    'developer_projects', 'developer_project_towers', 'developer_project_units',
    'developer_leads', 'developer_activity_events',
    'developer_tasks', 'developer_site_visits', 'developer_knowledge_articles',
    'developer_campaigns', 'developer_support_requests',
    'developer_notifications', 'developer_team_membership_audit'
  )
order by table_name, grantee, privilege_type;

select
  table_name,
  column_name,
  grantee,
  privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and grantee in ('anon', 'authenticated', 'service_role')
  and table_name in (
    'profiles', 'developer_leads', 'developer_tasks',
    'developer_site_visits', 'developer_knowledge_articles',
    'developer_campaigns', 'developer_support_requests',
    'developer_notifications'
  )
order by table_name, column_name, grantee, privilege_type;

-- 07. Expected functions, definitions, owners, security mode, and execute grants.
with expected(function_name, identity_arguments, migration_version) as (
  values
    ('create_profile_for_new_auth_user', '', '20260617000001'),
    ('touch_profile_updated_at', '', '20260617000001'),
    ('touch_developer_project_updated_at', '', '20261021010000'),
    ('is_active_developer_org_member', 'uuid, uuid', '20261021020000'),
    ('list_developer_org_lead_assignees', 'uuid', '20261021020000'),
    ('touch_developer_lead_updated_at', '', '20261021020000'),
    ('list_developer_org_team', 'uuid', '20261022001000/20261022004000'),
    ('record_developer_activity_event', '', '20261022001000'),
    ('touch_developer_workflow_updated_at', '', '20261022002000'),
    ('notify_developer_task_assignee', '', '20261022002000'),
    ('manage_developer_org_member', 'uuid, uuid, text, boolean', '20261022003000')
)
select
  expected.migration_version,
  expected.function_name,
  expected.identity_arguments,
  pg_get_function_result(functions.oid) as return_type,
  functions.prosecdef as security_definer,
  functions.provolatile as volatility,
  functions.proconfig as settings,
  pg_get_userbyid(functions.proowner) as owner,
  has_function_privilege('anon', functions.oid, 'execute') as anon_execute,
  has_function_privilege('authenticated', functions.oid, 'execute') as authenticated_execute,
  pg_get_functiondef(functions.oid) as definition
from expected
left join pg_proc functions
  on functions.proname = expected.function_name
 and pg_get_function_identity_arguments(functions.oid) = expected.identity_arguments
left join pg_namespace schema_catalog
  on schema_catalog.oid = functions.pronamespace
 and schema_catalog.nspname = 'public'
where functions.oid is null
   or schema_catalog.oid is not null
order by expected.function_name, expected.identity_arguments;

-- 08. Trigger definitions, including auth/profile triggers.
select
  n.nspname as schema_name,
  c.relname as table_name,
  t.tgname as trigger_name,
  t.tgenabled,
  pg_get_triggerdef(t.oid, true) as definition
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where not t.tgisinternal
  and (
    (n.nspname = 'public' and c.relname in (
      'developer_projects', 'developer_project_towers', 'developer_project_units',
      'developer_leads', 'developer_activity_events',
      'developer_tasks', 'developer_site_visits', 'developer_knowledge_articles',
      'developer_campaigns', 'developer_support_requests',
      'developer_notifications'
    ))
    or (n.nspname = 'auth' and c.relname = 'users')
    or (n.nspname = 'public' and c.relname = 'profiles')
  )
order by n.nspname, c.relname, t.tgname;

-- 09. Team directory RPC: original and hardened definitions are the same signature.
select
  p.oid,
  p.proname,
  pg_get_function_identity_arguments(p.oid) as identity_arguments,
  pg_get_function_result(p.oid) as return_type,
  p.prosecdef as security_definer,
  p.proconfig as settings,
  has_function_privilege('anon', p.oid, 'execute') as anon_execute,
  has_function_privilege('authenticated', p.oid, 'execute') as authenticated_execute,
  pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'list_developer_org_team'
  and pg_get_function_identity_arguments(p.oid) = 'uuid';

-- 10. Membership-management RPC and audit policy.
select
  p.oid,
  p.proname,
  pg_get_function_identity_arguments(p.oid) as identity_arguments,
  pg_get_function_result(p.oid) as return_type,
  p.prosecdef as security_definer,
  p.proconfig as settings,
  has_function_privilege('anon', p.oid, 'execute') as anon_execute,
  has_function_privilege('authenticated', p.oid, 'execute') as authenticated_execute,
  pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'manage_developer_org_member'
  and pg_get_function_identity_arguments(p.oid) = 'uuid, uuid, text, boolean';

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'developer_team_membership_audit';

-- 11. The 20260617000002 owner-provisioning identity check.
-- Sensitive: run privately; do not publish or broadly share its result.
-- This returns only the target role/status and a boolean email match.
select
  s.role,
  s.is_active,
  exists (
    select 1
    from auth.users u
    where u.id = s.user_id
      and lower(u.email) = lower('admin@mavros.com')
  ) as matches_expected_email
from public.mavros_staff_memberships s
where s.user_id = 'f2c67a31-2b22-4ba9-86bd-91e9977b4955'::uuid;
