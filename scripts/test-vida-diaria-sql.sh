#!/usr/bin/env bash
# Aplica las migraciones de supabase/ en un PostgreSQL local temporal (stubs de auth y storage) y ejecuta
# supabase/tests/vida-diaria-access.sql. Uso: PGHOST=… PGPORT=… PGUSER=postgres scripts/test-vida-diaria-sql.sh
set -euo pipefail
cd "$(dirname "$0")/.."
DB="vd_test_$$"
psql -v ON_ERROR_STOP=1 -qc "create database $DB"
trap 'psql -qc "drop database if exists $DB"' EXIT
psql -v ON_ERROR_STOP=1 -q -d "$DB" -f supabase/tests/vida-diaria-stubs.sql
for f in supabase/migrations/*.sql; do psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$f"; done
psql -v ON_ERROR_STOP=1 -q -d "$DB" -c "grant select on all tables in schema public to anon, authenticated; grant all on all tables in schema public to service_role;"
psql -v ON_ERROR_STOP=1 -q -d "$DB" -c "set role anon; select public.apply_course_access('e',1,'00000000-0000-4000-8000-00000000000a','vida_diaria_monthly','active',now(),false,'s',null);" 2>/dev/null && { echo 'anon ejecutó apply_course_access'; exit 1; } || true
psql -v ON_ERROR_STOP=1 -tA -d "$DB" -f supabase/tests/vida-diaria-access.sql | tail -1
