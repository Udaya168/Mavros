-- Mavros remaining-object diagnostics
-- Target project: mcvgqhnsrqrejmyhsebg
--
-- Read-only SQL Editor script. Run one section at a time.
-- This script reads PostgreSQL catalog metadata only. It does not inspect
-- application rows, Auth email addresses, secrets, or session data.

-- 00. Target tables, related existing tables, and RLS status.
with expected(table_schema, table_name, migration_version) as (
  values
    ('public', 'developer_activity_events', '20261022001000'),
    ('public', 'developer_tasks', '20261022002000'),
    ('public', 'developer_site_visits', '20261022002000'),
    ('public', 'developer_knowledge_articles', '20261022002000'),
    ('public', 'developer_campaigns', '20261022002000'),
    ('public', 'developer_support_requests', '20261022002000'),
    ('public', 'developer_notifications', '20261022002000'),
    ('public', 'developer_team_membership_audit', '20261022003000'),
    ('public', 'developer_organizations', 'existing dependency'),
    ('public', 'developer_organization_memberships', 'existing dependency'),
    ('public', 'developer_projects', 'existing dependency'),
    ('public', 'developer_project_towers', 'existing dependency'),
    ('public', 'developer_project_units', 'existing dependency'),
    ('public', 'developer_leads', 'existing dependency'),
    ('public', 'profiles', 'existing dependency')
)
select
  expected.migration_version,
  expected.table_schema,
  expected.table_name,
  (catalog.oid is not null) as table_exists,
  coalesce(catalog.relrowsecurity, false) as rls_enabled,
  coalesce(catalog.relforcerowsecurity, false) as force_rls,
  pg_get_userbyid(catalog.relowner) as table_owner
from expected
left join pg_namespace namespace_catalog
  on namespace_catalog.nspname = expected.table_schema
left join pg_class catalog
  on catalog.relnamespace = namespace_catalog.oid
 and catalog.relname = expected.table_name
order by expected.migration_version, expected.table_name;

-- 01. All policies on target and related tables, including exact expressions.
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
  and tablename in (
    'developer_activity_events',
    'developer_tasks',
    'developer_site_visits',
    'developer_knowledge_articles',
    'developer_campaigns',
    'developer_support_requests',
    'developer_notifications',
    'developer_team_membership_audit',
    'developer_organizations',
    'developer_organization_memberships',
    'developer_projects',
    'developer_project_towers',
    'developer_project_units',
    'developer_leads',
    'profiles'
  )
order by tablename, policyname;

-- 02. Exact definitions and privileges for required functions/RPCs.
with expected(function_name, identity_arguments, migration_version) as (
  values
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
  (function_catalog.oid is not null) as function_exists,
  namespace_catalog.nspname as schema_name,
  pg_get_function_identity_arguments(function_catalog.oid) as actual_identity_arguments,
  pg_get_function_result(function_catalog.oid) as return_type,
  pg_get_userbyid(function_catalog.proowner) as owner,
  function_catalog.prosecdef as security_definer,
  function_catalog.provolatile as volatility,
  function_catalog.proconfig as search_path_settings,
  exists (
    select 1
    from aclexplode(
      coalesce(
        function_catalog.proacl,
        acldefault('f', function_catalog.proowner)
      )
    ) acl
    where acl.grantee = 0
      and acl.privilege_type = 'EXECUTE'
  ) as public_execute,
  has_function_privilege('anon', function_catalog.oid, 'execute') as anon_execute,
  has_function_privilege('authenticated', function_catalog.oid, 'execute') as authenticated_execute,
  has_function_privilege('service_role', function_catalog.oid, 'execute') as service_role_execute,
  pg_get_functiondef(function_catalog.oid) as definition
from expected
left join pg_namespace namespace_catalog
  on namespace_catalog.nspname = 'public'
left join pg_proc function_catalog
  on function_catalog.pronamespace = namespace_catalog.oid
 and function_catalog.proname = expected.function_name
 and pg_get_function_identity_arguments(function_catalog.oid) = expected.identity_arguments
order by expected.function_name, expected.identity_arguments;

-- 03. Same-named functions in every schema, with exact signatures only.
select
  namespace_catalog.nspname as schema_name,
  function_catalog.proname as function_name,
  pg_get_function_identity_arguments(function_catalog.oid) as identity_arguments,
  pg_get_function_result(function_catalog.oid) as return_type,
  pg_get_userbyid(function_catalog.proowner) as owner,
  function_catalog.prosecdef as security_definer,
  function_catalog.proconfig as search_path_settings,
  pg_get_functiondef(function_catalog.oid) as definition
from pg_proc function_catalog
join pg_namespace namespace_catalog
  on namespace_catalog.oid = function_catalog.pronamespace
where function_catalog.proname in (
    'list_developer_org_team',
    'record_developer_activity_event',
    'touch_developer_workflow_updated_at',
    'notify_developer_task_assignee',
    'manage_developer_org_member'
  )
order by function_catalog.proname,
  pg_get_function_identity_arguments(function_catalog.oid),
  namespace_catalog.nspname;

-- 04. All related non-internal triggers and exact trigger definitions.
select
  trigger_namespace.nspname as table_schema,
  relation_catalog.relname as table_name,
  trigger_catalog.tgname as trigger_name,
  trigger_catalog.tgenabled,
  pg_get_triggerdef(trigger_catalog.oid, true) as definition
from pg_trigger trigger_catalog
join pg_class relation_catalog
  on relation_catalog.oid = trigger_catalog.tgrelid
join pg_namespace trigger_namespace
  on trigger_namespace.oid = relation_catalog.relnamespace
where not trigger_catalog.tgisinternal
  and (
    (trigger_namespace.nspname = 'public'
      and relation_catalog.relname in (
        'developer_activity_events',
        'developer_tasks',
        'developer_site_visits',
        'developer_knowledge_articles',
        'developer_campaigns',
        'developer_support_requests',
        'developer_notifications',
        'developer_team_membership_audit',
        'developer_projects',
        'developer_project_towers',
        'developer_project_units',
        'developer_leads',
        'developer_organizations',
        'developer_organization_memberships',
        'profiles'
      ))
    or (trigger_namespace.nspname = 'auth'
      and relation_catalog.relname = 'users')
  )
order by trigger_namespace.nspname, relation_catalog.relname,
  trigger_catalog.tgname;

-- 05. Table privileges for target and related tables.
select
  table_schema,
  table_name,
  grantee,
  privilege_type,
  is_grantable
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('public', 'anon', 'authenticated', 'service_role')
  and table_name in (
    'developer_activity_events',
    'developer_tasks',
    'developer_site_visits',
    'developer_knowledge_articles',
    'developer_campaigns',
    'developer_support_requests',
    'developer_notifications',
    'developer_team_membership_audit',
    'developer_organizations',
    'developer_organization_memberships',
    'developer_projects',
    'developer_project_towers',
    'developer_project_units',
    'developer_leads',
    'profiles'
  )
order by table_name, grantee, privilege_type;

-- 06. Column privileges for target and related tables.
select
  table_schema,
  table_name,
  column_name,
  grantee,
  privilege_type,
  is_grantable
from information_schema.column_privileges
where table_schema = 'public'
  and grantee in ('public', 'anon', 'authenticated', 'service_role')
  and table_name in (
    'developer_activity_events',
    'developer_tasks',
    'developer_site_visits',
    'developer_knowledge_articles',
    'developer_campaigns',
    'developer_support_requests',
    'developer_notifications',
    'developer_team_membership_audit',
    'developer_organizations',
    'developer_organization_memberships',
    'developer_projects',
    'developer_project_towers',
    'developer_project_units',
    'developer_leads',
    'profiles'
  )
order by table_name, column_name, grantee, privilege_type;

-- 07. Cross-schema same-named relations and routines for collision checks.
select
  namespace_catalog.nspname as schema_name,
  relation_catalog.relname as object_name,
  case relation_catalog.relkind
    when 'r' then 'table'
    when 'p' then 'partitioned table'
    when 'v' then 'view'
    when 'm' then 'materialized view'
    when 'f' then 'foreign table'
    when 'S' then 'sequence'
    else relation_catalog.relkind::text
  end as object_type,
  pg_get_userbyid(relation_catalog.relowner) as owner
from pg_class relation_catalog
join pg_namespace namespace_catalog
  on namespace_catalog.oid = relation_catalog.relnamespace
where relation_catalog.relname in (
    'developer_activity_events',
    'developer_tasks',
    'developer_site_visits',
    'developer_knowledge_articles',
    'developer_campaigns',
    'developer_support_requests',
    'developer_notifications',
    'developer_team_membership_audit'
  )
union all
select
  namespace_catalog.nspname as schema_name,
  function_catalog.proname as object_name,
  'function' as object_type,
  pg_get_userbyid(function_catalog.proowner) as owner
from pg_proc function_catalog
join pg_namespace namespace_catalog
  on namespace_catalog.oid = function_catalog.pronamespace
where function_catalog.proname in (
    'list_developer_org_team',
    'record_developer_activity_event',
    'touch_developer_workflow_updated_at',
    'notify_developer_task_assignee',
    'manage_developer_org_member'
  )
order by schema_name, object_name, object_type;
