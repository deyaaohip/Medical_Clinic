# Base44 sandbox setup notes

Non-obvious things learned while making this repo run in the Base44 sandbox.
Read this before changing the run setup.

## Running the app

```bash
docker compose -f docker-compose.base44.yml up -d          # db + deps + migrate, then web + seed
docker compose -f docker-compose.base44.yml ps
curl -s http://localhost:3000/api/health                   # {"ok":true}
```

- The preview is Next.js 16 in **dev mode** (`next dev`, Turbopack) on host port 3000,
  bind-mounting the repo, so edits apply without rebuilding.
- `node_modules` lives in the `node_modules` Docker volume. The `deps` service runs
  `npm ci` only when `package-lock.json` changed (stamp file `node_modules/.base44-lock`),
  so a plain restart never wipes dependencies under the running dev server.
  After editing `package.json`/`package-lock.json`, force it:
  `docker compose -f docker-compose.base44.yml up -d --force-recreate deps web`
- Postgres 16 runs as the `db` service; credentials are inline in the compose file
  (local infra only). Data persists in the `pgdata` volume.

## Database: schema is pushed, not migrated

- The repo has **no migration files** (`*.sql` is gitignored). The `migrate` service
  runs `drizzle-kit push` from `src/db/schema.ts` before the web app starts.
- `drizzle.config.json` contains a **masked** connection string, so the URL is passed
  explicitly with `--url="$DATABASE_URL"`.
- Demo data is seeded through the app's own `POST /api/debug/seed` route by the `seed`
  service. It first counts rows in `tenants` and **skips when the DB is already seeded** —
  the seed script itself inserts timestamped orders, so re-running it duplicates data.
  To intentionally reseed, empty the database first (do not drop the volume casually).
- Seeded personas (all use the mock password, demo login needs none):
  `admin@medsaas.com` (super admin), `dr.ahmed@alshifaclinic.ae`,
  `reception@alshifaclinic.ae`, `dr.sarah@apexhealth.com`; tenant slugs `al-shifa`, `apex-health`.

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
- `npm run typecheck` / `npm run lint` are available inside the `web` container
  (`docker compose -f docker-compose.base44.yml exec web npx tsc --noEmit`).
- Known fixed quirk: `/api/auth/demo-login` receives tenant **slugs** from the UI but
  sessions store tenant **UUIDs**; the route resolves slug-or-id before signing the token.
