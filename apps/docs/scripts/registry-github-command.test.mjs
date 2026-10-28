import assert from "node:assert/strict";
import test from "node:test";

import { registryShadcnGithubCommand } from "../lib/registry-shadcn-github-command.ts";
import { registryShadcnNamespaceCommand } from "../lib/registry-shadcn-command.ts";

test("registryShadcnGithubCommand uses GitHub registry shorthand", () => {
  assert.equal(registryShadcnGithubCommand("badge"), "npx shadcn@latest add zedtech-fr/zedkit/badge");
});

test("registryShadcnNamespaceCommand registers docs-hosted @zedkit namespace", () => {
  assert.equal(
    registryShadcnNamespaceCommand("https://zedkit.app"),
    "npx shadcn@latest registry add @zedkit=https://zedkit.app/r/{name}.json",
  );
});
