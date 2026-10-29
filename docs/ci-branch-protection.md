# `main` branch protection

`main` is protected by the repository ruleset
[**main: required CI checks**](https://github.com/zedtech-fr/zedkit/rules/26112670)
(target: default branch). Direct pushes are blocked; land changes with a
pull request and green required checks.

## Required status checks (CI workflow)

These job names must pass on the PR head before squash-merge (from
[`.github/workflows/ci.yml`](../.github/workflows/ci.yml)):

| Check | Role |
| --- | --- |
| `hygiene` | Artifact, tone, private-refs, dependabot, changeset, PR lenses |
| `checks` | typecheck, lint, build, tests, catalog, pack, API reports, ui smoke |
| `registry-smoke` | Registry build + smoke |
| `docs-smoke` | Docs Playwright smoke subset |
| `docs-e2e` | Aggregate gate over the three docs e2e shards |

The matrix jobs `docs-e2e-shard (1/3)` … `(3/3)` run in parallel; merge
requires the aggregate **`docs-e2e`** job (see the `needs:` gate in the
workflow). The ruleset may also list shard names; that is redundant with
`docs-e2e` but still valid.

`deploy-docs` and `release` run on `main` after merge; they are **not**
required for merging PRs.

CodeQL (`Analyze` jobs) runs on PRs but is not a merge gate today.

## Settings (not in git)

Ruleset parameters (owner / admin):

- Pull request required; **0** approving reviews (merge bot + **MERGE-OK** in
  process).
- **Strict** “up to date with base” is **off** (`strict_required_status_checks_policy: false`).
- Force-push and branch deletion blocked on `main`.
- Administrators can bypass in an emergency (`bypass_actors`: repository
  admin role).

## Rollback

Disable or edit the ruleset in
**Settings → Rules → Rulesets**, or with the API (admin token):

```sh
# Inspect current ruleset (JSON)
gh api repos/zedtech-fr/zedkit/rulesets/26112670

# Disable enforcement (emergency only)
gh api --method PUT repos/zedtech-fr/zedkit/rulesets/26112670 \
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
2. With all required checks green and **MERGE-OK** at head, confirm
   `gh pr merge --squash --match-head-commit` succeeds.

Refs #604, #616.
