# Publishing

Packages ship publicly on npmjs.org as `@zedtech/zedkit-*`, versions
`0.x` (maturity per need lives in the catalog `Status` field, not in
the version). Releases run on Changesets; nothing publishes by hand.

## How a release flows

1. Every feature PR carries a Changeset file (`.changeset/<name>.md`
   naming the packages and the bump). Docs/tooling-only PRs carry none.
2. Merging to `main` triggers the `release` workflow: with pending
   changesets it opens (or updates) the **Version PR** (`chore: version
   packages`) with bumped versions + CHANGELOGs. Review it like code.
3. Merging the Version PR publishes the bumped packages to npm from CI
   (`NPM_TOKEN`) and consumes the changesets. No direct `npm publish`.

## Secrets and provenance

- `NPM_TOKEN` (repo secret): npm automation token with publish rights
  on the `@zedtech` org. Write-only from CI; never printed, never
  committed. Consumers need NO token (public packages).
- Provenance attestations are automatic: public repo + `id-token: write`
  on the release job lets npm link each tarball to its CI run.

## First-publish checklist (run once, in order)

1. npm org `zedtech` exists and is owned by the team.
2. `NPM_TOKEN` created (automation token, publish on `@zedtech/*`) and
   stored as a repo secret.
3. This setup merged; the Version PR computes the first cut
   (`@zedtech/zedkit-ui` 0.1.0 alone — the other inits are held in
   `.changeset/hold/` for the second cut, minimal blast radius).
4. Merge the Version PR only after 1–2 are confirmed, then verify:
   `npm view @zedtech/zedkit-ui version` and an install from a scratch
   consumer (`pnpm add @zedtech/zedkit-ui`, typecheck + render once).
5. Restore the held changesets (one PR moving them back) for the
   second cut (the other six packages at 0.1.0).

## Local pre-publish verification

`pnpm exec turbo run build && bash scripts/check-pack.sh` packs every
package and asserts the tarball holds the manifest, LICENSE, README,
every `files`/exports target — with no private terms inside. For a
manual file list: `pnpm --filter <pkg> exec npm pack --dry-run`.
