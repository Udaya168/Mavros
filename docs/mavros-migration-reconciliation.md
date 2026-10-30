# Mavros Supabase Migration Reconciliation

Target project: `mcvgqhnsrqrejmyhsebg`

This report uses the supplied read-only catalog observations and the ten local
files in [`supabase/migrations/`](../supabase/migrations/). No remote command
or SQL was executed while preparing this report.

## Evidence rules

- **Confirmed present** means the supplied catalog/listing explicitly showed
  the object.
- **Confirmed missing from public table listing** means the complete public
  table listing did not show the table. It is not proof of global absence from
  another schema, view, role, or connection.
- **Unknown** means the supplied results did not establish presence, absence,
  or definition equivalence.
- Existing tables never prove that a migration is applied: constraints,
  indexes, grants, policy expressions, functions, triggers, and data effects
  must also match.

Confirmed observations:

- Present with RLS: `developer_organizations`,
  `developer_organization_memberships`, `developer_projects`,
  `developer_project_towers`, `developer_project_units`, and
  `developer_leads`.
- Present: `mavros_staff_memberships` and `profiles`.
- RLS is enabled on all six developer core tables, and remote policy rows were
  observed for those tables. The supplied results establish policy presence,
  not exact equivalence to the local policy expressions.
- Remote key/constraint rows were observed for the six developer core tables.
  The supplied results do not establish that every local check, composite
  foreign key, uniqueness constraint, or constraint definition matches.
- The supplied catalog results confirmed these six functions:
  `create_profile_for_new_auth_user`,
  `touch_profile_updated_at`,
  `is_active_developer_org_member`,
  `list_developer_org_lead_assignees`,
  `touch_developer_lead_updated_at`, and
  `touch_developer_project_updated_at`.
- The supplied catalog results confirmed these six enabled triggers and
  mappings:
  `on_auth_user_created_create_profile` on `auth.users` calls
  `create_profile_for_new_auth_user`;
  `on_profile_updated` on `public.profiles` calls
  `touch_profile_updated_at`;
  `developer_projects_touch_updated_at` on
  `public.developer_projects` calls
  `touch_developer_project_updated_at`;
  `developer_project_towers_touch_updated_at` on
  `public.developer_project_towers` calls
  `touch_developer_project_updated_at`;
  `developer_project_units_touch_updated_at` on
  `public.developer_project_units` calls
  `touch_developer_project_updated_at`; and
  `developer_leads_touch_updated_at` on `public.developer_leads` calls
  `touch_developer_lead_updated_at`.
- Index catalog rows and grant catalog rows for the six core tables have not
  been supplied as exact evidence in this report; their presence, definitions,
  and equivalence remain UNKNOWN. The same applies to function definitions,
  security mode, owners, and execute privileges unless explicitly listed
  above.
- `developer_activity_events`, the six workflow tables, and
  `developer_team_membership_audit` were not in the complete public table
  listing.
- The CLI showed all ten local versions with blank remote versions.
- `supabase_migrations.schema_migrations` was not visible to the SQL Editor
  connection/role used.

## Per-migration reconciliation

| Migration | Confirmed present | Confirmed missing from public table listing | Unverified definitions/effects | Safe to replay whole? |
|---|---|---|---|---|
| `20260617000000` | `mavros_staff_memberships` | None | Columns, Auth FK, role check, RLS, self-read policy, and grants | **No.** Unguarded table/policy/security creation may conflict or alter the staff authorization boundary |
| `20260617000001` | `profiles`; `mavros_staff_memberships`; `create_profile_for_new_auth_user`; `touch_profile_updated_at`; the two profile/Auth triggers | None | Staff role constraint replacement; profile columns, RLS, grants, policies; exact function definitions/security mode/privileges and trigger definitions | **No.** It changes an existing role constraint and installs Auth-related triggers |
| `20260617000002` | Target staff table | None | Whether fixed Auth UUID/email exists and whether the owner membership was already provisioned | **No.** It can upsert privileged authorization data for `admin@mavros.com`; keep separate |
| `20261021000000` | Both organization tables with RLS | None | Exact columns, checks, FKs, composite PK, index, grants, policy expressions, and policy ownership | **No.** Although table/index creation is guarded, it revokes grants and drops/recreates policies |
| `20261021010000` | Projects, towers, and units with RLS; `touch_developer_project_updated_at`; the three project timestamp triggers | None | Columns, composite tenant constraints, three indexes, grants, eight policies, exact function definition/security mode/privileges, and trigger definitions | **No.** Largely unguarded DDL/security changes can fail or conflict with live data and policies |
| `20261021020000` | Leads with RLS; `is_active_developer_org_member`; `list_developer_org_lead_assignees`; `touch_developer_lead_updated_at`; lead timestamp trigger | None | Columns, six indexes, constraints, column grants, four policies, exact function definitions/security mode/privileges, and trigger definition | **No.** Assignment/tenant policies and privileged grants are not proven equivalent |
| `20261022001000` | None confirmed | `developer_activity_events` | Team directory RPC, activity function, grants, policy, and three activity triggers | **No.** Unguarded objects depend on core tables and attach audit triggers |
| `20261022002000` | None confirmed | Six workflow tables: tasks, site visits, knowledge articles, campaigns, support requests, notifications | Seven indexes, grants, 22 policies, update function/five triggers, notification function/trigger | **No.** Broad unguarded schema/security changes and a trigger that writes notifications |
| `20261022003000` | None confirmed | `developer_team_membership_audit` | Audit index/RLS/grant/policy and security-definer membership-management RPC | **No.** It enables privileged membership updates and audit writes |
| `20261022004000` | None confirmed | None | Whether compatible `list_developer_org_team(uuid)` exists, its exact definition, and execute privileges | **No.** `CREATE OR REPLACE` changes authorization behavior and privileges |

## Local effects that require special handling

- `20260617000001` creates a profile-on-Auth-user trigger and a profile
  timestamp trigger.
- `20260617000002` verifies a fixed Auth identity, then inserts or updates
  `mavros_staff_memberships` to active `owner`.
- `20261022001000` creates activity rows through triggers on projects, units,
  and leads.
- `20261022002000` creates notification rows when tasks are assigned.
- `20261022003000` updates memberships and inserts audit rows when its RPC is
  called.

These effects are not migration-history metadata and must be verified
separately before any history reconciliation.

## Safest next step

Run the existing read-only catalog script in the Supabase SQL Editor for
`mcvgqhnsrqrejmyhsebg`, sections `00` through `11`, and export every result
grid with its section number:

[`scripts/mavros-migration-catalog.sql`](../scripts/mavros-migration-catalog.sql)

Start with sections `01`–`08` for exact tables/security objects, then run
`09`–`11` for the RPCs and owner-provisioning identity check. Do not run
`db push`, migration repair, reset, DDL, or data-changing SQL. Do not mark any
migration applied until every listed effect has been compared to the local
file.
