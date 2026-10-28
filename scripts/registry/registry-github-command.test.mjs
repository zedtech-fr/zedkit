import assert from "node:assert/strict";
import test from "node:test";

import { registryShadcnGithubCommand } from "../../apps/docs/lib/registry-shadcn-github-command.ts";

test("registryShadcnGithubCommand uses GitHub registry shorthand", () => {
  assert.equal(registryShadcnGithubCommand("badge"), "npx shadcn@latest add zedtech-fr/zedkit/badge");
});
