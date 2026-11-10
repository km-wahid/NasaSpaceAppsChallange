# OrbitAgro application development

This directory contains the AdonisJS 7 backend and React 19/Inertia frontend for [OrbitAgro](../README.md). The scoring engine is deterministic: identical stored inputs must always produce identical outputs.

## Prerequisites

- Node.js 24
- PostgreSQL 16
- npm
- Python 3 when preparing the source workbook

For the fastest complete setup, run `./setup.sh` from the repository root. The instructions below are for direct source development.

## Environment

```bash
cp .env.example .env
```

Update the PostgreSQL values in `.env` to match your local database. Required settings are:

| Variable | Purpose |
|---|---|
| `APP_KEY` | Session encryption key; use a secret value outside local development |
| `APP_URL`, `HOST`, `PORT` | Application address |
| `DB_HOST`, `DB_PORT` | PostgreSQL connection |
| `DB_USER`, `DB_PASSWORD`, `DB_DATABASE` | PostgreSQL credentials and database |
| `SESSION_DRIVER` | `cookie` or `memory` |

Optional integration settings:

| Variable | Default |
|---|---|
| `NASA_POWER_BASE_URL` | `https://power.larc.nasa.gov/api` |
| `NASA_POWER_TIMEOUT_MS` | `30000` |
| `NASA_PROFILE_MAX_AGE_DAYS` | `30` |
| `NOMINATIM_BASE_URL` | `https://nominatim.openstreetmap.org/` |

## Install and run

```bash
npm install
node ace migration:run
node ace db:seed
npm run dev
```

The site is available at [http://localhost:3333](http://localhost:3333) with the default environment values.

The seeders add reviewed starter references only when their prerequisite district and crop records exist. Use the repository-root `./setup.sh` when you need the complete workbook import and Bogura demonstration data.

## Commands

```bash
npm run dev          # development server with HMR
npm run build        # production build
npm start            # run an existing production build
npm run lint         # ESLint
npm run typecheck    # backend and Inertia TypeScript checks
npm test             # Japa unit and functional tests
npm run test:site    # browser smoke test against a running app
```

Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before considering a change complete.

## Application structure

```text
app/controllers/       Request validation, authorization, and responses
app/services/          Scoring, recommendations, climate, and location logic
app/validators/        VineJS request schemas
database/              Migrations, seeders, and reviewed reference data
inertia/pages/         Route-level React pages
inertia/components/    Reusable farmer-facing UI
inertia/lib/           API helpers, localization, and location utilities
tests/unit/            Scoring and service rules
tests/functional/      Authenticated request and persistence flows
```

## Decision pipeline

1. Controllers validate all client input with VineJS and verify ownership for saved farms.
2. Services read district references, farmer inputs, curated crop data, and cached environmental profiles.
3. `rotation_engine.ts` applies named weights, thresholds, feasibility gates, and transition rules without randomness or network calls.
4. Recommendation runs store calculation snapshots and explanations so a result can be audited later.
5. The frontend presents calendars, component scores, limitations, and trade-offs; it does not recalculate the recommendation.

Every scoring rule, threshold, and weight belongs in a named constant or reference file and requires a unit test.

## Important routes and APIs

Public pages include `/`, `/mission`, `/planner`, `/explorer`, `/explorer/map`, and `/sources`. `/farms` requires an authenticated session.

| Endpoint | Purpose |
|---|---|
| `POST /api/v1/crop-rotation/analyze` | District/water planning and optional saved-farm rotations |
| `POST /api/v1/farms/:id/recommendations` | Strict recommendation generation from a current cached profile |
| `POST /api/v1/farms/:id/environment/refresh` | Explicit NASA POWER profile refresh |
| `GET/PUT /api/v1/location` | Restore or save the signed-in user's district preference |
| `POST /api/v1/location/reverse` | User-triggered coordinate lookup through Nominatim |
| `GET/PUT /api/v1/farms/:id/rotation-choice` | Restore or save a selected recommendation |

`POST /api/v1/crop-rotation/analyze` accepts:

```json
{
  "districtId": "6",
  "waterAvailability": "medium",
  "farmId": 1
}
```

`farmId` is optional and must belong to the current account. Coordinates may be supplied for reverse geocoding, but the normal UI sends an already selected district. Recommendation generation never refreshes NASA data implicitly.

## Data and failure behavior

- Missing farm measurements remain `NULL`; never replace them with district values or invented estimates.
- The strict saved-farm recommendation endpoint returns `503` when its environmental profile is missing or stale.
- The planner may return clearly labeled season-based guidance when optional farm details are absent, together with unchecked constraints.
- NASA responses are stored before scoring so recommendations remain reproducible during an upstream outage.
- Nominatim requests are user-triggered, cached for ten minutes, serialized, and limited to one upstream start every 1.1 seconds. Busy requests receive `429` rather than an automatic retry.
- The current rate limiter and cache are process-local and assume the single application process in `docker.yml`.

Do not add ML/LLM scoring, Redis, PostGIS, randomness, or network requests inside the scoring engine.

## Browser and visual checks

Start the app, then run:

```bash
BROWSER_EXECUTABLE=/path/to/chrome npm run test:site
```

The browser check intercepts external data calls with explicit local fixtures. It does not create accounts, write farm records, call NASA, or send test traffic to Nominatim. Set `BASE_URL` to test another server.

The UI supports reduced motion, keyboard interaction, mobile widths from 320px, missing-data gaps, and local media fallbacks. Geolocation requires HTTPS in production; localhost is accepted during development.

## Troubleshooting

- **Database connection error:** confirm PostgreSQL is running and all `DB_*` values match it.
- **No rotations:** inspect missing crop references, farm inputs, or the environmental-profile status; the engine intentionally refuses unsupported claims.
- **Location unavailable:** manual district selection must remain usable after permission denial, timeout, unsupported browsers, or Nominatim failure.
- **Custom error page not visible:** Adonis development mode uses its debug error response; custom pages are exercised in a production build.
- **Docker data reset:** `docker compose -f docker.yml down` keeps data; `down -v` deletes it.

Additional references: [crop data](../docs/crop_references.md), [database notes](../database/README.md), and [media provenance](public/media/README.md).
