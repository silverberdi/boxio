#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

if [[ "$EUID" -ne 0 ]]; then
  echo "run this script with sudo" >&2
  exit 1
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
stack_file=/home/silverman/local-ai-stack/compose.yaml
postgres_container=local-ai-stack-postgres-1
app_id=boxio

[[ -f "$stack_file" ]] || { echo "shared PostgreSQL Compose file not found" >&2; exit 1; }
docker inspect "$postgres_container" >/dev/null

install -d -o root -g root -m 0755 /opt/apps/boxio /etc/container-apps /var/lib/container-apps
install -o root -g root -m 0644 "$repo_root/ops/server/compose.yaml" /opt/apps/boxio/compose.yaml
install -o root -g root -m 0600 "$repo_root/ops/server/boxio.conf" /etc/container-apps/boxio.conf
install -o root -g root -m 0755 "$repo_root/ops/server/deploy-container-app" /usr/local/sbin/deploy-container-app
install -o root -g root -m 0755 "$repo_root/ops/server/restrict-app-postgres-access" /usr/local/sbin/restrict-app-postgres-access

if ! id boxio-runner >/dev/null 2>&1; then
  useradd --system --create-home --home-dir /home/boxio-runner --shell /usr/sbin/nologin boxio-runner
fi
install -d -o boxio-runner -g boxio-runner -m 0750 /home/boxio-runner

cat > /etc/sudoers.d/boxio-container-deploy <<'SUDOERS'
boxio-runner ALL=(root) NOPASSWD: /usr/local/sbin/deploy-container-app boxio *
SUDOERS
chmod 0440 /etc/sudoers.d/boxio-container-deploy
visudo -cf /etc/sudoers.d/boxio-container-deploy >/dev/null

if ! docker network inspect boxio-db >/dev/null 2>&1; then
  docker network create --driver bridge --internal --label owner=boxio boxio-db >/dev/null
fi
if [[ "$(docker network inspect boxio-db --format '{{.Internal}}')" != true ]]; then
  echo "boxio-db exists but is not an internal network; refusing to use it" >&2
  exit 1
fi
if ! docker network inspect boxio-db --format '{{range .Containers}}{{.Name}}{{"\n"}}{{end}}' | grep -Fxq "$postgres_container"; then
  docker network connect --alias boxio-postgres boxio-db "$postgres_container"
fi

python3 - "$stack_file" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
text = path.read_text()
original = text
start = text.index("  postgres:\n")
end = text.index("\n  n8n:\n", start)
postgres = text[start:end]
if "networks: [backend, boxio_db]" not in postgres:
    old = "    networks: [backend]"
    if postgres.count(old) != 1:
        raise SystemExit("PostgreSQL network declaration was not the expected single entry")
    postgres = postgres.replace(old, "    networks: [backend, boxio_db]", 1)
    text = text[:start] + postgres + text[end:]

network_block = "  boxio_db:\n    external: true\n    name: boxio-db\n"
if "  boxio_db:\n" not in text:
    marker = "networks:\n  frontend:\n  backend:\n"
    if text.count(marker) != 1:
        raise SystemExit("top-level Compose networks were not in the expected form")
    text = text.replace(marker, marker + network_block, 1)
elif network_block not in text:
    raise SystemExit("an unexpected boxio_db network definition already exists")

if text != original:
    backup = path.with_name(path.name + ".pre-boxio-" + __import__("datetime").datetime.now().strftime("%Y%m%d%H%M%S"))
    backup.write_text(original)
    path.write_text(text)
PY

if [[ ! -f /etc/container-apps/boxio.env ]]; then
  password="$(openssl rand -hex 32)"
  {
    printf 'BOXIO_DB_PASSWORD=%s\n' "$password"
    printf 'BOXIO_BIND_ADDRESS=192.168.0.194\n'
  } > /etc/container-apps/boxio.env
  chmod 0600 /etc/container-apps/boxio.env
  chown root:root /etc/container-apps/boxio.env
fi
if [[ "$(stat -c '%U:%G:%a' /etc/container-apps/boxio.env)" != "root:root:600" ]]; then
  echo "Boxio environment file must be root-owned mode 0600" >&2
  exit 1
fi
# shellcheck disable=SC1091
source /etc/container-apps/boxio.env
[[ "${BOXIO_DB_PASSWORD:-}" =~ ^[0-9a-f]{64}$ ]] || { echo "invalid Boxio database secret" >&2; exit 1; }

existing_owner="$(docker exec "$postgres_container" psql -U n8n -d postgres -Atc "SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname = 'boxio'")"
if [[ -n "$existing_owner" && "$existing_owner" != boxio_app ]]; then
  echo "database boxio already exists with a different owner; refusing to take it over" >&2
  exit 1
fi

docker exec -i --env BOXIO_DB_PASSWORD="$BOXIO_DB_PASSWORD" "$postgres_container" \
  psql -U n8n -d postgres -v ON_ERROR_STOP=1 <<'SQL'
\getenv db_password BOXIO_DB_PASSWORD
SELECT format('CREATE ROLE boxio_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD %L', :'db_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'boxio_app')
\gexec
ALTER ROLE boxio_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD :'db_password';
SELECT 'CREATE DATABASE boxio OWNER boxio_app'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'boxio')
\gexec
ALTER DATABASE boxio OWNER TO boxio_app;
REVOKE ALL ON DATABASE boxio FROM PUBLIC;
GRANT CONNECT ON DATABASE boxio TO boxio_app;
\connect boxio
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO boxio_app;
SQL

/usr/local/sbin/restrict-app-postgres-access boxio

install -o root -g root -m 0755 "$repo_root/ops/server/backup-container-app-db" /usr/local/sbin/backup-container-app-db
install -d -o root -g root -m 0700 /home/silverman/compartido_mac/backups/boxio
cat > /etc/systemd/system/backup-boxio-db.service <<'UNIT'
[Unit]
Description=Create a PostgreSQL backup for Boxio
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
User=root
ExecStart=/usr/local/sbin/backup-container-app-db boxio
UNIT
cat > /etc/systemd/system/backup-boxio-db.timer <<'UNIT'
[Unit]
Description=Daily PostgreSQL backup for Boxio

[Timer]
OnCalendar=*-*-* 03:30:00
RandomizedDelaySec=15m
Persistent=true

[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl enable --now backup-boxio-db.timer

cd /home/silverman/local-ai-stack
docker compose --file "$stack_file" config --quiet
echo "Boxio host, dedicated database network, role, database, deployment wrapper, and local backup timer are configured. PostgreSQL was not restarted."
