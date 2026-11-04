         # AGENTS.md

Guidance for AI coding agents (Claude Code, Codex, Cursor, etc.) working in this repository.

## Project overview

A crop-rotation decision-support web app for farmers in Bangladesh. It uses NASA POWER climate data and a **deterministic scoring engine** to recommend crop rotations based on the farmer's goal (profit focus vs soil/water focus). The MVP demo is a one-hectare plot in Bogura.

**Primary users:** farmers on low-to-mid-range Android phones, often outdoors, sometimes with limited literacy and slow connections. Every UI decision should serve them first.

## Tech stack

- **Backend:** AdonisJS 7 (TypeScript)
- **Frontend:** React 19 + Inertia.js, TypeScript
- **Database:** PostgreSQL 16
- **Infra:** Docker (`docker.yml` at repo root)
- **Not used (do not add without asking):** ML/LLM features, Redis, PostGIS

## Setup and commands

> Adjust these to match `package.json` if they differ.

```bash
npm install                  # install dependencies
docker compose -f docker.yml up -d   # start PostgreSQL
node ace migration:run       # run migrations
node ace db:seed             # seed demo data (Bogura scenario)
npm run dev                  # start dev server
npm run build                # production build
npm run lint                 # lint
npm run typecheck            # TypeScript check
npm test                     # run tests
```

Run `lint`, `typecheck`, and `test` before considering a task complete.

## Project structure

```
app/            # controllers, models, services, validators
  services/     # business logic, including the scoring engine
start/          # routes, kernel
database/       # migrations, seeders
inertia/        # React pages and components
  pages/        # Inertia pages
  components/   # reusable UI components
  lib/          # helpers, constants, i18n
tests/          # unit and functional tests
```

##   rules

1. **The scoring engine must stay deterministic.** Same inputs always give the same outputs. No randomness, no network calls, no LLMs inside scoring logic.
2. **Keep scoring logic in `app/services/`**, separate from controllers. Controllers validate input, call services, and return Inertia responses.
3. **Every scoring rule needs a unit test.** Weights, thresholds, and crop data live in clearly named constants or data files, not scattered magic numbers.
4. **Validate all input** with Adonis validators (VineJS). Never trust client data.
5. **Cache or store NASA POWER responses** so the demo works if the API is slow or down. Handle API failures gracefully.
6. **Do not add new dependencies** without a clear reason. Prefer what is already installed.

## Code style

- TypeScript strict mode. No `any` unless unavoidable and commented.
- Small, single-purpose functions and components.
- Descriptive names; comments explain *why*, not *what*.
- Use async/await, not raw promise chains.
- Follow the existing ESLint and Prettier config. Do not reformat unrelated files.

## 
