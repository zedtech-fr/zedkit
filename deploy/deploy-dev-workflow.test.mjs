import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dev = readFileSync(join(root, ".github/workflows/deploy-dev.yml"), "utf8");
const prod = readFileSync(join(root, ".github/workflows/deploy-docs.yml"), "utf8");

test("deploy-dev publishes the CI-built export with deploy.sh --dev, not a host worktree checkout", () => {
  assert.match(dev, /deploy\/deploy\.sh --dev zed-dev/);
  assert.match(dev, /pnpm --filter @zedtech\/zedkit-docs build/);
  assert.match(dev, /curl -sf https:\/\/dev\.zedkit\.app\/dev-build\.txt/);
  assert.match(dev, /commit=\$DEV_SHA/);
  assert.doesNotMatch(dev, /deploy-zedkit-dev\.sh/);
  assert.doesNotMatch(dev, /\/data\/work\/infra/);
  assert.doesNotMatch(dev, /checkout -B/);
});

test("production deploy-docs still uses deploy.sh without the host worktree script", () => {
  assert.match(prod, /deploy\/deploy\.sh "\$TARGET"/);
  assert.doesNotMatch(prod, /deploy-zedkit-dev\.sh/);
  assert.doesNotMatch(prod, /checkout -B/);
});
