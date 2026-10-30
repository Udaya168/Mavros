-- Mavros owner Command Center metrics RPC verification.
--
-- Read-only catalog inspection for:
--   public.get_mavros_command_center_metrics()
--
-- Run section by section in the Supabase SQL Editor. This script must not be
-- used as a deployment script. It contains SELECT statements only and does
-- not execute the RPC or change database state.

-- 00. Exact zero-argument RPC existence and identity.
select
  n.nspname as function_schema,
  p.proname as function_name,
  p.oid::regprocedure as function_signature,
  pg_get_function_identity_arguments(p.oid) as identity_arguments,
  pg_get_function_result(p.oid) as declared_return_type
from pg_proc p
join pg_namespace n
  on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'get_mavros_command_center_metrics'
  and pg_get_function_identity_arguments(p.oid) = '';

-- 01. Same-named overloads in every schema.
-- Stop for review if any row other than the expected public zero-argument
-- function is present.
select
  n.nspname as function_schema,
  p.proname as function_name,
  p.oid::regprocedure as function_signature,
  pg_get_function_identity_arguments(p.oid) as identity_arguments,
  pg_get_function_result(p.oid) as declared_return_type
from pg_proc p
join pg_namespace n
  on n.oid = p.pronamespace
where p.proname = 'get_mavros_command_center_metrics'
order by n.nspname, identity_arguments;

-- 02. Owner, security mode, configuration, return columns, and definition.
-- Expected: one public zero-argument function, SECURITY DEFINER true,
-- configuration containing search_path=, and the seven bigint result columns.
select
  n.nspname as function_schema,
  p.oid::regprocedure as function_signature,
  pg_get_userbyid(p.proowner) as function_owner,
  p.prosecdef as security_definer,
  p.proleakproof as leakproof,
  p.provolatile as volatility,
  p.proparallel as parallel_safety,
  p.proconfig as function_configuration,
  pg_get_function_identity_arguments(p.oid) as identity_arguments,
  pg_get_function_result(p.oid) as declared_return_type,
  pg_get_functiondef(p.oid) as function_definition
from pg_proc p
join pg_namespace n
  on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'get_mavros_command_center_metrics'
  and pg_get_function_identity_arguments(p.oid) = '';

-- 03. Return-column metadata from pg_proc.
-- This confirms the result shape without executing the function.
select
  output_column.ordinality as column_order,
  p.proargnames[output_column.ordinality] as column_name,
  format_type(output_column.type_oid, null) as data_type,
  type_catalog_namespace.nspname as type_schema,
  type_catalog.typname as type_name
from pg_proc p
join pg_namespace n
  on n.oid = p.pronamespace
cross join lateral unnest(p.proallargtypes) with ordinality as output_column(type_oid, ordinality)
join lateral unnest(p.proargmodes) with ordinality as output_mode(mode, ordinality)
  on output_mode.ordinality = output_column.ordinality
join pg_type type_catalog
  on type_catalog.oid = output_column.type_oid
join pg_namespace type_catalog_namespace
  on type_catalog_namespace.oid = type_catalog.typnamespace
where n.nspname = 'public'
  and p.proname = 'get_mavros_command_center_metrics'
  and pg_get_function_identity_arguments(p.oid) = ''
  and output_mode.mode in ('o', 'b', 't')
order by output_column.ordinality;

-- 04. Explicit function ACL entries, including PUBLIC.
-- PostgreSQL represents PUBLIC as ACL grantee oid 0, not as a database role.
-- No rows means the function has no explicit ACL; effective privileges are
-- reported separately in Section 05.
with target_function as (
  select p.oid, p.proacl, p.proowner
  from pg_proc p
  join pg_namespace n
    on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'get_mavros_command_center_metrics'
    and pg_get_function_identity_arguments(p.oid) = ''
)
select
  case
    when acl.grantee = 0 then 'PUBLIC'
    else pg_get_userbyid(acl.grantee)
  end as grantee,
  acl.privilege_type,
  acl.is_grantable
from target_function target
cross join lateral aclexplode(target.proacl) acl
order by grantee, acl.privilege_type;

-- 05. Effective EXECUTE privileges for the Supabase API roles.
-- Expected: anon_can_execute=false and authenticated_can_execute=true.
with target_function as (
  select p.oid
  from pg_proc p
  join pg_namespace n
    on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'get_mavros_command_center_metrics'
    and pg_get_function_identity_arguments(p.oid) = ''
)
select
  target.oid::regprocedure as function_signature,
  has_function_privilege('anon', target.oid, 'EXECUTE') as anon_can_execute,
  has_function_privilege('authenticated', target.oid, 'EXECUTE')
    as authenticated_can_execute
from target_function target;

-- 06. Required source relation existence in public.
with expected_relations(relation_name) as (
  values
    ('developer_organizations'::name),
    ('developer_organization_memberships'::name),
    ('developer_projects'::name),
    ('developer_project_units'::name),
    ('developer_leads'::name)
)
select
  expected.relation_name,
  (class.oid is not null) as relation_exists,
  class.relkind,
  class.relrowsecurity as row_level_security_enabled,
  class.relforcerowsecurity as row_level_security_forced
from expected_relations expected
left join pg_namespace namespace_catalog
  on namespace_catalog.nspname = 'public'
left join pg_class class
  on class.relnamespace = namespace_catalog.oid
 and class.relname = expected.relation_name
order by expected.relation_name;

-- 07. Required source columns and data types.
with expected_columns(table_name, column_name, expected_type) as (
  values
    ('mavros_staff_memberships'::name, 'user_id'::name, 'uuid'),
    ('mavros_staff_memberships'::name, 'role'::name, 'text'),
    ('mavros_staff_memberships'::name, 'is_active'::name, 'boolean'),
    ('developer_organizations'::name, 'id'::name, 'uuid'),
    ('developer_organization_memberships'::name, 'is_active'::name, 'boolean'),
    ('developer_projects'::name, 'status'::name, 'text'),
    ('developer_project_units'::name, 'status'::name, 'text'),
    ('developer_leads'::name, 'id'::name, 'uuid')
)
select
  expected.table_name,
  expected.column_name,
  expected.expected_type,
  (relation.oid is not null and attribute.attname is not null) as column_exists,
  case
    when attribute.attname is null then null
    else format_type(attribute.atttypid, attribute.atttypmod)
  end as actual_type,
  attribute.attnotnull as not_null
from expected_columns expected
left join pg_namespace namespace_catalog
  on namespace_catalog.nspname = 'public'
left join pg_class relation
  on relation.relnamespace = namespace_catalog.oid
 and relation.relname = expected.table_name
left join pg_attribute attribute
  on attribute.attrelid = relation.oid
 and attribute.attname = expected.column_name
 and attribute.attnum > 0
 and not attribute.attisdropped
order by expected.table_name, expected.column_name;

-- 08. Verified status constraints for published projects and available units.
select
  namespace_catalog.nspname as table_schema,
  relation.relname as table_name,
  constraint_catalog.conname as constraint_name,
  pg_get_constraintdef(constraint_catalog.oid) as constraint_definition
from pg_constraint constraint_catalog
join pg_class relation
  on relation.oid = constraint_catalog.conrelid
join pg_namespace namespace_catalog
  on namespace_catalog.oid = relation.relnamespace
where namespace_catalog.nspname = 'public'
  and relation.relname in ('developer_projects', 'developer_project_units')
  and constraint_catalog.contype = 'c'
order by relation.relname, constraint_catalog.conname;

-- 09. Source references used by the RPC definition.
-- This is a definition inspection only; it does not execute the RPC.
select
  p.oid::regprocedure as function_signature,
  pg_get_functiondef(p.oid) like '%public.mavros_staff_memberships%'
    as references_staff_memberships,
  pg_get_functiondef(p.oid) like '%public.developer_organizations%'
    as references_organizations,
  pg_get_functiondef(p.oid) like '%public.developer_organization_memberships%'
    as references_memberships,
  pg_get_functiondef(p.oid) like '%public.developer_projects%'
    as references_projects,
  pg_get_functiondef(p.oid) like '%public.developer_project_units%'
    as references_inventory_units,
  pg_get_functiondef(p.oid) like '%public.developer_leads%'
    as references_leads,
  pg_get_functiondef(p.oid) like '%auth.uid()%'
    as derives_identity_from_auth_uid,
  pg_get_functiondef(p.oid) like '%42501%'
    as rejects_unauthorized_callers
from pg_proc p
join pg_namespace n
  on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'get_mavros_command_center_metrics'
  and pg_get_function_identity_arguments(p.oid) = '';
