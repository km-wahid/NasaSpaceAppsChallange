# ORBIT Crop Rotation Lab

Deterministic NASA-powered crop-rotation decision support built with AdonisJS, React/Inertia and PostgreSQL.

## Run after cloning

Requirements: Docker Desktop with Compose, Python 3, and Git.

```bash
git clone https://github.com/km-wahid/NasaSpaceAppsChallange.git
cd NasaSpaceAppsChallange

# Generate the PostgreSQL CSV imports from the included workbook.
python3 database/prepare_import.py

# Build the app, run migrations, and start PostgreSQL plus AdonisJS.
docker compose -f docker.yml up --build -d

# Load the imported Bangladesh district and crop records.
docker compose -f docker.yml exec -T postgres \
  psql -v ON_ERROR_STOP=1 -U nasaweb -d nasaweb -f /imports/load_postgres.sql
```

Open http://localhost:3333/ after the import completes.

The first startup runs all AdonisJS migrations automatically. The import command is separate because it loads the workbook data into the already-created PostgreSQL tables.

To watch the app:

```bash
docker compose -f docker.yml logs -f app
```

To stop it:

```bash
docker compose -f docker.yml down
```

PostgreSQL data remains in the `postgres_data` volume. Only use `docker compose -f docker.yml down -v` when you intentionally want to delete it.

## Workflow

Open `http://localhost:3333/` to browse the imported PostgreSQL district records.
The homepage loads `/api/v1/catalog` and updates it when a district is selected;
crop search and season filters operate on the returned district records.
The data source and missing recommendation-reference counts are displayed alongside the records.

After signing in, the same page includes farm creation/selection, crop history,
soil inputs (when reviewed thresholds exist), priority controls, NASA refresh,
and recommendation generation. Saves use authenticated JSON requests with CSRF protection.
Saved history and priorities are restored by `GET /api/v1/farms/:id/inputs`.
API failures are displayed on the page, including missing NASA profiles or curated crop data.

1. Register at `/signup`.
2. Create a farm with `POST /api/v1/farms`.
3. Save two or more history slots at `PUT /api/v1/farms/:id/history`.
4. Save a sourced soil profile at `PUT /api/v1/farms/:id/soil`.
5. Save weights totaling 100 at `PUT /api/v1/farms/:id/preferences`.
6. Refresh NASA data explicitly with `POST /api/v1/farms/:id/environment/refresh`.
7. Generate with `POST /api/v1/farms/:id/recommendations`.

Recommendation generation never calls NASA. It uses the latest cached profile and returns `503` when that profile is missing or stale.

## Verification

```bash
cd app
npm run typecheck
npm run build
npm test
```

The engine has no ML or LLM dependency. Crop requirements, calendars, nutrient thresholds, economics and rotation rules must be curated with `data_sources` records before recommendations are available.
