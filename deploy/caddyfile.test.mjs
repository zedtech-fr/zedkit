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
