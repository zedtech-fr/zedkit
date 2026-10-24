# Contributing a helper

Short rule for adding a helper to zedkit:

1. **Generic only.** No secrets, no private names, no consumer domain
   terms. If it only serves one consumer, it does not belong here.
2. **One domain.** The helper goes in exactly one package — the package
   whose domain matches the need. New domain, new package (with its own
   README, AGENTS.md, and CATALOG.md).
3. **Tests.** Vitest unit tests through the public interface, deterministic,
   no network.
4. **Catalog entry.** Document the need in the package `CATALOG.md`
   (format: [catalog index](catalog/README.md)), regenerate
   `catalog.json` (`pnpm catalog:build`), and link the catalog from the
   [catalog index](catalog/README.md).
5. **Wrap, don't embed.** Follow the [golden rule](golden-rule.md): a
   mature npm package underneath gets a thin wrapper, never a direct
   import scattered through consumers.

Only truly reusable libraries become versioned packages. Templates are
meant to become project-owned code, and tiny dependency-free modules may
be source-copied by consumers instead of installed — MIT allows it, and
each package README says when copying is the saner option. No product is
ever required to use zedkit.

Small PRs from fresh `main`, one package per PR, each with a Changeset
file. `code-review` + `ponytail-review` before merge; merge on green CI.
