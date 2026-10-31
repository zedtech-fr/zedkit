# Docs hosting

The docs site (`apps/docs`) is a static export served by Caddy on a small
Linux VM with Docker. Caddy obtains and renews the TLS certificate
automatically and redirects `www.zedkit.app` to `zedkit.app`.

| File | Purpose |
|---|---|
| `Caddyfile` | Site config: apex + `www` redirect, caching, 404 page, suggest proxy, dev site |
| `compose.yaml` | Runs Caddy plus the identity-suggest Node service |
| `compose.override.yaml` | Repo-owned mounts for Caddy; replaces any hand wiring on the host |
| `suggest/` | `POST /api/identity/suggest` — chat completions from env, no keys in the client. `GET /api/identity/suggest/version` reports the release id and the parameters that process loaded |
| `deploy.sh` | Uploads a versioned release under `releases/<sha>`, switches the `current` symlink, reloads Caddy, and recreates Suggest when its fingerprint changes. `--rollback` restores the previous release pointer. With `--dev`: content only to the dev site, stamped with `dev-build.txt` |

## Deploy by hand

```sh
pnpm install --frozen-lockfile
pnpm --filter @zedtech/zedkit-docs build
deploy/deploy.sh <user>@<host>
```

## Deploy from CI

`.github/workflows/deploy-docs.yml` builds and deploys on every push to
`main` that touches the docs or this directory.

`.github/workflows/deploy-dev.yml` builds and publishes to the dev site on
every push to `main`, and on manual dispatch for any other ref. Each dev
deploy stamps `dev-build.txt` (branch, commit, UTC build time); check it at
`https://dev.zedkit.app/dev-build.txt`.

Both workflows need these repository
secrets:

| Secret | Value |
|---|---|
| `DOCS_DEPLOY_HOST` | Host name or IP of the VM |
| `DOCS_DEPLOY_USER` | SSH user (member of the `docker` group) |
| `DOCS_DEPLOY_KEY` | Private SSH key accepted by that user |
| `DOCS_DEPLOY_KNOWN_HOSTS` | `ssh-keyscan` output for the host |
| `IDENTITY_AI_BASE_URL` | Chat-completions origin (no `/v1/chat/completions` suffix). Empty keeps Suggest off. |
| `IDENTITY_AI_API_KEY` | Bearer token for that origin. Never committed. |
| `IDENTITY_AI_MODEL` | Model id for that origin. |
| `IDENTITY_AI_MAX_TOKENS` | Optional chat `max_tokens` (default 131072). Empty uses the default. |
| `IDENTITY_AI_REASONING_EFFORT` | Optional `reasoning_effort`. Empty or `minimal` leaves the model default. |
| `IDENTITY_AI_FALLBACK_BASE_URL` | Optional second origin used when the first call fails. |
| `IDENTITY_AI_FALLBACK_API_KEY` | Bearer token for the fallback origin. |
| `IDENTITY_AI_FALLBACK_MODEL` | Model id for the fallback origin. |

## Requirements on the VM

Docker with Compose, `rsync`, ports 80/443 open (443 UDP for HTTP/3), and
`zedkit.app`, `www.zedkit.app`, and `dev.zedkit.app` resolving to the VM.

Other static files (for example registry JSON under `/r/`) are served from
the same site directory with the content type derived from their extension.
