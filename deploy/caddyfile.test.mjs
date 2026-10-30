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

test("Caddyfile serves the dev site from its own root without the suggest proxy", () => {
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
  const devRoutes = [];
  const visit = (node) => {
    if (Array.isArray(node)) {
      node.forEach(visit);
    } else if (node && typeof node === "object") {
      const hosts = (node.match ?? []).flatMap((m) => m.host ?? []);
      if (hosts.includes("dev.zedkit.app")) devRoutes.push(node);
      Object.values(node).forEach(visit);
    }
  };
  visit(config);
  assert.equal(devRoutes.length, 1);
  const dev = JSON.stringify(devRoutes[0]);
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
