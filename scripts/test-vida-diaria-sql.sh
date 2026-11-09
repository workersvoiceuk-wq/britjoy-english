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
psql -v ON_ERROR_STOP=1 -q -d "$DB" -c "set role anon; select public.apply_course_access('e',1,'00000000-0000-4000-8000-00000000000a','vida_diaria_monthly','active',now(),false,'s',null,false);" 2>/dev/null && { echo 'anon ejecutó apply_course_access'; exit 1; } || true
for call in "apply_course_reversal('e',1,'s','refund',array['x'],true,false)" "apply_course_payment_link('e','in',array['x'])" "apply_course_payment('e','00000000-0000-4000-8000-00000000000a','vida_diaria_monthly',now(),'s','in',null)"; do
  for role in anon authenticated; do
    psql -v ON_ERROR_STOP=1 -q -d "$DB" -c "set role $role; select public.$call;" 2>/dev/null && { echo "$role ejecutó $call"; exit 1; } || true
  done
done
psql -v ON_ERROR_STOP=1 -tA -d "$DB" -f supabase/tests/vida-diaria-access.sql | tail -1
# Concurrencia real: dos sesiones piden checkout a la vez para un alumno nuevo → mismo intento (misma clave de Stripe).
psql -qtA -d "$DB" -c "insert into auth.users (id, email, email_confirmed_at) values ('00000000-0000-4000-8000-0000000000cc','c@example.com',now())"
A=$(mktemp); B=$(mktemp)
psql -qtA -d "$DB" -c "begin; set role service_role; select attempt from public.begin_course_checkout('00000000-0000-4000-8000-0000000000cc','vida_diaria_monthly'); select pg_sleep(1); commit;" > "$A" &
sleep 0.2
psql -qtA -d "$DB" -c "set role service_role; select attempt from public.begin_course_checkout('00000000-0000-4000-8000-0000000000cc','vida_diaria_monthly');" > "$B"
wait
a=$(grep -E '^[0-9]+$' "$A"); b=$(grep -E '^[0-9]+$' "$B"); rm -f "$A" "$B"
[ "$a" = "1" ] && [ "$b" = "1" ] && echo "checkout concurrente: mismo intento ($a/$b)" || { echo "checkout concurrente: intentos distintos ($a/$b)"; exit 1; }
psql -v ON_ERROR_STOP=1 -q -d "$DB" -c "set role anon; select * from public.begin_course_checkout('00000000-0000-4000-8000-0000000000cc','vida_diaria_monthly');" 2>/dev/null && { echo 'anon pudo abrir checkout'; exit 1; } || true
