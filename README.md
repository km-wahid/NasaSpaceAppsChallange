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

# Load source-backed starter crop references after workbook import.
docker compose -f docker.yml restart app
```

Open http://localhost:3333/ after the import completes.

The first startup runs all AdonisJS migrations automatically. Each app startup runs the idempotent
crop-reference seeder; restart after the first workbook import so it can match the imported crops.
The seeder never overwrites existing curated records. **The workbook import truncates tables with
CASCADE: use it only on a new database, not to refresh an installation containing farmer data.**

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

Open `http://localhost:3333/` for the agricultural homepage, then select **Plan my season**.
The responsive navigation links to real pages: `/planner` (crop rotation recommendations),
`/farms` (account-protected farm workspace), `/sources` (data and limitations),
`/login` and `/signup`. Successful login/signup opens the planner.
The planner offers **Use my location** or manual division/district selection. Detection
runs only on a click: browser `getCurrentPosition()` → latitude/longitude →
`POST /api/v1/location/reverse` → OpenStreetMap Nominatim. No IP-location fallback,
Google API key, or new dependency is used. The reusable `detectUserLocation()`
function lives in `app/inertia/lib/location.ts`.

The backend checks county, state_district, city, town and municipality against the
Bangladesh district catalog, including common historical spellings. Unknown districts
return `district: null`; unsupported countries never select Bangladesh records.
Responses include `latitude`, `longitude`, `district`, `division`, `country`, plus
`districtId` and `countryCode`. Coordinates are the device coordinates, not the
coordinates of Nominatim’s nearest mapped object. Permission denial, unsupported
browsers, timeouts and lookup failures leave manual selection available.

Use HTTPS in production; `http://localhost:3333` works for local development. Plain
HTTP on a LAN IP usually cannot request geolocation. Device location may be approximate.
Lookup coordinates are sent to Nominatim and cached in server memory for ten minutes;
they are not saved as a farm or sent until the user clicks and grants permission.
Default soil and climate records remain district references, not farm measurements.

For signed-in users, successful detection is saved in PostgreSQL's `user_locations`
table (one row per user). Manual district selections are also saved, with coordinates
left empty rather than pretending the district center is the device location.
`GET /api/v1/location` restores the current account's preference on page load without
calling GPS or Nominatim. `PUT /api/v1/location` saves a manual `{ "districtId": "6" }`
selection. Both endpoints require authentication and use the session's user ID;
clients cannot choose another user's ID. Use **Change** to update your location.
Guests can detect or browse but do not persist an account preference. Farm coordinates
are never overwritten. The new migration runs automatically on Docker startup;
for direct development run `node ace migration:run` after pulling these changes.

### Nominatim usage

The public service has an application-wide maximum of **one request per second**,
requires application identification and OpenStreetMap attribution, and is intended
for moderate, user-triggered use. See the [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/).
The proxy supplies an identifying User-Agent, caches up to 256 coordinate lookups,
allows only one upstream request at a time, and spaces starts at least 1.1 seconds
apart. Busy requests get 429 (no automatic retries); upstream 429 responses trigger
a cooldown of at least one minute. The limiter/cache assumes the single app process
in this project's Docker setup. Before adding replicas/workers, use a shared limiter
and cache or a provider with appropriate capacity. Public Nominatim has no uptime guarantee.

To switch to a compatible hosted/self-hosted service without a code change, set
`NOMINATIM_BASE_URL` in root `.env` for Docker (or `app/.env` for direct execution),
then recreate/restart the app. The default is `https://nominatim.openstreetmap.org/`.

### Visual crop-planning flow

Location → High/Medium/Low water cards → seasonal outlook → crop calendar and alternatives.
The website uses React/Inertia with Tailwind CSS 4 and DaisyUI 5. Water selection is a
keyboard-accessible native dialog. Charts have accessible descriptions, missing-data gaps,
and reduced-motion support. Small screens scroll the calendar inside its card, not the page.
The map preview uses an attributed [OpenStreetMap embed](https://wiki.openstreetmap.org/wiki/Export#Embeddable_HTML);
manual selections show the district reference point, not a claimed GPS location.

### Website checks

With Docker or a built application running, use `cd app && npm run test:site`.
This Playwright check exercises direct routes, navigation, 320–1440px layouts,
permission denial/manual selection, water API wiring, the farms authentication guard,
custom 404 recovery and reduced motion. API responses are explicitly test fixtures;
the check does not write database records or call NASA/Nominatim.
If a Playwright Chromium browser is not installed, set `BROWSER_EXECUTABLE` to your
installed Chrome path. Set `BASE_URL` to check a different server address.
The custom error pages are enabled in built/production mode, not development debug mode.

The landscape photograph is bundled locally in `app/inertia/assets/farm-landscape.jpg`
from [Unsplash](https://images.unsplash.com/photo-1500382017468-9049fed747ef).
It is decorative photography, not an image of the farmer's detected district.

`POST /api/v1/crop-rotation/analyze` accepts:

```json
{ "districtId": "6", "waterAvailability": "medium", "farmId": 1 }
```

`farmId` is optional and requires the signed-in account to own a farm in that district.
Latitude/longitude may also be provided; coordinates without `districtId` are reverse-geocoded.
The normal UI already has the district and avoids a second geocoding request.
Responses contain `water`, `plans`, `planning`, `contextNote`, and source metadata.
The endpoint reads stored district context and, for a saved farm, calls the existing
deterministic engine using its cached environmental profile. It never refreshes NASA data.
Missing farm inputs return a water outlook with empty `plans` and an actionable `planning`
message, not fabricated crop recommendations. The direct recommendations endpoint retains
its missing/stale environmental-profile `503` response.

The water selection is saved to the account’s location and restored without another popup.
Changing the saved location clears that choice. It does **not** turn a qualitative answer
into invented millimeters of irrigation or overwrite measured farm supply. Rotation
feasibility uses the saved measured irrigation, soil tests, crop history and priorities.

The outlook is a transparent **ordinal planning guide**, not a water balance or forecast:
valid seasonal rainfall references are assigned low/moderate/high bins across their observed
range; tied references use moderate. The chart averages that ordinal (0/1/2) with the farmer’s
selection (0/1/2), rounded to the nearest label. Each season’s label is repeated across its
configured months, explicitly captioned as seasonal rather than monthly measurements.
Missing rainfall stays missing. Water-planning pressure reflects the farmer’s selection;
drought/flood labels are historical district references. Local nitrogen status is not
presented as an overall soil-health score.

The dashboard starts at the next full season in the active engine calendar, carrying its
year into generation so a December request does not schedule next April in the past.
When the engine produces feasible rotations, the UI uses its actual planting/harvest dates,
including year boundaries, and calculated component explanations. Plan A/B/C follow the
engine’s saved priorities; no plan is described as universally best. Crop water-demand
labels compare requirements across returned candidates (equal thirds of their range,
or medium when tied), not absolute crop tolerance or liters of irrigation. Tap a crop for
its growing period, water needs, expected fit, reason and next crop; tap an alternative
to switch the calendar and explanation cards.

After signing in, **Set priorities · extra details are optional** creates a farm in the selected
district with only priority weights totaling 100%. Farm name, size, coordinates, measured
irrigation, soil tests, history and environmental refresh are optional under **Add extra details**.
Unknown measurements are saved as `NULL`, never invented. The scheduling allowance defaults
to 10 land-preparation days and can be adjusted in the optional details.
Optional size, coordinates and irrigation can be added or cleared later through
`PUT /api/v1/farms/:id/details`. Changing coordinates marks older environmental profiles
unusable until an explicit NASA refresh; earlier recommendation snapshots remain intact.
Save changes, refresh the dashboard’s farm list, select the farm, then click **Generate crop rotations**.
The water-choice popup can also be skipped. Saves use authenticated JSON requests with CSRF protection.
Saved history and priorities are restored by `GET /api/v1/farms/:id/inputs`.
The planner uses season-based guidance when details are absent: neutral climate/resilience components,
relative crop-water demand, documented crop soil effects and per-hectare economics. It explicitly
lists unchecked constraints. It does not claim measured soil improvement or checked farm suitability.
Each alternative lists crops, planting/harvest months and documented potential soil contributions.
Source-backed requirements and calendars remain mandatory. The starter seed includes five crops;
missing economics disables profit comparison instead of blocking all season-based plans.
Absent reference fields stay unknown. Calculation snapshots and a database engine version record this mode.

1. Register at `/signup`.
2. Create a farm with `POST /api/v1/farms`, including `districtId` and `priorities`:
   `{ "climateWeight": 15, "waterWeight": 20, "soilWeight": 25, "resilienceWeight": 10, "economicWeight": 30 }`.
3. Save two or more history slots at `PUT /api/v1/farms/:id/history`.
4. Save a sourced soil profile at `PUT /api/v1/farms/:id/soil`.
5. Save weights totaling 100 at `PUT /api/v1/farms/:id/preferences`.
6. Refresh NASA data explicitly with `POST /api/v1/farms/:id/environment/refresh`.
7. Generate with `POST /api/v1/farms/:id/recommendations`.

Recommendation generation never calls NASA. The strict `/farms/:id/recommendations` endpoint
uses the latest cached profile and returns `503` when it is missing or stale. The dashboard's
`POST /api/v1/crop-rotation/analyze` endpoint allows missing optional details and returns clearly
labeled season-based guidance; it never refreshes NASA implicitly.

## Verification

```bash
cd app
npm run typecheck
npm run build
npm test
```

For a local location smoke test: start the stack, import district records, open
`http://localhost:3333`, click **Use my location**, and allow permission. Check
the detected district, continue and select water availability. Also try denying permission
and selecting a district manually. Browser DevTools Sensors can override coordinates
and simulate an unavailable position. Use mocked Nominatim responses for repeated
automated tests, rather than sending test traffic to the public service.

Check High/Medium/Low cards, Escape to close the popup, errors/retry, the mobile layout,
and account reload (saved location and water choice should restore without GPS).
With a fully curated farm, check that the month calendar matches backend dates and that
selecting an alternative updates crop details and explanations. Without reviewed crop
requirements/calendars/economics/soil thresholds, expect an honest missing-data message,
not a demonstration plan. Tests include the ordinal water adapter, real engine-to-calendar
mapping and transactional PostgreSQL checks for ownership and saved choices.

The engine has no ML or LLM dependency. Crop requirements, calendars, nutrient thresholds, economics and rotation rules must be curated with `data_sources` records before recommendations are available.

The planner puts crop recommendations before supporting water analytics. Select a saved farm,
choose **Generate crop rotations**, compare calendars and trade-offs, then **Use this rotation**.
The choice is stored in PostgreSQL per farm via `PUT /api/v1/farms/:id/rotation-choice`
with `{ "runId": "123", "rank": 1 }`; `GET` on the same endpoint restores it.
Only the farm owner can choose a completed recommendation belonging to that farm.
A saved choice is not a planting record and does not change crop history. **Download planting guide**
exports dates, water needs, explanations and trade-offs as a text file. Empty reference tables are
reported explicitly; the UI never substitutes demonstration plans for real recommendations.
