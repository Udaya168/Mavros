# Frontend/backend migration map

This map records the application files relocated from the legacy root layout
and the ownership boundary used by the migrated tree. Dependencies, generated
output, `.env`, and `supabase/.temp/` are intentionally excluded.

## Legacy application files

| Legacy path | Migrated path | Owner |
|---|---|---|
| `components.json` | `frontend/components.json` | Frontend |
| `eslint.config.js` | `frontend/eslint.config.js` | Frontend |
| `tsconfig.json` | `frontend/tsconfig.json` | Frontend |
| `vite.config.ts` | `frontend/vite.config.ts` | Frontend |
| `vitest.config.ts` | `frontend/vitest.config.ts` | Frontend |
| `bun.lock` | `frontend/bun.lock` | Frontend |
| `public/favicon.ico` | `frontend/public/favicon.ico` | Frontend |
| `public/robots.txt` | `frontend/public/robots.txt` | Frontend |
| `src/assets/amenity-clubhouse.jpg` | `frontend/src/assets/amenity-clubhouse.jpg` | Frontend |
| `src/assets/amenity-coworking.jpg` | `frontend/src/assets/amenity-coworking.jpg` | Frontend |
| `src/assets/amenity-jogging.jpg` | `frontend/src/assets/amenity-jogging.jpg` | Frontend |
| `src/assets/amenity-kids.jpg` | `frontend/src/assets/amenity-kids.jpg` | Frontend |
| `src/assets/amenity-pool.jpg` | `frontend/src/assets/amenity-pool.jpg` | Frontend |
| `src/assets/garden.jpg` | `frontend/src/assets/garden.jpg` | Frontend |
| `src/assets/interior.jpg` | `frontend/src/assets/interior.jpg` | Frontend |
| `src/assets/pool.jpg` | `frontend/src/assets/pool.jpg` | Frontend |
| `src/assets/residence-2bhk.jpg` | `frontend/src/assets/residence-2bhk.jpg` | Frontend |
| `src/assets/residence-3bhk.jpg` | `frontend/src/assets/residence-3bhk.jpg` | Frontend |
| `src/assets/residence-balcony.jpg` | `frontend/src/assets/residence-balcony.jpg` | Frontend |
| `src/assets/residence-bedroom.jpg` | `frontend/src/assets/residence-bedroom.jpg` | Frontend |
| `src/assets/sales.jpg` | `frontend/src/assets/sales.jpg` | Frontend |
| `src/components/back-button.tsx` | `frontend/src/components/back-button.tsx` | Frontend |
| `src/components/site-chrome.tsx` | `frontend/src/components/site-chrome.tsx` | Frontend |
| `src/components/ui/*` | `frontend/src/components/ui/*` | Frontend |
| `src/hooks/use-mobile.tsx` | `frontend/src/hooks/use-mobile.tsx` | Frontend |
| `src/integrations/supabase/*` | `frontend/src/integrations/supabase/*` | Frontend |
| `src/lib/demo-data.ts` | `frontend/src/lib/demo-data.ts` | Frontend |
| `src/lib/error-capture.ts` | `frontend/src/lib/error-capture.ts` | Frontend |
| `src/lib/error-page.ts` | `frontend/src/lib/error-page.ts` | Frontend |
| `src/lib/lovable-error-reporting.ts` | `frontend/src/lib/lovable-error-reporting.ts` | Frontend |
| `src/lib/utils.ts` | `frontend/src/lib/utils.ts` | Frontend |
| `src/routeTree.gen.ts` | `frontend/src/routeTree.gen.ts` | Frontend |
| `src/router.tsx` | `frontend/src/router.tsx` | Frontend |
| `src/routes/*` | `frontend/src/routes/*` | Frontend |
| `src/styles.css` | `frontend/src/styles.css` | Frontend |
| `src/test/*` | `frontend/src/test/*` | Frontend |
| `src/server.ts` | `frontend/src/server.ts` | TanStack Start |
| `src/start.ts` | `frontend/src/start.ts` | TanStack Start |

The wildcard rows above are complete directory transfers: every file under
the listed legacy directory is present under the corresponding `frontend/`
directory, including the generated route tree and test fixtures.

## Server ownership split

| Legacy server concern | Backend implementation | Frontend integration surface |
|---|---|---|
| Supabase server client | `backend/lib/supabase.server.ts` | `frontend/src/lib/supabase.server.ts` adapter |
| Control authorization core | `backend/auth/control-auth-core.ts` | `frontend/src/lib/control-auth-core.ts` adapter |
| Developer authorization core | `backend/auth/developer-auth-core.ts` | `frontend/src/lib/developer-auth-core.ts` adapter |
| Public authentication | `backend/auth/public-authentication.server.ts` | `frontend/src/lib/public-auth.server.ts` adapter |
| Control authentication | `backend/auth/control-authentication.server.ts` | `frontend/src/lib/control-auth.server.ts` adapter |
| Developer authentication | `backend/auth/developer-authentication.server.ts` | `frontend/src/lib/developer-auth.server.ts` adapter |
| Developer data | `backend/services/developer-data.server.ts` | `frontend/src/developer-portal/developer-data.server.ts` adapter |
| Lead data | `backend/services/leads-data.server.ts` | `frontend/src/developer-portal/leads-data.server.ts` adapter |
| Workspace data | `backend/services/workspace-data.server.ts` | `frontend/src/developer-portal/workspace-data.server.ts` adapter |
| Request context | `backend/middleware/request-context.ts` | Backend-only |
| Backend contracts | `backend/types/*` | Backend-only |

Adapters are deliberately retained in `frontend/` because TanStack Start
server functions import them while building the frontend server bundle. They
remain server-only through `.server.ts` naming and dynamic server imports; no
backend implementation is imported by browser-facing modules.

## Database and shared ownership

- `drizzle/*` was retired from the application root; the authoritative
  migrations are under `supabase/migrations/`, with Supabase configuration
  under `supabase/config.toml`.
- `shared/developer-portal/*-core.ts` contains browser-safe schemas and
  authorization helpers used by both frontend validators and backend services.
- Root `package.json` is now an orchestration manifest. Frontend and backend
  lockfiles and package manifests remain in their respective directories.

## Routing, aliases, and environment decisions

- TanStack route discovery remains rooted at `frontend/src/routes`; the
  generated tree remains `frontend/src/routeTree.gen.ts`.
- `@/*` resolves to `frontend/src/*`; `@shared/*` resolves to `shared/*`.
- Vite uses `envDir: ".."` so the existing repository-root `.env` remains the
  source for frontend `VITE_*` variables after moving the Vite project into
  `frontend/`.
- Frontend Supabase and app variables remain `VITE_*` variables consumed by
  TanStack server functions. The standalone backend only reads `PORT` and
  `FRONTEND_ORIGIN` and never reads the root `.env`.
- Existing authenticated features continue using TanStack Start server
  functions. The independent Node process exposes only the implemented,
  tested `GET /health` endpoint; no duplicate authentication or placeholder
  REST business API was introduced.
