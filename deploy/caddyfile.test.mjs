import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));

test("Caddyfile adapts with handle_errors at site level", () => {
  const result = spawnSync(
    "docker",
    [
      "run",
      "--rm",
      "-v",
      `${here}/Caddyfile:/etc/caddy/Caddyfile:ro`,
      "caddy:2",
      "caddy",
      "validate",
      "--config",
      "/etc/caddy/Caddyfile",
    ],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout + result.stderr, /Valid configuration/);
});

test("Caddyfile declares each site host exactly once", () => {
  const result = spawnSync(
    "docker",
    [
      "run",
      "--rm",
      "-v",
      `${here}/Caddyfile:/etc/caddy/Caddyfile:ro`,
      "caddy:2",
      "caddy",
      "adapt",
      "--config",
      "/etc/caddy/Caddyfile",
    ],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const config = JSON.parse(result.stdout.slice(result.stdout.indexOf("{")));
  const counts = new Map();
  for (const server of Object.values(config.apps.http.servers)) {
    for (const route of server.routes ?? []) {
      for (const m of route.match ?? []) {
        for (const host of m.host ?? []) {
          counts.set(host, (counts.get(host) ?? 0) + 1);
        }
      }
    }
  }
  assert.ok(counts.get("zedkit.app") >= 1);
  for (const [host, count] of counts) {
    assert.equal(count, 1, `${host} declared ${count} times`);
  }
  const devRoute = Object.values(config.apps.http.servers)
    .flatMap((server) => server.routes ?? [])
    .find((route) =>
      (route.match ?? []).some((m) => (m.host ?? []).includes("dev.zedkit.app")),
    );
  assert.ok(devRoute, "dev site route missing");
  const dev = JSON.stringify(devRoute);
  assert.ok(dev.includes('"root":"/srv/site-dev"'), dev);
  assert.ok(dev.includes("noindex, nofollow"), dev);
  assert.ok(!dev.includes("reverse_proxy"), dev);
});

test("Caddyfile validates on Caddy 2.6 (host floor, no newer syntax)", () => {
  const result = spawnSync(
    "docker",
    [
      "run",
      "--rm",
      "-v",
      `${here}/Caddyfile:/etc/caddy/Caddyfile:ro`,
      "caddy:2.6.2",
      "caddy",
      "validate",
      "--config",
      "/etc/caddy/Caddyfile",
    ],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout + result.stderr, /Valid configuration/);
});
