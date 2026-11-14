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
const sources = readFileSync(join(root, "apps/docs/features/reviews/DATA-SOURCES.md"), "utf8");

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

test("staging docs builds set the runs API base; production stays ingest-free", () => {
  assert.match(dev, /NEXT_PUBLIC_ZEDOS_RUNS_API_BASE: https:\/\/dev\.zedkit\.app/);
  assert.match(epic, /NEXT_PUBLIC_ZEDOS_RUNS_API_BASE: https:\/\/dev\.zedkit\.app/);
  assert.match(dev, /secrets\.GITHUB_TOKEN/);
  assert.match(epic, /secrets\.GITHUB_TOKEN/);
  assert.doesNotMatch(dev, /ingest-public-reviews/);
  assert.doesNotMatch(epic, /ingest-public-reviews/);
  assert.doesNotMatch(dev, /copy-public-reviews-snapshot/);
  assert.doesNotMatch(epic, /copy-public-reviews-snapshot/);
  assert.doesNotMatch(dev, /PUBLIC_REVIEWS_SNAPSHOT/);
  assert.doesNotMatch(epic, /PUBLIC_REVIEWS_SNAPSHOT/);
  assert.doesNotMatch(prod, /ingest-public-reviews/);
  assert.doesNotMatch(prod, /copy-public-reviews-snapshot/);
  assert.doesNotMatch(prod, /PUBLIC_REVIEWS_SNAPSHOT/);
  assert.doesNotMatch(prod, /NEXT_PUBLIC_ZEDOS_RUNS_API_BASE/);
  assert.match(sources, /NEXT_PUBLIC_ZEDOS_RUNS_API_BASE/);
  assert.match(sources, /deploy-epic-preview/);
  assert.match(sources, /Production `deploy-docs.yml` is/);
  assert.doesNotMatch(sources, /ingest-public-reviews/);
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
