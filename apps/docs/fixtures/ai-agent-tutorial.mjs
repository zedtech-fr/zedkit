import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { main } from "../../../packages/ai/dist/cli.js";

function capture(argv) {
  const out = [];
  const err = [];
  const code = main(argv, {
    out: (line) => out.push(line),
    err: (line) => err.push(line),
  });
  return { code, out: out.join("\n"), err: err.join("\n") };
}

/** Same flow as the set-up-your-coding-agents tutorial (empty scratch repo). */
export function runEmptyRepoTutorial(dir) {
  const init = capture(["init", dir, "--provider", "cursor", "--preset", "full"]);
  if (init.code !== 0) {
    throw new Error(`init failed: ${init.err || init.out}`);
  }
  if (!existsSync(join(dir, ".agents/skills/ground-truth/SKILL.md"))) {
    throw new Error("init did not copy kit skills into .agents/");
  }
  if (!existsSync(join(dir, ".cursor/rules/project.mdc"))) {
    throw new Error("init did not wire Cursor rules");
  }
  const validate = capture(["validate", dir]);
  if (validate.code !== 0 || validate.out.trim() !== "ok") {
    throw new Error(`validate failed: code=${validate.code} out=${validate.out} err=${validate.err}`);
  }
  return { initLines: init.out, validateOut: validate.out.trim() };
}

/** Repo that already has AGENTS.md without the ladder section (tutorial scenario). */
export function runExistingAgentsTutorial(dir) {
  writeFileSync(join(dir, "AGENTS.md"), "# Team rules\n\nUse our internal style guide.\n", "utf8");
  const init = capture(["init", dir, "--provider", "cursor", "--preset", "full"]);
  if (init.code !== 0) throw new Error(`init on existing AGENTS.md failed: ${init.err}`);
  const body = readFileSync(join(dir, "AGENTS.md"), "utf8");
  if (!body.toLowerCase().includes("ladder")) {
    throw new Error("init should append the ladder section to an existing AGENTS.md");
  }
  const validate = capture(["validate", dir]);
  if (validate.code !== 0 || validate.out.trim() !== "ok") {
    throw new Error(`validate after append failed: ${validate.out}`);
  }
}

export function withScratchDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "zedkit-ai-tutorial-"));
  try {
    fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
