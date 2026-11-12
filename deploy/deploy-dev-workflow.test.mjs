import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dev = readFileSync(join(root, ".github/workflows/deploy-dev.yml"), "utf8");
const epic = readFileSync(join(root, ".github/workflows/deploy-epic-preview.yml"), "utf8");
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

test("deploy-dev copies a generated run index before the docs build when env is set", () => {
  const sshIdx = dev.indexOf("Configure SSH to deploy host");
  const coreIdx = dev.indexOf("pnpm --filter @zedtech/zedkit-core build");
  const copyIdx = dev.indexOf("copy-public-reviews-snapshot.mjs");
  const buildIdx = dev.indexOf("pnpm --filter @zedtech/zedkit-docs build");
  assert.ok(sshIdx > 0 && coreIdx > sshIdx && copyIdx > coreIdx && buildIdx > copyIdx);
  assert.match(dev, /PUBLIC_REVIEWS_SNAPSHOT/);
  assert.match(dev, /PUBLIC_REVIEWS_SNAPSHOT_REMOTE/);
  assert.match(dev, /keeping stand-in/);
  assert.match(dev, /scp failed \(exit /);
  assert.match(dev, /must not start with -/);
  assert.doesNotMatch(dev, /remote file absent/);
  assert.doesNotMatch(dev, /\/home\//);
  assert.doesNotMatch(dev, /\/Users\//);
  const ingestBlock = dev.slice(
    dev.indexOf("name: Ingest generated run index"),
    buildIdx,
  );
  const gate = ingestBlock.match(
    /node apps\/docs\/scripts\/copy-public-reviews-snapshot\.mjs[\s\S]*?public-reviews\.json[^\n]*/,
  );
  assert.ok(gate, "ingest gate invocation");
  assert.doesNotMatch(gate[0], /\|\|/);
  assert.doesNotMatch(gate[0], /exit 0/);
  assert.doesNotMatch(epic, /copy-public-reviews-snapshot/);
  assert.doesNotMatch(prod, /copy-public-reviews-snapshot/);
  assert.doesNotMatch(epic, /PUBLIC_REVIEWS_SNAPSHOT/);
  assert.doesNotMatch(prod, /PUBLIC_REVIEWS_SNAPSHOT/);
});

test("publish-dev-static allowlists dests and never talks to docker", () => {
  assert.match(publish, /zed-dev\) remote="\/data\/srv\/zedkit"/);
  assert.match(publish, /zed-epic-73\) remote="\/data\/srv\/zedkit-epic-73"/);
  assert.match(publish, /unknown dest/);
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
  const epicJob = jobBlock(epic, "deploy");
  assert.match(prodJob, /^\s+environment:\s+production\s*$/m);
  assert.doesNotMatch(devJob, /^\s+environment:\s/m);
  assert.doesNotMatch(epicJob, /^\s+environment:\s/m);
  assert.doesNotMatch(dev, /^\s+environment:\s+production\s*$/m);
  assert.doesNotMatch(epic, /^\s+environment:\s+production\s*$/m);
  assert.match(prodJob, /secrets\.DOCS_DEPLOY_KEY/);
  assert.match(devJob, /secrets\.DOCS_DEPLOY_KEY/);
  assert.match(epicJob, /secrets\.DOCS_DEPLOY_KEY/);
  assert.match(devJob, /195\.154\.208\.75/);
  assert.match(epicJob, /195\.154\.208\.75/);
  assert.match(dev, /Repo-level DOCS_DEPLOY_KEY is the staging key/);
  assert.match(epic, /Repo-level DOCS_DEPLOY_KEY is the staging key/);
});

test("epic-73 preview deploys to its own dest and concurrency group", () => {
  assert.match(epic, /branches: \["epic\/73-redesign"\]/);
  assert.match(epic, /pnpm --filter @zedtech\/zedkit-docs build/);
  assert.match(epic, /bash deploy\/publish-dev-static\.sh zed-dev zed-epic-73/);
  assert.match(epic, /curl -sf "https:\/\/\$\{host\}\/dev-build\.txt"/);
  assert.match(epic, /epic-73\.dev\.zedkit\.app/);
  assert.match(epic, /getent ahosts/);
  assert.match(epic, /does not resolve yet; skipping live stamp check/);
  assert.match(epic, /group: deploy-epic-73/);
  assert.doesNotMatch(epic, /group: deploy-dev/);
  assert.doesNotMatch(epic, /deploy\/deploy\.sh/);
  assert.doesNotMatch(epic, /docker compose/);
  assert.doesNotMatch(epic, /\/srv\/app/);
});
