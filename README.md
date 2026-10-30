# Mavros RealtyAI

Mavros RealtyAI is a real-estate sales platform built with React and TanStack
Start. TanStack Start remains the frontend full-stack runtime, and the
repository also contains an independently runnable Node.js backend boundary.

## Development

You need Node.js and npm.

```sh
git clone <this-repository-url>
cd <repository-name>
npm install
npm --prefix frontend install
npm --prefix backend install
```

Run the frontend and backend independently:

```powershell
# terminal 1
npm run dev:frontend

# terminal 2
npm run dev:backend
```

The frontend is served at `http://localhost:5173`. The standalone backend
listens at `http://localhost:3001` by default and currently exposes only the
implemented `GET /health` endpoint. Set `PORT` and `FRONTEND_ORIGIN` in a
backend-only environment when needed; the backend does not read the root
`.env`.

Run checks from the repository root:

```sh
npm run test:frontend
npm run test:backend
npm run typecheck:frontend
npm run typecheck:backend
npm run build:frontend
npm run build:backend
```

Frontend lint is available with `npm --prefix frontend run lint`. The backend
package currently has no lint configuration or lint script; its typecheck and
tests are the available static/runtime checks.

## Server-side application structure

Reusable server-only application code is being extracted incrementally into [`backend/`](./backend/):

- `backend/lib/` contains server-only integrations such as the cookie-backed Supabase client.
- `backend/services/` is the extraction boundary for authentication and organization data services.
- `backend/middleware/` contains server request types and future server middleware boundaries.
- `backend/types/` contains server-side contracts that must not depend on browser components.
- `backend/tests/` contains backend boundary tests.

TanStack route declarations and server-function adapters remain under
`frontend/src/routes/`, `frontend/src/lib/`, and
`frontend/src/developer-portal/` because TanStack Start requires those paths for
route generation. Existing `*.server.ts` compatibility modules re-export
extracted implementations. The migration map is documented in
[`docs/frontend-backend-migration-map.md`](./docs/frontend-backend-migration-map.md).

# Authentication and owner Command Center

Public accounts use Supabase Auth and cookie-backed server sessions. The server reuses the existing `VITE_SUPABASE_URL` plus `VITE_SUPABASE_ANON_KEY`; the latter can hold an `sb_publishable_` key. `VITE_SUPABASE_PUBLISHABLE_KEY` is also supported. `VITE_APP_URL` is optional for deployments that need a canonical recovery origin. No service-role key is used by the application.

Developer workspace UI is grouped under `frontend/src/developer-portal/`;
TanStack route declarations remain in `frontend/src/routes/`, and shared
sample records remain in `frontend/src/lib/demo-data.ts`.

Developer Portal access is separate from Mavros staff access. The migration `20261021000000_developer_organizations_and_memberships.sql` adds organization records and organization-scoped memberships with read-only own-membership RLS for authenticated users. The application never creates or changes memberships. `/app` and its nested routes verify the authenticated Supabase user and an active supported membership on the server. The configured initial developer UUID is checked against `auth.users` only during the manual privileged provisioning step below; knowing the UUID does not grant access. Until an organization switcher exists, multi-organization route access uses the intersection of membership permissions, so a more privileged role in one organization cannot elevate access across all of a user's organizations.

Current section access is: `owner` and `admin` can access all sections; `marketing` can access projects, inventory, knowledge base, AI Advisor, Creative Studio, campaigns, analytics, and help; `sales` can access projects, inventory, knowledge base, leads, conversations, site visits, and help; `analyst` can access projects, inventory, campaigns, analytics, and help. These checks protect navigation only; no tenant-owned business operations are connected yet.

The repository has no developer project, inventory, lead, site-visit, campaign, or analytics tables or corresponding RLS policies. Those pages therefore show an explicit not-connected state rather than sample/demo records as live organization data. The developer overview and team screen show the verified organization memberships only.

## Supabase integration verification

The authentication and database paths use the publishable Supabase key,
cookie-backed `@supabase/ssr` sessions, organization membership checks, RLS,
and the RPCs defined in `supabase/migrations/`. This repository currently has
no safe isolated Supabase database available for automated end-to-end testing:
the local CLI and Docker are installed, but `supabase/.temp/` already contains
linked-project metadata and starting the local stack may rewrite protected
metadata. No local stack or remote project was started during verification.

The checked-in automated coverage is therefore mock-based for Supabase
authentication failures, missing sessions, signup/recovery redirects, callback
exchange failures, sign-out failures, password updates, own-profile updates,
organization authorization, database error mapping, and HTTP boundary errors.
It does not prove hosted Auth, session cookies, RLS, RPC execution, or database
constraints. To perform the real integration check, use a disposable local
Supabase project or an explicitly authorized isolated project, then run:

```powershell
supabase start
npm run test:frontend
npm run test:backend
```

Exercise signup, email confirmation, login, logout, recovery callback,
password reset, profile update, owner/developer authorization, cross-user
profile access, organization-scoped project/lead/workflow operations, RLS
denials, RPC calls, and expired sessions. Do not use the production project,
service-role credentials, or apply migrations without authorization.

Public routes are `/login`, `/signup`, `/profile`, `/forgot-password`, `/reset-password`, and `/auth/callback`. The homepage navbar shows the signed-in user's profile name with Profile and Sign Out actions. `/profile` reads identity from the verified server session and only that user's profile row. The single `/login` form redirects the explicitly provisioned owner to `/control` and ordinary users to `/`; a membership lookup error is shown instead of falling back to a normal-user redirect. `/control/login` is a compatibility redirect to `/login`. Public signup never provisions owner access. An Auth database trigger creates each new user's `public.profiles` record from the name supplied at signup. RLS permits a user to select and update only their own profile name; users cannot insert profiles or update their ID, role, or creation timestamp.

The private owner routes are `/control` and `/control/access-denied`. The Command Center checks the Supabase Auth user and an active `owner` row in `public.mavros_staff_memberships` on the server. Dashboard data calls repeat that check. Email addresses and user-editable Auth metadata never grant owner access. Membership changes are deliberately not available through the app's public UI/API.

## Apply database migrations

Hosted migration status is not verified by this code change. A previous read-only, zero-row query through the public Supabase API returned PostgREST `PGRST205` for the expected `public.profiles` and `public.mavros_staff_memberships` columns at that time; the hosted project may have changed since. Check Supabase Dashboard schema and migration history before applying anything. Apply only missing migrations, in filename order; do not blindly rerun applied migrations.

If any of the existing migrations are missing, apply only those migrations in the Supabase SQL Editor or your established migration workflow. The new developer membership migration is:

1. [`supabase/migrations/20260617000000_create_mavros_staff_memberships.sql`](./supabase/migrations/20260617000000_create_mavros_staff_memberships.sql)
2. [`supabase/migrations/20260617000001_public_profiles_and_owner_auth.sql`](./supabase/migrations/20260617000001_public_profiles_and_owner_auth.sql)
3. [`supabase/migrations/20261021000000_developer_organizations_and_memberships.sql`](./supabase/migrations/20261021000000_developer_organizations_and_memberships.sql)

The second migration creates `public.profiles`, its own-row RLS policies, restricted column grants, the new-user profile trigger, and allows the `owner` membership role while retaining legacy role values. Application authorization accepts only `role = 'owner'` and `is_active = true`. Profile data is not subscribed to Realtime; the navbar refreshes the server-verified session and own-profile name on window focus and periodically while open. Operational services (billing, jobs, audit history, feature flags and support) have no backing tables/services in this repository; their Command Center sections explicitly show “Not connected,” not invented metrics. The tenant list is illustrative demo data.

## Provision the first owner

The initial owner migration is [`supabase/migrations/20260617000002_provision_initial_mavros_owner.sql`](./supabase/migrations/20260617000002_provision_initial_mavros_owner.sql). It matches the explicitly supplied UUID and email against `auth.users` inside the database, aborts without writing if they do not match, and idempotently upserts only that UUID as active `owner`. It does not grant privileges to arbitrary signups. Run it only after the schema migrations and after verifying the Auth user in the Dashboard. The migration is not applied by this repository change.

Membership table access is read-only for authenticated users and scoped to their own record; only a trusted Supabase administrator using the Dashboard/SQL Editor should provision or revoke an owner.

To independently verify the account before applying the owner migration, run this read-only query in Supabase SQL Editor:

```sql
select id, email
from auth.users
where id = 'f2c67a31-2b22-4ba9-86bd-91e9977b4955'::uuid;
```

Confirm the returned row's email is `admin@mavros.com`. The owner migration repeats this exact identity check before granting access, so a missing/mismatched account aborts rather than provisioning.

## Configure Supabase Auth URLs and test

In **Authentication → URL Configuration**, set the Site URL and allow the app's `/auth/callback`, `/reset-password`, and `/control/reset-password` URLs. For local development, allow `http://localhost:5174/auth/callback`, `http://localhost:5174/reset-password`, and `http://localhost:5174/control/reset-password`. Configure email confirmation in Supabase Auth according to your account policy.

- Create a normal user at `/signup`; when confirmation is enabled, complete the emailed link. The profile is inserted by the database trigger.
- Sign in at `/login`; an ordinary user lands on `/`, while the verified active owner goes to `/control`.
- The owner uses the same `/login` form. `/control/login` redirects there for existing bookmarks.
- Developer organization owners and team members use the same `/login` form and are redirected to `/app` only after their active organization membership is verified. Normal public users still return to `/`.
- Apply `supabase/migrations/20261021000000_developer_organizations_and_memberships.sql` before developer login can be classified. It does not create an organization or grant a membership.
- Use the appropriate forgot-password page; verify its configured email reaches `/auth/callback` and then the corresponding reset form.

These flows require the SQL migrations, Supabase URL allow-list, email delivery/settings, and real project accounts to validate end-to-end. This code change does not claim those hosted settings or migrations have been applied.

### Provision the initial developer owner

After confirming the developer membership migration has been applied, use the Supabase SQL Editor with a privileged database role:

1. Verify the intended existing Auth identity. This must return exactly one row with the expected UUID and email:

   ```sql
   select id, email
   from auth.users
   where id = 'ba27d990-a1cc-4f52-896d-62decbc04828'
     and lower(email) = lower('developer@mavros.com');
   ```

   If it returns no row, stop: do not provision. This repository cannot verify the hosted Auth account without executing this query.

2. Select the intended developer organization. Review existing rows:

   ```sql
   select id, name, slug
   from public.developer_organizations
   order by name;
   ```

   If the correct organization is absent, create it using the organization's approved name and unique slug. The ID is generated by the database; do not make one up:

   ```sql
   insert into public.developer_organizations (name, slug)
   values ('<approved organization name>', '<approved-unique-slug>')
   returning id, name, slug;
   ```

3. After confirming the correct organization, replace `<selected-organization-uuid>` below with the ID returned above. This block rechecks the Auth UUID/email and organization before granting only this account the owner role:

   ```sql
   do $$
   declare
     verified_user_id uuid;
     selected_organization_id uuid := '<selected-organization-uuid>';
   begin
     select id
     into verified_user_id
     from auth.users
     where id = 'ba27d990-a1cc-4f52-896d-62decbc04828'
       and lower(email) = lower('developer@mavros.com');

     if verified_user_id is null then
       raise exception 'Expected developer Auth user UUID/email pair was not found';
     end if;

     if not exists (
       select 1 from public.developer_organizations
       where id = selected_organization_id
     ) then
       raise exception 'Selected developer organization does not exist';
     end if;

     insert into public.developer_organization_memberships
       (organization_id, user_id, role, is_active)
     values
       (selected_organization_id, verified_user_id, 'owner', true)
     on conflict (organization_id, user_id)
     do update set role = 'owner', is_active = true;
   end
   $$;
   ```

   Finally, verify the membership by joining `auth.users`, `developer_organizations`, and `developer_organization_memberships`:

   ```sql
   select
     auth_user.id,
     auth_user.email,
     organization.id as organization_id,
     organization.name as organization_name,
     membership.role,
     membership.is_active
   from auth.users auth_user
   join public.developer_organization_memberships membership
     on membership.user_id = auth_user.id
   join public.developer_organizations organization
     on organization.id = membership.organization_id
   where auth_user.id = 'ba27d990-a1cc-4f52-896d-62decbc04828'
     and lower(auth_user.email) = lower('developer@mavros.com');
   ```

   Never run the grant block before the user and organization checks succeed. No service-role credential belongs in the application.
