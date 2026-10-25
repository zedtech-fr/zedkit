# @zedkit/docs (shell)

Public documentation site for the kit. This PR is the shell only:
workspace membership, pinned docs dependencies (Next.js + Fumadocs),
and a building app with the Fumadocs provider and styles wired.

The follow-up spike PR adds the MDX source (generated from
`docs/catalog/catalog.json`), live `@zedkit/ui` previews, props
tables, and the docs-coverage CI check. Framework choice is
documented in `docs/spike-docs-framework.md` (lands with the spike).
