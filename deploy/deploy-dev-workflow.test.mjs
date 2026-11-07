import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dev = readFileSync(join(root, ".github/workflows/deploy-dev.yml"), "utf8");
const prod = readFileSync(join(root, ".github/workflows/deploy-docs.yml"), "utf8");
const publish = readFileSync(join(root, "deploy/publish-dev-static.sh"), "utf8");

test("deploy-dev rsyncs a CI-built export to /data/srv/zedkit and does not touch host compose", () => {
  assert.match(dev, /pnpm --filter @zedtech\/zedkit-docs build/);
  assert.match(dev, /bash deploy\/publish-dev-static\.sh zed-dev/);
  assert.match(dev, /curl -sf https:\/\/dev\.zedkit\.app\/dev-build\.txt/);
  assert.match(dev, /commit=\$DEV_SHA/);
  assert.doesNotMatch(dev, /deploy\/deploy\.sh/);
  assert.doesNotMatch(dev, /deploy-zedkit-dev\.sh/);
  assert.doesNotMatch(dev, /\/srv\/app/);
  assert.doesNotMatch(dev, /checkout -B/);
  assert.doesNotMatch(dev, /IDENTITY_AI/);
  assert.doesNotMatch(dev, /suggest-dev\.env/);
  assert.doesNotMatch(dev, /docker compose/);
});

test("publish-dev-static hard-codes the staging static root and never talks to docker", () => {
  assert.match(publish, /remote="\/data\/srv\/zedkit"/);
  assert.match(publish, /rsync -a --delete --exclude '\.git'/);
  assert.match(publish, /refusing git worktree/);
  assert.doesNotMatch(publish, /docker/);
  assert.doesNotMatch(publish, /compose/);
  assert.doesNotMatch(publish, /caddy/i);
  assert.doesNotMatch(publish, /checkout -B/);
  assert.doesNotMatch(publish, /\/srv\/app/);
});

test("production deploy-docs is unchanged: still deploy.sh, not this static path", () => {
  assert.match(prod, /deploy\/deploy\.sh "\$TARGET"/);
  assert.doesNotMatch(prod, /publish-dev-static/);
  assert.doesNotMatch(prod, /\/data\/srv\/zedkit/);
});

function jobBlock(yaml, name) {
  return yaml.split(new RegExp(`^ {2}${name}:`, "m"))[1]?.split(/^ {2}\S/m)[0] ?? "";
}

test("prod deploy is bound to GitHub Environment production; staging deploy is not", () => {
  const prodJob = jobBlock(prod, "deploy");
  const devJob = jobBlock(dev, "deploy");
  assert.match(prodJob, /^\s+environment:\s+production\s*$/m);
  assert.doesNotMatch(devJob, /^\s+environment:\s/m);
  assert.doesNotMatch(dev, /^\s+environment:\s+production\s*$/m);
  assert.match(prodJob, /secrets\.DOCS_DEPLOY_KEY/);
  assert.match(devJob, /secrets\.DOCS_DEPLOY_KEY/);
  assert.match(devJob, /195\.154\.208\.75/);
  assert.match(dev, /Repo-level DOCS_DEPLOY_KEY is the staging key/);
});
