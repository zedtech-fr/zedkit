# Publishing

Packages ship publicly on npmjs.org as `@zedtech/zedkit-*` (versions in
the root README table; maturity per need lives in the catalog `Status`
field). Releases run on Changesets; nothing publishes by hand.

## How a release flows

1. Every feature PR carries a Changeset file (`.changeset/<name>.md`
   naming the packages and the bump). Docs/tooling-only PRs carry none.
2. Merging to `main` triggers the `release` workflow: with pending
   changesets it opens (or updates) the **Version PR** (`chore: version
   packages`) with bumped versions + CHANGELOGs. Review it like code.
3. Merging the Version PR publishes the bumped packages to npm from CI
   and consumes the changesets. No direct `npm publish`. Auth is GitHub
   OIDC, or `NODE_AUTH_TOKEN` when the `NPM_TOKEN` repo secret is set.

## Secrets and provenance

- Publish auth: `scripts/export-release-auth.mjs` runs before Changesets.
  If repo secret `NPM_TOKEN` is non-empty, it writes `NODE_AUTH_TOKEN`
  to `GITHUB_ENV`. If the secret is empty or absent, `NODE_AUTH_TOKEN`
  is left **unset**. Do not assign `NODE_AUTH_TOKEN` from the secret
  directly: an empty interpolation is `ENEEDAUTH`.
- npm 11 tries OIDC first (`id-token: write`) and falls through to the
  token when no Trusted Publisher is configured (oidc() never throws).
- Provenance: the publish step sets `NPM_CONFIG_PROVENANCE=true` for
  both paths. Combined with `id-token: write` and a public `repository`
  field on each package, npm attaches a Sigstore attestation.

## Trusted publishing

Configure each package on npmjs.com (Settings → Trusted Publisher →
GitHub Actions): owner `zedtech-fr`, repository `zedkit`, workflow
filename `release.yml`, Environment **empty** (the job has none).
Do that in the npm UI; this repo does not mutate Trusted Publishers.

Official floors (https://docs.npmjs.com/trusted-publishers): npm CLI
≥ 11.5.1, Node ≥ 22.14.0, GitHub-hosted runners only. Node 22 still
ships npm 10.x in `dirname(process.execPath)`. `pnpm publish`
(Changesets → pnpm 9.15.9) prepends that directory, so a later PATH
`npm i -g npm@11` is ignored. `scripts/ensure-release-publisher.sh`
installs the pinned npm 11 into the Node prefix, then
`scripts/release-publisher.mjs` asserts the **publisher** npm (empty
pack cwd) before Changesets runs.

## Version PR checks

GitHub does not run workflows on pull requests opened with
`GITHUB_TOKEN`. The `release` workflow mints an installation
token so the Version PR (`chore: version packages`) gets the
same checks as any other PR.

Repository secrets (values never live in this repo):

- `RELEASE_APP_ID` — GitHub App id
- `RELEASE_APP_PRIVATE_KEY` — GitHub App private key (PEM)

The App is installed on this repository only and has
**Contents: write** and **Pull requests: write**. When those
secrets are missing, the workflow still opens the Version PR
with `GITHUB_TOKEN` (checks do not run until the secrets exist).
After they exist, the next Version PR shows the `ci` checks on
the pull request.

## First-publish checklist (run once, in order)

1. npm org `zedtech` exists and is owned by the team.
2. Each public package has a Trusted Publisher on npmjs.com for
   GitHub Actions: owner `zedtech-fr`, repository `zedkit`, workflow
   filename `release.yml`, Environment empty.
3. This setup merged; the Version PR computes the first cut
   (`@zedtech/zedkit-ui` 0.1.0 alone — the other inits are held in
   `.changeset-hold/` for the second cut, minimal blast radius).
4. Merge the Version PR only after 1–2 are confirmed, then verify:
   `npm view @zedtech/zedkit-ui version` and an install from a scratch
   consumer (`pnpm add @zedtech/zedkit-ui`, typecheck + render once).
5. Restore the held changesets (one PR moving them back) for the
   second cut (the other six packages at 0.1.0).

## Local pre-publish verification

`pnpm exec turbo run build && bash scripts/check-pack.sh` packs every
package and asserts the tarball holds the manifest, LICENSE, README,
every `files`/exports target — with no private terms inside. Each public
package must declare `engines.node` (`>=22`, same as CI); `node
scripts/check-publish-engines.mjs` enforces it before release. It also
runs `publint` (errors only) and `attw --profile esm-only` on each
tarball (CSS subpaths excluded). For a manual file list:
`pnpm --filter <pkg> exec npm pack --dry-run`.

Concatenated `@zedtech/zedkit-ui` `dist/*.js` gzip is not gated: consumers
tree-shake, and that ceiling was raised on every UI change. The marketing
barrel is a dedicated entry someone may import wholesale, so it still has
a gzip ceiling. `@zedtech/zedkit-ai` is a CLI and kit installer: pack
still checks integrity, exports, contents, publint and attw, and has no
gzip ceiling.

| Package | Budget |
|---|---|
| `@zedtech/zedkit-ui` marketing entry | 10 200 bytes |

Docs site home first-load JavaScript (gzip sum of each initial
`/_next/static/chunks/*.js` file in the static export, same gate as
`check-pack` after build) is the consumer payload:

| Route | Budget |
|---|---|
| `/` (`apps/docs/out/index.html`) | 363 000 bytes gzip |

Raise the marketing tarball number in `scripts/check-pack.sh` or the home
budget in `apps/docs/scripts/first-load-budget.mjs` in the PR that grows
the payload. Do not add an ai gzip ceiling.
