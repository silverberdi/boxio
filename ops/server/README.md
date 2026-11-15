# Boxio server bootstrap

This is deployment infrastructure only. The web page and API are temporary health-checked shells; product work replaces them through its own authorized delivery.

## Shared application hosting pattern

- Build immutable `ghcr.io/silverberdi/<app>-web` and `<app>-api` images from a Git commit SHA.
- Run each app as its own Compose project under `/opt/apps/<app>` with a private app network and a separate ingress network for its web frontend.
- Give each app a dedicated PostgreSQL database, login role, and private Docker network to the shared PostgreSQL service. Do not attach app containers to `local-ai-stack_backend`.
- Add role-specific `pg_hba.conf` rules so PostgreSQL's default `PUBLIC CONNECT` privilege cannot let an app role open sessions to other databases. Permit only its named database from its own internal network; reject that role everywhere else.
- Keep app secrets in root-owned `/etc/container-apps/<app>.env`; each root-owned mode-0600 app config names the image-tag and database-secret environment variables used by the generic wrappers.
- Use a repository-scoped GitHub Actions runner per app. Build on GitHub-hosted runners; only a push to `main` can call the root-owned deployment wrapper. The runner receives no general Docker-socket access.
- The generic deploy wrapper accepts only a registered app ID and a full commit SHA. It fetches the Compose file from that same Git commit, validates it, waits for health checks, and restores both the last healthy image and Compose file on failure.
- Containers stay stateless. Back up PostgreSQL data and any future app volumes; rebuild images from their Git commit instead of backing up container layers.

## Boxio bootstrap

`compose.yaml` is installed at `/opt/apps/boxio/compose.yaml`. The host-only environment file is `/etc/container-apps/boxio.env`. The web shell listens on the configured LAN address at port 8097; it alone joins the ingress network. The API has no published host port and joins only the private app and database networks. PostgreSQL has no Boxio-specific published port.

The PostgreSQL database is named `boxio`, owned by `boxio_app`, and reached on the dedicated `boxio-db` network. No other application container joins that network.

The current host backup directory is on the root filesystem, not a separate mounted backup target. Local database dumps do not protect against loss of the server; configure and verify an off-host copy before Boxio stores real player data.
