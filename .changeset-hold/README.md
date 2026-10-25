# Held changesets

First npm cut ships `@zedtech/zedkit-ui` 0.1.0 alone (minimal blast radius). These inits publish the other six packages at 0.1.0 in the second cut: move them back to `.changeset/` (one PR) after the ui release verifies green.

Kept OUTSIDE `.changeset/` on purpose: `changesets/action` enumerates subdirectories and fails (ENOENT), while the CLI ignores them. Never nest this back inside.
