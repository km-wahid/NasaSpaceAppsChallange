#!/usr/bin/env sh
set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
compose_file="$project_dir/database/docker-compose.yml"

python3 "$project_dir/database/prepare_import.py"
docker compose -f "$compose_file" up -d postgres

attempt=0
until docker compose -f "$compose_file" exec -T postgres pg_isready -U agriculture -d agriculture >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then
    echo "PostgreSQL did not become ready." >&2
    exit 1
  fi
  sleep 1
done

for sql_file in 001_schema.sql 003_load_generated.sql 002_views.sql; do
  docker compose -f "$compose_file" exec -T postgres psql -v ON_ERROR_STOP=1 -U agriculture -d agriculture \
    < "$project_dir/database/sql/$sql_file"
done

docker compose -f "$compose_file" exec -T postgres psql -v ON_ERROR_STOP=1 -U agriculture -d agriculture \
  -c "SELECT 'districts' AS entity, COUNT(*) FROM districts
      UNION ALL SELECT 'crops', COUNT(*) FROM crops
      UNION ALL SELECT 'district_crop_statistics', COUNT(*) FROM district_crop_statistics
      UNION ALL SELECT 'district_season_climate', COUNT(*) FROM district_season_climate
      UNION ALL SELECT 'crop_climate_windows', COUNT(*) FROM crop_climate_windows;"

echo "Database ready: postgresql://agriculture@127.0.0.1:5433/agriculture"
