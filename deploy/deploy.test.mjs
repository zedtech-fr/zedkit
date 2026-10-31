import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { createServer as createNetServer } from "node:net";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const CURRENT = {
  spacing: "0.25rem",
  borderWidth: "1px",
  radius: "0.5rem",
  bodyLeading: "1.6",
  headingLeading: "1.1",
  headingTracking: "-0.025em",
  labelTracking: "0.025em",
  fontSans: "Inter, sans-serif",
  fontDisplay: "Inter, sans-serif",
  light: {
    background: "0 0% 100%",
    foreground: "240 10% 3.9%",
    primary: "240 5.9% 10%",
    accent: "240 4.8% 95.9%",
    border: "240 5.9% 90%",
  },
  dark: {
    background: "240 10% 3.9%",
    foreground: "0 0% 98%",
    primary: "0 0% 98%",
    accent: "240 3.7% 15.9%",
    border: "240 3.7% 15.9%",
  },
  shadowSm: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
  shadowMd: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
};

function writeExec(file, body) {
  writeFileSync(file, body, { mode: 0o755 });
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = createNetServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

function listenUpstream() {
  const hits = [];
  const server = createServer((req, res) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      hits.push(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      const body = JSON.stringify({
        choices: [{ message: { content: JSON.stringify({ spacing: "0.4rem" }) } }],
      });
      res.writeHead(200, {
        "content-type": "application/json",
        "content-length": Buffer.byteLength(body),
      });
      res.end(body);
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({ server, hits, port: address.port });
    });
  });
}

function installMocks(bin, state) {
  mkdirSync(bin, { recursive: true });
  mkdirSync(state, { recursive: true });
  writeExec(
    join(bin, "ssh"),
    `#!/bin/bash
exec bash -c "$2"
`,
  );
  writeExec(
    join(bin, "scp"),
    `#!/bin/bash
while [[ "\${1:-}" == -* ]]; do shift; done
dest="\${@: -1}"
dest="\${dest#*:}"
files=("\${@:1:$#-1}")
if [[ "$dest" == */ ]]; then
  mkdir -p "$dest"
  cp "\${files[@]}" "$dest"
else
  mkdir -p "$(dirname "$dest")"
  cp "\${files[0]}" "$dest"
fi
`,
  );
  writeExec(
    join(bin, "rsync"),
    `#!/bin/bash
args=()
for a in "$@"; do
  case "$a" in
    *:*) args+=("\${a#*:}") ;;
    *) args+=("$a") ;;
  esac
done
exec /usr/bin/rsync "\${args[@]}"
`,
  );
  writeExec(
    join(state, "start-suggest.sh"),
    `#!/bin/bash
set -euo pipefail
state="${state}"
remote="${"${DEPLOY_MOCK_REMOTE}"}"
if [[ -f "$state/suggest.pid" ]]; then
  old="$(cat "$state/suggest.pid")"
  kill "$old" 2>/dev/null || true
  for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
    kill -0 "$old" 2>/dev/null || break
    sleep 0.05
  done
  kill -9 "$old" 2>/dev/null || true
fi
set -a
source "$remote/current/suggest.env"
set +a
export PORT="$SUGGEST_PORT"
cd "$remote/current/suggest"
nohup node server.mjs >> "$state/suggest.log" 2>&1 &
echo $! > "$state/suggest.pid"
for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 43 44 45 46 47 48 49 50; do
  if node --input-type=module -e 'import net from "node:net"; const s = net.connect(Number(process.env.PORT), "127.0.0.1", () => { s.end(); process.exit(0); }); s.on("error", () => process.exit(1));'; then
    exit 0
  fi
  sleep 0.05
done
echo "suggest did not listen" >&2
cat "$state/suggest.log" >&2 || true
exit 1
`,
  );
  writeExec(
    join(bin, "docker"),
    `#!/bin/bash
printf '%s\\n' "$*" >> "${state}/docker.log"
if [[ "$1" == "run" ]]; then
  exit 0
fi
if [[ "$1" != "compose" ]]; then
  echo "mock docker: unexpected $*" >&2
  exit 1
fi
shift
cmd="$1"
shift
case "$cmd" in
  exec)
    case "$*" in
      *reload*)
        [[ -f "${state}/caddy-up" ]]
        exit $?
        ;;
    esac
    exit 1
    ;;
  ps)
    case "$*" in
      *suggest*)
        if [[ -f "${state}/suggest.pid" ]] && kill -0 "$(cat "${state}/suggest.pid")" 2>/dev/null; then
          echo suggest
        fi
        exit 0
        ;;
      *caddy*)
        if [[ -f "${state}/caddy-up" ]]; then echo caddy; fi
        exit 0
        ;;
    esac
    exit 0
    ;;
  up)
    case "$*" in
      *suggest*)
        "${state}/start-suggest.sh"
        exit $?
        ;;
      *caddy*)
        touch "${state}/caddy-up"
        exit 0
        ;;
      *)
        touch "${state}/caddy-up"
        "${state}/start-suggest.sh"
        exit $?
        ;;
    esac
    ;;
  *)
    exit 0
    ;;
esac
`,
  );
}

test("deploy A then B with Caddy already up announces B and uses the new parameters", async (t) => {
  const tmp = await mkdtemp(join(tmpdir(), "deploy-suggest-"));
  const bin = join(tmp, "bin");
  const state = join(tmp, "state");
  const remote = join(tmp, "remote");
  const envFile = join(tmp, "suggest.env");
  const outDir = join(root, "apps/docs/out");
  const outIndex = join(outDir, "index.html");
  const createdOut = !existsSync(outIndex);
  const upstream = await listenUpstream();
  const suggestPort = await freePort();
  installMocks(bin, state);
  writeFileSync(join(state, "caddy-up"), "");
  if (createdOut) {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(outIndex, "<!doctype html><title>docs</title>");
  }

  t.after(async () => {
    const pidFile = join(state, "suggest.pid");
    if (existsSync(pidFile)) {
      const pid = (await readFile(pidFile, "utf8")).trim();
      if (pid) spawnSync("kill", [pid]);
    }
    await new Promise((resolve) => upstream.server.close(() => resolve()));
    if (createdOut) await rm(outIndex, { force: true });
    await rm(tmp, { recursive: true, force: true });
  });

  const writeEnv = (model, maxTokens) => {
    writeFileSync(
      envFile,
      [
        `IDENTITY_AI_BASE_URL=http://127.0.0.1:${upstream.port}`,
        "IDENTITY_AI_API_KEY=test-key",
        `IDENTITY_AI_MODEL=${model}`,
        `IDENTITY_AI_MAX_TOKENS=${maxTokens}`,
        "",
      ].join("\n"),
    );
  };

  const deploy = (sha) => {
    const result = spawnSync("bash", [join(root, "deploy/deploy.sh"), "user@example", remote], {
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        DEPLOY_SHA: sha,
        DEPLOY_SUGGEST_ENV: envFile,
        DEPLOY_MOCK_REMOTE: remote,
        SUGGEST_PORT: String(suggestPort),
      },
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  };

  const version = async () => {
    const res = await fetch(`http://127.0.0.1:${suggestPort}/api/identity/suggest/version`, {
      headers: { connection: "close" },
    });
    assert.equal(res.status, 200);
    return res.json();
  };

  const suggest = async () => {
    const res = await fetch(`http://127.0.0.1:${suggestPort}/api/identity/suggest`, {
      method: "POST",
      headers: { "content-type": "application/json", connection: "close" },
      body: JSON.stringify({ prompt: "warmer", current: CURRENT }),
    });
    assert.equal(res.status, 200);
  };

  writeEnv("model-a", "111");
  deploy("sha-a");
  const first = await version();
  assert.equal(first.id.startsWith("sha-a"), true, JSON.stringify(first));
  assert.equal(first.model, "model-a");
  assert.equal(first.maxTokens, 111);
  await suggest();
  assert.equal(upstream.hits[0].model, "model-a");
  assert.equal(upstream.hits[0].max_tokens, 111);

  writeEnv("model-b", "222");
  deploy("sha-b");
  const second = await version();
  assert.notEqual(second.id, first.id);
  assert.equal(second.id.startsWith("sha-b"), true, JSON.stringify(second));
  assert.equal(second.model, "model-b");
  assert.equal(second.maxTokens, 222);
  assert.equal(JSON.stringify(second).includes("test-key"), false);
  await suggest();
  assert.equal(upstream.hits[1].model, "model-b");
  assert.equal(upstream.hits[1].max_tokens, 222);

  const pid = (await readFile(join(state, "suggest.pid"), "utf8")).trim();
  deploy("sha-b");
  assert.equal((await readFile(join(state, "suggest.pid"), "utf8")).trim(), pid);
  const again = await version();
  assert.equal(again.id, second.id);
  assert.equal(again.model, "model-b");

  const log = await readFile(join(state, "docker.log"), "utf8");
  assert.match(log, /compose up -d --no-deps --force-recreate caddy/);
});
