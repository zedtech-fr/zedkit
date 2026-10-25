# Agents catalog

When to call which agent, and the chains they form. Agents live in
`packages/ai/kit/agents/`; `setup-ai` installs the ones listed in
`packages/ai/kit/kit.json`. Review lenses route over
`packages/ai/kit/skills/review/lenses.md`.

| Agent | Call it when | Writes? |
|---|---|---|
| `architect` | before a feature, module, integration or cross-cutting change; produces the plan | no |
| `explorer` | you need files, symbols, usages, producers/consumers — paths and lines only | no |
| `researcher` | before building, to scout prior art and mature packages (adopt/wrap/build) | no (planned) |
| `skeptic` | after a plan or decision, before building; one angle per brief (plan, ui/ux, security, scope, data/ops, copy) | no |
| `plan-challenger` | deprecated alias of `skeptic` (angle: plan); new briefs must name `skeptic` | no |
| `test-writer` | with or after implementation, to add adversarial tests (skill: `adversarial-tests`) | tests only (planned) |
| `improver` | after a review returned findings; applies the smallest diff in risk order | yes |
| `verifier` | before calling work done or merging; runs gates + definition of done + two review passes | no |
| `security-reviewer` | the change touches auth, tenancy, secrets, user data, logging, input parsing or external calls | no |
| `ui-designer` | the change touches components, pages, styles or previews | no |
| `copywriter` | user-visible strings changed (microcopy, errors, empty states, CTAs); i18n-first | no (planned) |
| `a11y-auditor` | components, forms, tables or pages changed; WCAG basics | no (planned) |
| `seo-auditor` | pages, metadata, sitemap, redirects or the seo package changed | no (planned) |
| `dependency-auditor` | `package.json`, lockfiles or catalogs changed; new or updated deps | no (planned) |
| `docs-writer` | README, AGENTS.md, catalog entries or docs changed; drift and compiling examples | yes (planned) |
| `release-manager` | public API, changesets or catalog Status changed; semver + migration notes | no (planned) |
| `console-architecture` | frontend changes; checks route/view/data layer boundaries | no (planned) |
| `product-director` | you need a delivery brief for the director over a scope (branch, PRs, milestone) | no (planned) |

Planned rows land one PR at a time; each PR flips its row. Read-only agents
carry `disallowedTools: Write, Edit, NotebookEdit` and never apply fixes.

## Typical chains

- New feature: `researcher` -> `architect` -> `skeptic` -> implement ->
  `verifier` + `security-reviewer` (+ `ui-designer` when UI changed) ->
  `improver` -> `verifier` again.
- UI change: implement -> `ui-designer` -> `a11y-auditor` + `copywriter` ->
  `improver` -> `verifier`.
- New dependency: `researcher` -> `dependency-auditor` -> implement ->
  `verifier`.
- Docs change: `docs-writer` -> `verifier` (drift check).
- Release: `release-manager` (changeset, semver, migration notes, maturity)
  before the version PR.
- Status: `product-director` over the merged scope, any time.
