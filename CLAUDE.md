# Aquashell — Developer Reference

## Repository layout

```
pisiculture_app/
├── packages/shared/         # Domain engine (TypeScript, pure functions, event sourcing)
├── apps/mobile-app/         # Expo SDK 51 + expo-router v3 + expo-sqlite (offline-first)
├── apps/web-dashboard/      # Next.js 14 App Router + Supabase SSR (server components)
└── db/migrations/           # Flyway SQL — V001–V008 schema, V009 dev seed
```

## Running locally

```bash
npm install          # install all workspace dependencies from repo root
```

### Shared domain tests

```bash
cd packages/shared
npm run build && npm test   # Node.js built-in test runner (node:test)
```

### Mobile app

```bash
cd apps/mobile-app
npx expo start       # scan QR with Expo Go or run on simulator
```

### Web dashboard

```bash
cd apps/web-dashboard
npm run dev          # http://localhost:3000
npm run typecheck    # tsc --noEmit
```

## Environment variables

Neither app crashes without Supabase — they enter **demo mode** with hardcoded seed data.

| App | Variable | Notes |
|-----|----------|-------|
| mobile | `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| mobile | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| web | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| web | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

Never hardcode these values — always use environment variables.

## Database migrations

Run in order V001 → V008 for schema, then optionally V009 for dev seed data (skip in production).

```bash
flyway -url=jdbc:postgresql://HOST/DB -user=USER -password=PASS migrate
```

| File | Purpose |
|------|---------|
| V001 | Base schema: tenants, usuarios, fincas |
| V002 | Estanques, lotes |
| V003 | evento_operativo (append-only, immutable trigger) |
| V004 | Insumos catalogue + aplic_insumos |
| V005 | RBAC — aquashell_app role with minimal privileges |
| V006 | Supabase auth integration: auth_uid column, fn_get_tenant_id(), updated RLS |
| V007 | Performance indexes + v_lote_activo view |
| V008 | Monitoring views: v_sync_pendiente, v_retiro_vigente |
| V009 | Dev seed — two farms, three ponds, pilot users (skip in production) |

## Architecture

### Event sourcing

All field-worker operations are stored as immutable `OperationalEvent` rows in `evento_operativo` (Supabase) / `evento_local` (SQLite). State is never stored — it is always derived:

```typescript
import { projectLote } from '@aquashell/shared';
const state = projectLote(events);   // LoteState | null
```

### Corrections without mutation

Coordinators fix data by appending a `CORRECCION_REGISTRADA` event that references the original event's id. `projectLote()` pre-scans corrections and merges them before processing each event — the original event is never modified.

### Offline-first sync (mobile)

1. Events are saved locally (`saveEvent` → SQLite) with `sync_status='pending'`
2. `SyncBanner` triggers `syncPendingEvents()` + `pullMasterData()` in parallel
3. `syncPendingEvents` pushes pending rows to Supabase, then pulls any events recorded remotely (e.g. by another device) that are missing locally

### Multi-tenant RLS

All tables are protected by row-level security. After V006, policies use `fn_get_tenant_id()` which resolves the Supabase JWT (`auth.uid()`) to a tenant id via the `usuarios.auth_uid` column. The service role bypasses RLS.

## Active development branch

```
claude/continue-control-app-ex4AS
```

Standard `git push` is blocked in the managed environment. File changes are pushed via the GitHub Contents API (Python `urllib.request` PUT to `/repos/{owner}/{repo}/contents/{path}`), followed by `git fetch origin && git reset --hard origin/<branch>` to sync the local clone.
