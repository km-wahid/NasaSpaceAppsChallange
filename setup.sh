#!/usr/bin/env sh
set -eu

compose_file="docker.yml"

if command -v python3 >/dev/null 2>&1 && \
  python3 -c 'import sys; sys.exit(0 if sys.version_info[0] >= 3 else 1)' >/dev/null 2>&1; then
  python_cmd=python3
elif command -v python >/dev/null 2>&1 && \
  python -c 'import sys; sys.exit(0 if sys.version_info[0] >= 3 else 1)' >/dev/null 2>&1; then
  python_cmd=python
else
  echo "Python 3 is required to prepare the included crop dataset." >&2
  exit 1
fi

command -v docker >/dev/null 2>&1 || {
  echo "Docker with Compose is required to run the website." >&2
  exit 1
}

echo "Preparing the included Bangladesh crop dataset..."
"$python_cmd" database/prepare_import.py

echo "Building and starting the website..."
docker compose -f "$compose_file" up --build --force-recreate -d

echo "Waiting for database migrations..."
attempt=0
until docker compose -f "$compose_file" exec -T postgres \
  psql -U nasaweb -d nasaweb -tAc "SELECT to_regclass('public.import_batches') IS NOT NULL" \
  2>/dev/null | grep -qx t; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 60 ]; then
    echo "Database migrations did not finish. Check: docker compose -f docker.yml logs app" >&2
    exit 1
  fi
  sleep 2
done

batch_count=$(docker compose -f "$compose_file" exec -T postgres \
  psql -U nasaweb -d nasaweb -tAc "SELECT COUNT(*) FROM import_batches")

if [ "$batch_count" -eq 0 ]; then
  echo "Loading the included dataset..."
  docker compose -f "$compose_file" exec -T postgres \
    psql -v ON_ERROR_STOP=1 -U nasaweb -d nasaweb -f /imports/load_postgres.sql
  docker compose -f "$compose_file" restart app >/dev/null
else
  echo "Existing database data found; leaving it unchanged."
fi

echo "Waiting for the website..."
attempt=0
until docker compose -f "$compose_file" exec -T app \
  node -e "fetch('http://127.0.0.1:3333/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" \
  >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 60 ]; then
    echo "Website did not become ready. Check: docker compose -f docker.yml logs app" >&2
    exit 1
  fi
  sleep 2
done

echo "Ready: http://localhost:3333/"
