# skills-v1.0.0-setup

Rendered skill tree installed by the published **@zedtech/zedkit-ai@1.0.0**:

```sh
npm install /tmp/zedtech-zedkit-ai-1.0.0.tgz
node node_modules/@zedtech/zedkit-ai/dist/bin.js setup <dest> --provider cursor
```

(preset `setup`, the `setup` default). Only `.agents/skills` is vendored:
agents and commands from 1.0.0 are already recognised by the `agents` /
`commands` maps in `kit/legacy-hashes.json`; the skills gap (rendered bytes
with 1.0.0's lenses and conditional resolution) is what this fixture covers.

`scripts/legacy-hashes.mjs` hashes every file here into the `skills` map, so
`legacyOwnsSkillDir` recognises a historic install and upgrades it in place
instead of sidecarring `zk-*` copies. Do not hand-edit: re-install from the
1.0.0 tarball to refresh.
