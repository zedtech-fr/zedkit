# `main` branch protection

`main` is protected by the repository ruleset
[**main: required CI checks**](https://github.com/zedtech-fr/zedkit/rules/26725586)
(target: default branch). Direct pushes are blocked; land changes with a
pull request and green required checks.

## Required status checks (CI workflow)

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) ends with a job
named **`ci-required`**. It `needs` the jobs below. Selected jobs must
succeed; skipped is allowed only when the detector excluded that job
(same `if: always()` pattern as `docs-smoke`). The live ruleset lists
**`ci-required`** only; adding or renaming a leaf job does not need a
settings change.

**Full CI runs only for pushes and PRs targeting `main`.** A PR into `dev`
(lockfile, root config and workflow changes included) takes the
affected-only path: turbo runs typecheck, lint and tests for the changed
packages and their dependents, the docs and registry jobs run only when
`scripts/ci-affected.mjs` finds a relevant path, and the workspace-wide
coverage run is skipped. `ci-required` accepts a skipped job only when
the detector excluded it; a selected job that skipped, failed or cancelled
is not green.

**PR and `dev` CI runs on GitHub-hosted `ubuntu-latest` runners** (4 vCPU /
16 GB), with `actions/cache` for pnpm, Turbo, `apps/docs/.next/cache` and
Playwright. The Dedibox self-hosted runners (`[self-hosted, zedkit]`,
persistent `/runner-cache`) stay as a fallback: set the repository variable
**`CI_RUNNER=self-hosted`** to switch the heavy jobs (`checks`,
`registry-smoke`, `quickstart-smoke`, `adoption-smoke`, `docs-build`) back
without a pull request. Job **names** stay neutral (`checks`, not
`checks-dedibox`) so `ci-required` and the ruleset do not change. Docs
Playwright smoke and UI gallery checks already run on `ubuntu-latest`
(GitHub-hosted Chromium; Dedibox uses a different revision). `release`,
`deploy-dev`, `deploy-docs` and `inspect-dev-vhost` are unchanged and already
use `ubuntu-latest`. After this path is stable, the Dedibox runner pool can
be reduced to 2–3 standby runners; that cut is not part of this change.
The former trial workflow `ci-dedibox-trial.yml` was removed once the
self-hosted path landed in `ci.yml`.

| Check | Role |
| --- | --- |
| `ci-required` | Aggregate gate: hygiene + checks + registry-smoke + quickstart-smoke + adoption-smoke + docs-build + docs-smoke + docs-render |
| `hygiene` | Artifact, tone, private-refs, changeset |
| `checks` | typecheck, lint, build, tests, catalog, pack, API reports |
| `ui-smoke` | UI gallery console, overflow and visibility on ubuntu-latest |
| `registry-smoke` | Registry build + smoke |
| `quickstart-smoke` | Vite consumer install from packed workspace tarballs + registry Button path |
| `adoption-smoke` | Shown install recipes; packed runtime workspace closure, not npm |
| `docs-build` | One docs static export, shared with Playwright smoke |
| `docs-smoke` | Critical docs journeys (home, search, catalog, a component page) |
| `docs-render` | Overflow, axe, clipped text on routes the diff touches (static export) |

`deploy-docs` and `release` run on `main` after merge; they are **not**
required for merging PRs.

CodeQL (`Analyze` jobs) runs on PRs but is not a merge gate today.

## Settings (not in git)

Ruleset parameters (owner / admin):

- Pull request required; **one** approving review and **required review
  thread resolution**.
- **Strict** “up to date with base” is **off** (`strict_required_status_checks_policy: false`).
- Force-push and branch deletion blocked on `main`.
- Administrators can bypass in an emergency (`bypass_actors`: repository
  admin role).

## Rollback

Disable or edit the ruleset in
**Settings → Rules → Rulesets**, or with the API (admin token):

```sh
# Inspect current ruleset (JSON)
gh api repos/zedtech-fr/zedkit/rulesets/26725586

# Disable enforcement (emergency only)
gh api --method PUT repos/zedtech-fr/zedkit/rulesets/26725586 \
  --input - <<'EOF'
{
  "name": "main: required CI checks",
  "target": "branch",
  "enforcement": "disabled",
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "rules": []
}
EOF
```

Re-enable by restoring the ruleset from the GitHub UI history or from a
saved export of the active configuration.

## Verify

1. Open a throw-away PR; confirm merge is blocked while a required check is
   pending or failed.
2. With all required checks green and **MERGE-OK** at head, one approving
   review on the PR, and review threads resolved, confirm
   `gh pr merge --squash --match-head-commit` succeeds.

Refs #604, #616.
