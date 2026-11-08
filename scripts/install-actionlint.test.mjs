import { chmodSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const script = join(root, "scripts/install-actionlint.sh");
const workflow = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
const PIN = "f4c76b71db5755a713e6055cbb0857ed07e103e028bda117817660ebadb4386f";

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

function writeArchive(dir, contents = "#!/bin/sh\necho fixture\n") {
  writeFileSync(join(dir, "actionlint"), contents, { mode: 0o755 });
  const archive = join(dir, "ok.tgz");
  execFileSync("tar", ["-czf", archive, "actionlint"], { cwd: dir });
  const bytes = readFileSync(archive);
  return { archive, sha: sha256(bytes) };
}

function writeCurl(dir, { primary, fallback }) {
  const mock = join(dir, "curl");
  const log = join(dir, "curl.log");
  writeFileSync(
    mock,
    `#!/usr/bin/env bash
set -euo pipefail
log=${JSON.stringify(log)}
primary_src=${JSON.stringify(primary ?? "")}
fallback_src=${JSON.stringify(fallback ?? "")}
printf '%s\\n' "$@" >> "$log"
echo --- >> "$log"
out=""
url=""
args=("$@")
i=0
while [ "$i" -lt "\${#args[@]}" ]; do
  a="\${args[$i]}"
  case "$a" in
    -o)
      i=$((i + 1))
      out="\${args[$i]}"
      ;;
    -H|--retry|--retry-delay|--max-time|--proto)
      i=$((i + 1))
      ;;
    --fail|--silent|--show-error|--location|--retry-connrefused|--tlsv1.2|--)
      ;;
    -*)
      ;;
    *)
      url="$a"
      ;;
  esac
  i=$((i + 1))
done
if [ -z "$out" ] || [ -z "$url" ]; then
  echo "mock curl: missing -o or url" >&2
  exit 2
fi
if [[ "$url" == *"/releases/download/"* ]]; then
  if [ -z "$primary_src" ]; then
    echo "curl: (22) The requested URL returned error: 504" >&2
    exit 22
  fi
  cp "$primary_src" "$out"
  exit 0
fi
if [[ "$url" == *"/releases/assets/"* ]]; then
  if [ -z "$fallback_src" ]; then
    echo "curl: (22) The requested URL returned error: 403" >&2
    exit 22
  fi
  cp "$fallback_src" "$out"
  exit 0
fi
echo "mock curl: unexpected url $url" >&2
exit 2
`,
  );
  chmodSync(mock, 0o755);
  writeFileSync(log, "");
  return { mock, log };
}

function run({ dest, sha, token, curl }) {
  return execFileSync("bash", [script], {
    encoding: "utf8",
    env: {
      ...process.env,
      CURL_BIN: curl,
      ACTIONLINT_DIR: dest,
      ACTIONLINT_SHA256: sha,
      ACTIONLINT_CURL_RETRY: "0",
      ACTIONLINT_CURL_RETRY_DELAY: "0",
      ACTIONLINT_CURL_MAX_TIME: "5",
      GITHUB_TOKEN: token ?? "",
    },
  });
}

function throws(opts) {
  let captured = "";
  assert.throws(
    () => run(opts),
    (err) => {
      captured = `${err.stderr ?? ""}${err.stdout ?? ""}${err.message ?? ""}`;
      err.captured = captured;
      return true;
    },
  );
  return { captured };
}

test("ci.yml installs via the script, not a Releases pipe", () => {
  const lint = workflow.split(/^ {2}workflow-lint:/m)[1]?.split(/^ {2}\S/m)[0] ?? "";
  assert.notEqual(lint, "", "workflow-lint job missing");
  assert.match(lint, /bash scripts\/install-actionlint\.sh/);
  assert.match(lint, /\.\/actionlint "\$\{files\[@\]\}"/);
  assert.doesNotMatch(lint, /curl .*\| tar xz/);
  assert.match(lint, /GITHUB_TOKEN: \$\{\{ secrets\.GITHUB_TOKEN \}\}/);
});

test("script pins v1.7.10, official API fallback, TLS, and the release sha256", () => {
  const body = readFileSync(script, "utf8");
  assert.match(body, /VERSION="1\.7\.10"/);
  assert.match(body, new RegExp(PIN));
  assert.match(body, /ASSET_ID="334518670"/);
  assert.match(body, /PRIMARY_URL="https:\/\/github\.com\/rhysd\/actionlint\/releases\/download\/v\$\{VERSION\}\/\$\{ASSET\}"/);
  assert.match(body, /FALLBACK_URL="https:\/\/api\.github\.com\/repos\/rhysd\/actionlint\/releases\/assets\/\$\{ASSET_ID\}"/);
  assert.match(body, /--proto "=https"/);
  assert.match(body, /--tlsv1\.2/);
  assert.doesNotMatch(body, /(?:\s-k\b)|--insecure|--location-trusted/);
  assert.doesNotMatch(body, /jsdelivr|ghproxy|fastly/i);
  assert.match(body, /Accept: application\/octet-stream/);
});

test("primary success verifies the pin and skips the API fallback", () => {
  const dir = mkdtempSync(join(tmpdir(), "actionlint-primary-"));
  const { archive, sha } = writeArchive(dir);
  const dest = join(dir, "dest");
  const { mock, log } = writeCurl(dir, { primary: archive, fallback: "" });
  const out = run({ dest, sha, curl: mock, token: "test-token" });
  assert.match(out, /primary verified/);
  assert.equal(readFileSync(join(dest, "actionlint"), "utf8"), "#!/bin/sh\necho fixture\n");
  const logText = readFileSync(log, "utf8");
  assert.match(logText, /\/releases\/download\//);
  assert.match(logText, /Authorization: Bearer test-token/);
  assert.doesNotMatch(logText, /\/releases\/assets\//);
});

test("primary 504 falls back to the official API asset with Accept and token", () => {
  const dir = mkdtempSync(join(tmpdir(), "actionlint-fallback-"));
  const { archive, sha } = writeArchive(dir);
  const dest = join(dir, "dest");
  const { mock, log } = writeCurl(dir, { primary: "", fallback: archive });
  const out = run({ dest, sha, curl: mock, token: "test-token" });
  assert.match(out, /fallback verified/);
  assert.equal(readFileSync(join(dest, "actionlint"), "utf8"), "#!/bin/sh\necho fixture\n");
  const logText = readFileSync(log, "utf8");
  assert.match(logText, /\/releases\/download\//);
  assert.match(logText, /\/releases\/assets\/334518670/);
  assert.match(logText, /Accept: application\/octet-stream/);
  assert.match(logText, /Authorization: Bearer test-token/);
});

test("hash mismatch does not extract and fails closed", () => {
  const dir = mkdtempSync(join(tmpdir(), "actionlint-mismatch-"));
  const { archive } = writeArchive(dir, "tampered");
  const dest = join(dir, "dest");
  const { mock } = writeCurl(dir, { primary: archive, fallback: archive });
  const err = throws({
    dest,
    sha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    curl: mock,
  });
  assert.match(err.captured, /sha256 mismatch \(fail closed\)/);
  assert.equal(existsSync(join(dest, "actionlint")), false);
});

test("both sources failing fails closed without an extracted binary", () => {
  const dir = mkdtempSync(join(tmpdir(), "actionlint-fail-"));
  const dest = join(dir, "dest");
  const { mock } = writeCurl(dir, { primary: "", fallback: "" });
  const err = throws({
    dest,
    sha: PIN,
    curl: mock,
  });
  assert.match(err.captured, /could not download a verified/);
  assert.equal(existsSync(join(dest, "actionlint")), false);
});

test("fallback JSON body is a hash mismatch, not executed", () => {
  const dir = mkdtempSync(join(tmpdir(), "actionlint-json-"));
  const json = join(dir, "meta.json");
  writeFileSync(json, JSON.stringify({ message: "Not Found" }));
  const dest = join(dir, "dest");
  const { mock } = writeCurl(dir, { primary: "", fallback: json });
  const err = throws({ dest, sha: PIN, curl: mock });
  assert.match(err.captured, /sha256 mismatch \(fail closed\)/);
  assert.equal(existsSync(join(dest, "actionlint")), false);
});

test("invalid sha256 pin fails closed before download", () => {
  const dir = mkdtempSync(join(tmpdir(), "actionlint-pin-"));
  const dest = join(dir, "dest");
  const { mock, log } = writeCurl(dir, { primary: "", fallback: "" });
  const err = throws({ dest, sha: "nope", curl: mock });
  assert.match(err.captured, /invalid sha256 pin/);
  assert.equal(readFileSync(log, "utf8"), "");
});
