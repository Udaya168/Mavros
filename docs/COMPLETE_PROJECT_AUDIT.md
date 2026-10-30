# Mavros Complete Project Audit

Audit date: 2026-10-27  
Repository: `Udaya168/Mavros`  
Scope: Supabase architecture, migration history, backend/database contracts, RLS, RPC authorization, and safe local validation.

## Supabase verification pass

This section records the follow-up verification performed on 2026-10-27. It
does not replace the earlier application audit or imply remote access.

### Complete `supabase/` inventory

The directory contains:

- 13 SQL files under [`supabase/migrations/`](../supabase/migrations).
- Supabase `.temp` linkage/version metadata files:
  `cli-latest`, `gotrue-version`, `linked-project.json`, `pooler-url`,
  `postgres-version`, `project-ref`, `rest-version`, `storage-migration`, and
  `storage-version`.
- No seed file.
- No schema snapshot.
- No committed database test harness.
- No available `supabase/config.toml`; the worktree records it as deleted.

The `.temp/project-ref` and linked metadata establish that a project was linked
locally, but they do **not** establish that the remote project was queried or
that its schema matches this worktree.

### Static object and contract comparison

Repository inspection found 16 distinct tables referenced by `backend/` or its
compatibility adapters:

`developer_activity_events`, `developer_campaigns`,
`developer_knowledge_articles`, `developer_leads`,
`developer_notifications`, `developer_organization_memberships`,
`developer_organizations`, `developer_project_towers`,
`developer_project_units`, `developer_projects`, `developer_site_visits`,
`developer_support_requests`, `developer_tasks`,
`developer_team_membership_audit`, `mavros_staff_memberships`, and `profiles`.

All 16 have a corresponding `CREATE TABLE` definition in the repository
migrations. The seven RPCs used by backend code also all have corresponding
function definitions:

`get_mavros_command_center_metrics`,
`is_active_developer_org_member`,
`list_developer_org_lead_assignees`,
`list_developer_org_team`,
`list_mavros_command_center_security_audit`,
`list_mavros_command_center_support_requests`, and
`manage_developer_org_member`.

Result: **PASS, repository SQL inspection**. This is not a deployed-schema
comparison.

### Workflow dependency-chain review

[`20261022002000_developer_workflows.sql`](../supabase/migrations/20261022002000_developer_workflows.sql)
depends on the organization/membership migration, projects/inventory, and
leads migrations. It creates tasks, site visits, knowledge articles, campaigns,
support requests, and notifications. Its composite foreign keys preserve
organization consistency for project and lead references. Its policies use
authenticated active membership and role checks. It grants only the columns
needed for inserts and updates; notably, organization ownership and creator
columns are not update-granted.

The activity migration precedes team management and the Command Center audit
RPC. The support-request table precedes the Command Center support RPC. No
duplicate table definition or conflicting RPC overload was found by static name
comparison. `list_developer_org_team(uuid)` appears twice intentionally: the
team/activity migration creates it, and the later team-directory migration
uses `create or replace function` to add the owner/admin role restriction.

Result: **PASS, repository SQL inspection**. Trigger execution and deployed
policy behavior remain **NOT TESTED**.

### Local and remote tool checks

The following commands were checked locally:

- `supabase`: unavailable.
- `docker`: unavailable.
- `psql`: unavailable.

No remote command, migration command, database connection, or credential
inspection was attempted. Therefore there is no evidence to populate a remote
migration-history comparison. Any difference between the repository and remote
history remains **suspected/unresolved**, not confirmed.

## Evidence and limitations

This report is based on repository inspection and local automated tests. No
production data was changed, no migration was pushed, and no database reset was
performed.

The repository contains `supabase/.temp/` linkage metadata, but that is not
evidence that the live schema was queried. The Supabase CLI, Docker, and `psql`
were not installed in the audit environment. There is also no
`supabase/config.toml`, generated database-types file, schema snapshot, or
checked-in migration-history table. Therefore live-schema comparison and
disposable-database migration execution are **BLOCKED**, not passed.

Environment variable names were inspected without printing values. The
tracked/modified `.env` file was not opened, copied, changed, removed, or
reported.

## Executive status

| Area | Status | Evidence | Severity / impact | Fix or next action |
|---|---|---|---|---|
| Supabase server client | PASS | `backend/lib/supabase.server.ts` uses the cookie-backed SSR client and publishable/anonymous credentials only. | High-impact boundary is preserved. | Keep server-only import boundary; verify configured values in deployment without exposing them. |
| Migration ordering from empty schema | PASS (repository-verified) | 13 timestamped migrations have dependencies in chronological order. | Required schema objects are defined before dependent objects. | Validate on a disposable local database when tooling is available. |
| Migration syntax execution | BLOCKED | No Supabase CLI, Docker, or `psql`. | SQL parser/database execution was not available. | Install/pin local Supabase tooling or provide a disposable database. |
| Migration replay/idempotence | FAIL (repository-verified) | Most migrations use plain `CREATE TABLE`, `CREATE FUNCTION`, and `CREATE POLICY` statements. | Reapplying an already-applied history will fail on duplicate objects. | Treat migrations as forward-only; use migration history. Do not rewrite applied history. |
| Generated database types | BLOCKED | No generated `database.types.ts` or equivalent was found. | TypeScript cannot prove exact remote column/RPC contracts. | Generate schema-only types from the verified target database. |
| Live schema comparison | BLOCKED | No authorized schema inspection was performed. | Remote drift, deployed RPC ACLs, and migration state remain unverified. | Run read-only catalog/RPC/RLS queries against the intended project. |
| Organization RLS | PASS (repository-verified) | Organization membership predicates are present on protected tables and RPCs. | Cross-tenant reads/writes are denied by design if deployed as written. | Verify runtime behavior with isolated test accounts. |
| Owner-only RPC authorization | PASS (repository-verified) | Metrics, audit, and support RPCs validate `auth.uid()`, fixed owner UUID, active owner role, and SQLSTATE `42501`. | Prevents ordinary users and developers from using Command Center RPCs. | Verify deployed function owner, ACL, and `search_path` remotely. |
| Local migration initialization | BLOCKED | Missing CLI/config/Docker/`psql`. | Cannot claim reproducible local database initialization. | Add local tooling/configuration in a separate approved task. |
| Backend referenced-object coverage | PASS (repository-verified) | Static comparison found every referenced table and RPC in the migration SQL. | No known repository-level missing table/function contract. | Verify deployed schema and signatures remotely. |
| Seed/schema-test coverage | NOT TESTED | No seed, schema snapshot, or committed database test harness exists in `supabase/`. | Fresh-data behavior and migration assertions are not automated locally. | Add disposable-environment verification separately. |

## Supabase client and authentication

### Client initialization

Evidence: [`backend/lib/supabase.server.ts`](../backend/lib/supabase.server.ts)

- Uses `@supabase/ssr` `createServerClient`.
- Reads `VITE_SUPABASE_URL`.
- Reads `VITE_SUPABASE_PUBLISHABLE_KEY`, falling back to
  `VITE_SUPABASE_ANON_KEY`.
- Uses TanStack Start server cookies.
- Sets `httpOnly`, `sameSite: "lax"`, `secure` in production, and `path: "/"`.
- Does not use a service-role key.
- The compatibility module at
  [`src/lib/supabase.server.ts`](../src/lib/supabase.server.ts) only re-exports
  the backend client.

Status: **PASS, repository-verified; live configuration NOT TESTED**.

### Authentication and authorization helpers

| Implementation | Responsibility | Repository result |
|---|---|---|
| [`backend/auth/developer-authentication.server.ts`](../backend/auth/developer-authentication.server.ts) | Verifies the Supabase session/user, loads memberships using the authenticated UUID, requires active membership, validates organization rows, and resolves a safe display name. | PASS |
| [`backend/auth/control-authentication.server.ts`](../backend/auth/control-authentication.server.ts) | Verifies the session and `mavros_staff_memberships`, requires the fixed owner UUID, active membership, and `owner` role; routes developer/public users separately. | PASS |
| [`backend/auth/public-authentication.server.ts`](../backend/auth/public-authentication.server.ts) | Sign-in, sign-up, sign-out, recovery, callback exchange, profile, and password flows. | PASS, live provider behavior NOT TESTED |
| [`backend/auth/control-auth-core.ts`](../backend/auth/control-auth-core.ts) | Pure owner authorization and post-login destination rules. | PASS |
| [`backend/auth/developer-auth-core.ts`](../backend/auth/developer-auth-core.ts) | Pure developer role/path and intended-organization checks. | PASS |

The shared `/login` route does not authorize by email alone. It uses the
server-returned role and destination, and restricts a `returnTo` value to the
same-origin `/app` path.

## Migration inventory

The actual migration directory is [`supabase/migrations/`](../supabase/migrations).
The 13 files are ordered lexicographically by timestamp:

| Migration | Purpose and objects | Dependencies |
|---|---|---|
| `20260617000000_create_mavros_staff_memberships.sql` | Creates `mavros_staff_memberships`, owner/staff role check, RLS, own-row select policy, authenticated select grant. | `auth.users` |
| `20260617000001_public_profiles_and_owner_auth.sql` | Extends staff roles to include `owner`; creates `profiles`, profile RLS/grants, profile creation/update trigger functions and triggers. | Staff table; `auth.users` |
| `20260617000002_provision_initial_mavros_owner.sql` | Verifies the fixed UUID belongs to `admin@mavros.com`, then upserts the owner membership. | Staff table; existing Auth user |
| `20261021000000_developer_organizations_and_memberships.sql` | Creates developer organizations and memberships, user-active index, RLS, and own-membership/active-organization policies. | `auth.users` |
| `20261021010000_developer_projects_and_inventory.sql` | Creates projects, towers, units, composite organization foreign keys, indexes, RLS, grants, and owner/admin policies. | Developer organizations/memberships |
| `20261021020000_developer_leads.sql` | Creates leads, constraints/indexes, RLS, assignee/member functions, lead policies, and timestamp trigger. | Projects, memberships, profiles, `auth.users` |
| `20261022001000_developer_team_and_activity.sql` | Creates activity events, team-list RPC, trigger-based activity recording, and project/unit/lead activity triggers. | Projects, units, leads, memberships, profiles |
| `20261022002000_developer_workflows.sql` | Creates tasks, visits, articles, campaigns, support requests, notifications, constraints/indexes, RLS, grants, policies, timestamps, and task-notification trigger. | Projects, leads, memberships, `auth.users` |
| `20261022003000_developer_team_management.sql` | Creates membership audit table and owner/admin-only membership-management RPC with last-owner protection. | Organizations, memberships, profiles, `auth.users` |
| `20261022004000_restrict_developer_team_directory.sql` | Replaces the team-list RPC policy so only active owners/admins can list the directory. | Team-list RPC from `20261022001000` |
| `20261025000000_owner_command_center_metrics.sql` | Creates owner-authorized aggregate metrics RPC. | Developer tables; staff memberships |
| `20261026000000_owner_command_center_security_audit.sql` | Creates owner-authorized audit RPC over activity and membership-audit tables. | Activity, membership-audit, organizations, profiles |
| `20261027000000_owner_command_center_support_requests.sql` | Creates owner-authorized support-request RPC with bounded summaries and status validation. | Support requests, organizations, profiles |

### Ordering review

Status: **PASS, repository-verified**.

- Auth/staff objects precede owner provisioning.
- Organizations/memberships precede projects, leads, workflows, and team
  management.
- Projects precede composite project foreign keys in leads/workflows.
- Activity and team-management objects precede Command Center audit RPCs.
- Support workflow objects precede the Command Center support RPC.
- The team-directory restriction intentionally replaces the earlier RPC after
  its creation.

### Replay and idempotence review

Status: **FAIL, repository-verified**.

The history is suitable as a forward-only migration chain, but it is not safe
to replay blindly. Examples include:

- Plain `CREATE TABLE` statements in the staff, project, lead, activity,
  workflow, and team-management migrations.
- Plain `CREATE FUNCTION` statements in several migrations.
- Policies that are created without a preceding `DROP POLICY`.
- Command Center RPCs created without `CREATE OR REPLACE FUNCTION`.

Some migrations intentionally use `if not exists`, `drop policy if exists`, or
`create or replace function`, but this is inconsistent. This is not a reason to
rewrite applied migrations. The required operational control is a valid
Supabase migration-history table and forward-only deployment process.

## Schema and backend contract inventory

| Backend operation group | Tables/RPCs | Required contract | Authorization | Tests |
|---|---|---|---|---|
| Developer session | `developer_organization_memberships`, `developer_organizations`, `profiles` | `organization_id`, `user_id`, `role`, `is_active`, organization `id/name/slug`, profile `full_name` | Authenticated UUID; active permitted membership; intended developer organization rule | [`developer-auth-core.test.ts`](../src/test/developer-auth-core.test.ts), full suite |
| Control session | `mavros_staff_memberships`, `profiles` | `user_id`, `role`, `is_active`, profile name | Exact owner UUID, active owner membership | [`control-auth-core.test.ts`](../src/test/control-auth-core.test.ts), [`control-authentication.test.ts`](../backend/tests/control-authentication.test.ts) |
| Projects/dashboard | `developer_projects`, `developer_project_units`, `developer_leads` | `organization_id`, statuses, IDs, project fields | Active organization membership; owner/admin writes | [`developer-data-core.test.ts`](../src/test/developer-data-core.test.ts), inventory/team tests |
| Inventory | Projects, towers, units | Composite organization/project/tower references and unit fields | Active membership; owner/admin writes | [`developer-inventory.server.test.ts`](../src/test/developer-inventory.server.test.ts) |
| Team directory | `list_developer_org_team(uuid)` | `user_id`, `role`, `is_active`, `full_name` | Active owner/admin in the requested organization | [`developer-team.server.test.ts`](../src/test/developer-team.server.test.ts) |
| Team mutations | `manage_developer_org_member(uuid, uuid, text, boolean)` | Target membership, role, active state | Active owner/admin; admin cannot manage owner; last owner protected | [`developer-team.server.test.ts`](../src/test/developer-team.server.test.ts) |
| Activity | `developer_activity_events`, `developer_team_membership_audit` | Event IDs, organization, actor, entity/action, timestamps | Organization member reads; owner Command Center RPC | [`control-security-audit.test.ts`](../src/test/control-security-audit.test.ts) |
| Leads | `developer_leads`, `developer_projects`, `list_developer_org_lead_assignees(uuid)`, `is_active_developer_org_member(uuid, uuid)` | Lead columns, statuses, assignment, follow-up fields | Active member reads; owner/admin/sales writes with assignment rules | [`developer-leads-core.test.ts`](../src/test/developer-leads-core.test.ts) |
| Workflows | Tasks, visits, articles, campaigns | Organization fields, status checks, composite project/lead references | Role-specific organization membership | [`workspace-data.server.test.ts`](../src/test/workspace-data.server.test.ts), [`workspace-data-core.test.ts`](../src/test/workspace-data-core.test.ts) |
| Support | `developer_support_requests` and owner support RPC | Subject/message/status/timestamps; bounded summary | Members create/read own; owner/admin update; owner Command Center review | [`control-support-requests.test.ts`](../src/test/control-support-requests.test.ts), workspace tests |
| Notifications | `developer_notifications` | Recipient, organization, task entity, read timestamp | Recipient-only organization access | Workspace service and workflow migration |
| Command Center metrics | `get_mavros_command_center_metrics()` | Seven bigint aggregate columns | Exact active owner | [`command-center-metrics-migration.test.ts`](../src/test/command-center-metrics-migration.test.ts), dashboard tests |
| Command Center audit | `list_mavros_command_center_security_audit(text, integer)` | Bounded event projection and category/limit validation | Exact active owner | Security audit and integration tests |
| Command Center support | `list_mavros_command_center_support_requests(text, integer)` | Bounded request projection and status/limit validation | Exact active owner | Support and integration tests |

The mapping is repository-consistent. Exact remote types, function ownership,
ACLs, and deployed return shapes remain **BLOCKED** until a live catalog query
or generated schema types are available.

## RLS, grants, and SECURITY DEFINER review

### RLS

Status: **PASS, repository-verified; runtime NOT TESTED**.

Protected application tables enable RLS and revoke broad table privileges.
Organization-owned policies consistently use:

```sql
membership.organization_id = <row>.organization_id
and membership.user_id = (select auth.uid())
and membership.is_active
```

Role-specific writes add owner/admin/marketing/sales restrictions as
appropriate. Composite foreign keys prevent a project, lead, tower, or visit
from referencing a record in another organization.

### SECURITY DEFINER functions

Repository review found these protected functions:

- Profile trigger functions.
- `is_active_developer_org_member`.
- `list_developer_org_lead_assignees`.
- `list_developer_org_team`.
- `record_developer_activity_event`.
- `manage_developer_org_member`.
- `get_mavros_command_center_metrics`.
- `list_mavros_command_center_security_audit`.
- `list_mavros_command_center_support_requests`.

Repository evidence shows `set search_path = ''` on the security-sensitive
functions, schema-qualified table references, and restricted execute grants.
Owner Command Center RPCs re-check `auth.uid()`, fixed owner UUID, active owner
role, and reject unauthorized calls with SQLSTATE `42501`.

The two developer assignee/list functions authorize an active member in the
requested organization; they are not owner-only functions by design. The team
directory restriction migration narrows directory listing to active owner/admin
members.

Status: **PASS, repository-verified; deployed owner/ACL verification NOT TESTED**.

### Potential deployment verification

The following must be checked read-only against the intended Supabase project:

- `pg_proc.prosecdef` for each security-sensitive function.
- Function owner and `proconfig`/`search_path`.
- `pg_proc` identity arguments and return columns.
- `information_schema.role_routine_grants`.
- `pg_policies`, `pg_class.relrowsecurity`, and table grants.
- Supabase migration-history rows.

## Backend query and RPC findings

### PASS findings

- Backend services use the server-only cookie-backed Supabase client.
- Organization IDs are validated by server-function schemas and checked
  against the authenticated session memberships.
- Queries retain explicit organization predicates.
- Mutations validate role and assignment constraints before writes.
- Lead, visit, task, campaign, and inventory foreign references are either
  checked in application code or enforced by composite database constraints.
- Owner Command Center access is independently rechecked in every server
  helper.
- Unsupported jobs, billing, and feature-flag integrations are represented as
  unavailable rather than fabricated data.

### BLOCKED findings

- No generated database types exist, so the repository cannot statically prove
  all nullable/default/type details against the deployed schema.
- No local database was available for applying migrations and exercising RLS.
- No live RPC signature/privilege comparison was performed.
- No live data isolation test was run against separate accounts.

### NOT TESTED findings

- Password recovery and callback behavior against the actual Supabase Auth
  service.
- Runtime trigger execution and notification creation.
- Runtime behavior of `SECURITY DEFINER` functions under anonymous,
  authenticated-unmember, inactive-member, and non-owner sessions.
- Exact deployed migration history and drift.

## Local migration validation

Status: **BLOCKED**.

Unavailable prerequisites:

- Supabase CLI
- Docker
- PostgreSQL `psql`
- `supabase/config.toml`
- Disposable local Postgres/Supabase instance

No production fallback was attempted. The exact prerequisite is a pinned local
Supabase CLI/Docker environment or a disposable Postgres environment containing
the required Supabase Auth schema. Once available, the safe sequence is:

1. Initialize a disposable local target explicitly.
2. Apply the repository migrations forward from an empty schema.
3. Inspect tables, columns, foreign keys, indexes, functions, grants, RLS, and
   policies.
4. Run isolated authorization tests using non-production accounts.
5. Destroy only the disposable local target.

## Repository validation performed

- Full Vitest suite: **124 tests passed across 20 files**.
- Application TypeScript: **passed**.
- Backend TypeScript: **passed**.
- Focused backend/auth/route ESLint: **passed**.
- Production build: **passed**.
- `git diff --check`: **passed**.
- Repository-wide ESLint: **FAIL**, due to pre-existing CRLF/Prettier
  violations in unrelated dirty files; no broad formatting cleanup was run.

## Answers to required questions

1. **Is the Supabase client configured correctly?**  
   Repository configuration is structurally correct and uses the SSR client
   with publishable/anonymous credentials. Actual deployment values and live
   connectivity were not verified.

2. **Are all backend queries consistent with the expected schema?**  
   They are consistent with the repository migrations by static inspection.
   This is not live-schema proof because generated types and remote catalog
   access were unavailable.

3. **Are migrations complete, ordered, and reproducible?**  
   They are ordered and sufficient to describe the repository schema from an
   empty starting point. Replay/idempotence is not guaranteed, and execution
   reproducibility is blocked without local Supabase tooling.

4. **Are RLS policies and RPC permissions safe?**  
   They are safe by repository inspection: RLS is enabled, organization
   predicates are present, owner RPCs authorize internally, and broad execute
   privileges are revoked. Deployed ACL and runtime behavior remain unverified.

5. **Can the database be initialized locally from migration history?**  
   Not verified. The required CLI, Docker, PostgreSQL client, and local config
   are unavailable.

6. **Does the live Supabase schema match the repository?**  
   Not tested. The linked-project metadata is not a schema inspection.

7. **Which migration issues remain unresolved?**
   - No local execution or syntax validation environment.
   - No remote migration-history/catalog/RLS/RPC comparison.
   - No generated database types.
   - Most migrations are not replay-safe; forward-only migration history must
     be preserved.
   - The initial owner-provisioning migration depends on the exact Auth UUID and
     email existing before it runs.
   - `.env` remains a tracked/modified secrets-management risk requiring a
     separate approved remediation.

## Recommended next actions

1. Install/pin Supabase CLI and Docker in a controlled development environment.
2. Add or restore a reviewed `supabase/config.toml` without embedding secrets.
3. Apply the migration chain only to a disposable local database.
4. Generate schema-only TypeScript types from the verified target.
5. Run read-only catalog checks against the intended remote project.
6. Run isolated runtime RLS/RPC tests with anonymous, unmember, inactive-member,
   developer-member, admin, and owner accounts.
7. Do not rewrite or renumber existing migrations to solve replay behavior.
