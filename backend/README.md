# Backend boundary

The backend can also run as an independent Node.js HTTP process:

```powershell
cd C:\Users\ASUS\Downloads\Mavros\backend
npm install
npm run dev
```

It listens on port `3001` by default and exposes `GET /health`. Set
`PORT` and `FRONTEND_ORIGIN` in a backend-only environment when needed; neither
variable is required for the defaults. The backend does not read the root
`.env` file.

The application remains a TanStack Start full-stack application. This directory
contains reusable server-only authentication, authorization, Supabase access,
and Developer Portal data services; it is not a second HTTP server.

## Current structure

- `auth/` contains server authentication and authorization implementations.
- `lib/` contains the cookie-backed server Supabase client.
- `services/` contains organization-scoped Developer Portal data access.
- `types/` contains shared backend types.
- `middleware/` contains server request context helpers.
- `tests/` contains backend boundary tests.

TanStack server-function adapters and route declarations remain under
`frontend/src/`. The adapters in `frontend/src/developer-portal/*.server.ts` re-export the corresponding
service implementation so existing route imports remain stable.

The service implementations intentionally import browser-safe validation
schemas from `shared/developer-portal/*-core.ts`. Those modules contain no server
client, cookie, environment-secret, or database access and are also used by
the TanStack server-function input validators.

All Developer Portal services authenticate through the verified Supabase session,
check active organization membership, and retain organization predicates on
database queries and RPC calls. They use the publishable/anonymous Supabase
server client and never use a service-role credential.

The current frontend has no direct REST API calls to migrate. Its authenticated
operations continue to use TanStack Start server functions, while the
standalone process provides an independent health endpoint without duplicating
those business operations.
