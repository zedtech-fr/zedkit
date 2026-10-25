# Lens registry

One row per review lens. `review` routes over this table: path/type ->
mandatory lenses. Runner `Status` `planned` means the skill/agent does not
exist yet (kit-agents roadmap): the lens reports skipped-planned, never a
blocker, until the runner lands. Skipping a mandatory lens whose runner
exists IS a blocker.

| Lens | Runner (skill or agent) | Status | Trigger (changed paths/types) | Mandatory? | Output |
|---|---|---|---|---|---|
| code | skill `code-review` (Standards applies `ponytail-review`) | exists | always | yes | findings + verdict |
| ponytail | skill `ponytail-review` (via code lens, surfaced separately) | exists | always | yes | ladder table + lean findings |
| persona | skill `persona-review` + repo `.agents/personas.md` | exists | always | yes | per-persona Pass/Rough/Fail + evidence |
| quality gate | agent `verifier` | exists | always | yes | gate results + DoD checklist |
| adversarial-tests | skill `adversarial-tests` | exists | logic, handlers, endpoints, state machines | when triggered | edge cases + missing tests |
| security | agent `security-reviewer` | exists | auth, secrets, tenancy, user data, external calls, crypto | when triggered | threats + fixes, file:line |
| skeptic | agent `skeptic` (angle per brief: plan, ui/ux, security, scope, data/ops, copy) | exists | plans, specs, ADRs, estimates, product/UI/scope decisions | when triggered | pre-mortem + ranked objections |
| ui | agent `ui-designer` | exists | `packages/ui/**`, `**/*.tsx`, styles, preview/gallery | when triggered | kit/a11y/state findings + persona(lazy client) |
| copy | agent `copywriter` | planned | user-visible strings, messages, errors, CTAs | when triggered | keys + FR/EN proposals |
| a11y | agent `a11y-auditor` | planned | `**/*.tsx`, components, forms, tables | when triggered | WCAG findings + fixes, file:line |
| seo | agent `seo-auditor` | planned | `packages/seo/**`, pages, metadata, sitemap, redirects | when triggered | rule findings + fixes |
| dependencies | agent `dependency-auditor` | planned | `package.json`, lockfiles, catalogs, `Dockerfile` | when triggered | need/size/license/maintenance/duplicates |
| docs | agent `docs-writer` | planned | `README.md`, `AGENTS.md`, `CATALOG.md`, `docs/**`, skills, agents, commands | when triggered | drift + fixes, compiling examples |
| release | agent `release-manager` | planned | `.changeset/**`, public API, catalog `Status` | when triggered | semver + migration-note check |
| research | skill `research` | exists | new capability with no in-repo precedent | optional | adopt/wrap/build + sources |

## Frontend rules (the `ui` lens fails the review on any of these)

1. One demo = one file (`demos/<name>.tsx` or colocated with its doc).
   No grab-bag module importing dozens of components.
2. Demos render inside one shared frame (title, description,
   light/dark preview, shown source, props link), consumed by the doc
   through a demo registry (key -> demo), never by direct page imports.
3. Doc pages stay thin: load content + doc layout only. No direct
   imports of dozens of components.
4. Zero raw structural HTML and zero ad-hoc styles in demos and doc
   pages: `Stack`/`Section`/`Heading`/`Text` from the kit, tokens only.
5. A lint rule or test bans bulk imports in doc pages (it fails on the
   grab-bag it replaces, passes after).
