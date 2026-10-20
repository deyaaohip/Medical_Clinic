# Base44 sandbox setup notes

Non-obvious things learned while making this repo run in the Base44 sandbox.
Read this before changing the run setup.

## Running the app

```bash
docker compose -f docker-compose.base44.yml up -d --remove-orphans
docker compose -f docker-compose.base44.yml ps
curl -s http://localhost:3000/api/health                   # {"ok":true}
```

- Two services only: `db` (Postgres 16) and `web` (Next.js 16 dev server, Turbopack).
  Both are long-running and healthchecked; there are no one-shot containers.
- `web` is a plain `node:22-bookworm-slim` image with the repo bind-mounted, so edits
  apply without rebuilding. Host port 3000 is the preview entry point.
- Postgres credentials are inline in the compose file (local infra only); data persists
  in the `pgdata` volume.

## Startup sequence inside the `web` service

The container command does everything setup-related before `exec next dev`, which keeps
every container long-running (an exited one-shot job looks like a failure to the
platform health check):

1. `npm ci` from the lockfile — **only** when `node_modules` is missing or when
   `package-lock.json` no longer matches the stamp in `node_modules/.base44-lock`.
   A plain restart therefore never wipes dependencies under a running dev server.
   After editing `package.json`/`package-lock.json`, just restart `web`; the stamp
   check reinstalls. Force it with
   `docker compose -f docker-compose.base44.yml up -d --force-recreate web`.
2. `drizzle-kit push` from `src/db/schema.ts` — the repo ships **no migration files**
   (`*.sql` is gitignored), so the schema is pushed. `drizzle.config.json` contains a
   **masked** URL, hence `--url="$DATABASE_URL"` is passed explicitly.
3. Seeding through `npx tsx src/db/runSeedScript.ts`, guarded by a row count on
   `tenants`: it runs **only into an empty database**. The seed inserts timestamped
   orders, so re-running it on populated data duplicates records.
   `tsx` comes from the lockfile (transitive via drizzle-kit), so no extra dependency.
4. `next dev --hostname 0.0.0.0 --port 3000`.

## Database and demo data

- Seeded personas (demo login needs no password; all use the mock hash):
  `admin@medsaas.com` (super admin), `dr.ahmed@alshifaclinic.ae`,
  `reception@alshifaclinic.ae`, `dr.sarah@apexhealth.com`.
  Tenant slugs: `al-shifa`, `apex-health`.
- Do not add another seeding container: seeding is idempotent by the guard above.

## Preview-only configuration

- `next.config.ts` appends `3000-$BASE44_PUBLIC_HOST_SUFFIX` to `allowedDevOrigins`
  **only when `BASE44_PREVIEW_MODE === "1"`**, because Next gates dev assets/HMR by the
  preview origin. With the flag unset the config is unchanged.
- `BASE44_PREVIEW_MODE` and `BASE44_PUBLIC_HOST_SUFFIX` are passed to the `web` service.
- `.env.base44-defaults` holds a development placeholder `JWT_SECRET`; it is loaded
  before `/run/base44/app.env` so a real value supplied by the user wins.

## Verifying

- `curl -s http://localhost:3000/api/health` → `{"ok":true}` (queries Postgres).
- Home `/` lists subscription plans and demo persona cards (needs seeded data).
- Demo login: "Launch Super Admin Console" → `/super-admin`; "Enter Physician Persona"
  → `/al-shifa/dashboard`; sidebar "Master Patient" → `/al-shifa/patients`.
- Typecheck / lint inside the container:
  `docker compose -f docker-compose.base44.yml exec web npx tsc --noEmit`.
- Fixed quirk worth knowing: `/api/auth/demo-login` receives tenant **slugs** from the UI
  but sessions store tenant **UUIDs**; the route resolves slug-or-id before signing the
  token. Passing the raw slug into the session used to raise
  `invalid input syntax for type uuid`.
