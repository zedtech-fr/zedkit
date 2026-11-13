import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { main } from "#cli.js";
import { MARKER_PREFIX } from "#generate.js";
import { installKit } from "#install.js";
import { kitDir } from "#kit.js";
import { syncKit } from "#sync.js";
import { checkDrift, validateKit } from "#validate.js";
import { failingIssues, put, SKILL, tempDir } from "./helpers.js";

const SENTINEL_SKILL = "kit-flag-sentinel";
const SENTINEL_BODY = "SENTINEL_KIT_FLAG_BODY_297_UNIQUE";
const SENTINEL_AGENT = "SENTINEL_AGENT_BODY_297_UNIQUE";

function run(...argv: string[]): { code: number; text: string; errors: string } {
  const out: string[] = [];
  const errors: string[] = [];
  const code = main(argv, { out: (line) => out.push(line), err: (line) => errors.push(line) });
  return { code, text: out.join("\n"), errors: errors.join("\n") };
}

function patchedKit(): string {
  const kit = tempDir();
  cpSync(kitDir(), kit, { recursive: true });
  put(kit, `skills/${SENTINEL_SKILL}/SKILL.md`, `${SKILL(SENTINEL_SKILL)}\n${SENTINEL_BODY}\n`);
  const manifest = JSON.parse(readFileSync(join(kit, "kit.json"), "utf8")) as {
    presets: Record<string, string[] | "*">;
  };
  for (const name of ["starter", "setup"] as const) {
    const list = manifest.presets[name];
    if (Array.isArray(list) && !list.includes(SENTINEL_SKILL)) list.push(SENTINEL_SKILL);
  }
  writeFileSync(join(kit, "kit.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  const explorer = readFileSync(join(kit, "agents/explorer.md"), "utf8");
  writeFileSync(join(kit, "agents/explorer.md"), `${explorer}\n${SENTINEL_AGENT}\n`);
  return kit;
}

describe("--kit <dir>", () => {
  it("is accepted by setup, init, sync and validate", () => {
    const kit = patchedKit();
    for (const argv of [
      ["setup", tempDir(), "--kit", kit, "--provider", "cursor"],
      ["init", tempDir(), "--kit", kit, "--provider", "cursor"],
      ["sync", tempDir(), "--kit", kit, "--provider", "cursor"],
      ["validate", tempDir(), "--kit", kit],
    ] as const) {
      const result = run(...argv);
      expect(result.errors, argv[0]).not.toContain("Unknown option");
    }
  });

  it("setup and init copy a fixture-only skill and agent sentinel", () => {
    const kit = patchedKit();
    for (const command of ["setup", "init"] as const) {
      const dest = tempDir();
      const result = run(command, dest, "--kit", kit, "--provider", "cursor");
      expect(result.code, command).toBe(0);
      expect(existsSync(join(dest, `.agents/skills/${SENTINEL_SKILL}/SKILL.md`)), command).toBe(true);
      expect(readFileSync(join(dest, ".agents/agents/explorer.md"), "utf8"), command).toContain(SENTINEL_AGENT);
      expect(result.text, command).not.toContain(SENTINEL_BODY);
      expect(result.errors, command).not.toContain(SENTINEL_BODY);
    }
  });

  it("omitted --kit installs the bundled kit, not a fixture-only skill", () => {
    const dest = tempDir();
    expect(run("setup", dest, "--provider", "cursor").code).toBe(0);
    expect(existsSync(join(dest, `.agents/skills/${SENTINEL_SKILL}/SKILL.md`))).toBe(false);
    expect(existsSync(join(dest, ".agents/skills/ground-truth/SKILL.md"))).toBe(true);
  });

  it("setup --kit then sync --kit restores the fixture agent, not the bundled one", () => {
    const kit = patchedKit();
    const dest = tempDir();
    expect(run("setup", dest, "--kit", kit, "--provider", "cursor").code).toBe(0);
    put(
      dest,
      ".agents/agents/explorer.md",
      `---\n${MARKER_PREFIX}.agents/agents/explorer.md\n---\nmarked placeholder\n`,
    );
    const synced = run("sync", dest, "--kit", kit, "--provider", "cursor");
    expect(synced.code).toBe(0);
    expect(synced.text).not.toContain(SENTINEL_BODY);
    expect(readFileSync(join(dest, ".cursor/agents/explorer.md"), "utf8")).toContain(SENTINEL_AGENT);
  });

  it("setup --kit then validate --kit stays green and does not flag bundled-only names", () => {
    const kit = patchedKit();
    const dest = tempDir();
    expect(run("setup", dest, "--kit", kit, "--provider", "cursor").code).toBe(0);
    const result = run("validate", dest, "--kit", kit);
    expect(result.code).toBe(0);
    expect(result.text).toContain("ok");
    expect(result.text).not.toContain(`${SENTINEL_SKILL}: no `);
    expect(result.text).not.toContain(SENTINEL_BODY);
  });

  it("library installKit({ kit }) and syncKit({ kit }) match the CLI", () => {
    const kit = patchedKit();
    const dest = tempDir();
    const installed = installKit({ dest, kit, preset: "setup", providers: ["cursor"] });
    expect(installed.ok).toBe(true);
    expect(existsSync(join(dest, `.agents/skills/${SENTINEL_SKILL}/SKILL.md`))).toBe(true);
    expect(failingIssues(validateKit(join(dest, ".agents"), kit))).toEqual([]);
    expect(
      checkDrift(dest, join(dest, ".agents"), { kit }).filter((i) => !i.message.startsWith("warning:")),
    ).toEqual([]);
    put(
      dest,
      ".agents/agents/explorer.md",
      `---\n${MARKER_PREFIX}.agents/agents/explorer.md\n---\nmarked placeholder\n`,
    );
    const synced = syncKit({ dest, kit, providers: ["cursor"] });
    expect(synced.ok).toBe(true);
    expect(readFileSync(join(dest, ".cursor/agents/explorer.md"), "utf8")).toContain(SENTINEL_AGENT);
  });

  it("refuses a custom-kit agent header before writing", () => {
    const kit = patchedKit();
    const metaPath = join(kit, "agents.meta.json");
    const meta = JSON.parse(readFileSync(metaPath, "utf8")) as Record<string, Record<string, unknown>>;
    const explorer = meta.explorer;
    if (explorer === undefined) throw new Error("bundled kit must ship explorer");
    delete explorer.default_kind;
    explorer.kinds = ["check"];
    writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`);
    const dest = tempDir();
    const result = installKit({ dest, kit, providers: ["cursor"] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("explorer");
      expect(result.error.message).toContain("cannot be invoked as build");
    }
    expect(existsSync(join(dest, "AGENTS.md"))).toBe(false);
  });

  it("library defaults still use the bundled kit", () => {
    const dest = tempDir();
    const installed = installKit({ dest, providers: ["cursor"] });
    expect(installed.ok).toBe(true);
    expect(existsSync(join(dest, `.agents/skills/${SENTINEL_SKILL}/SKILL.md`))).toBe(false);
    expect(failingIssues(validateKit(join(dest, ".agents")))).toEqual([]);
  });

  it("empty, missing, and file --kit exit 2 and write nothing", () => {
    const emptyDest = tempDir();
    const empty = run("setup", emptyDest, "--kit", "", "--provider", "cursor");
    expect(empty.code).toBe(2);
    expect(empty.errors).toContain("error:");
    expect(existsSync(join(emptyDest, "AGENTS.md"))).toBe(false);

    const missingDest = tempDir();
    const missingKit = join(missingDest, "missing-kit");
    const missing = run("setup", missingDest, "--kit", missingKit, "--provider", "cursor");
    expect(missing.code).toBe(2);
    expect(missing.errors).toContain("error:");
    expect(missing.errors).toContain("--kit");
    expect(missing.errors).toContain(missingKit);
    expect(existsSync(join(missingDest, "AGENTS.md"))).toBe(false);

    const fileDest = tempDir();
    const fileKit = join(fileDest, "not-a-kit");
    put(fileDest, "not-a-kit", "x\n");
    const asFile = run("setup", fileDest, "--kit", fileKit, "--provider", "cursor");
    expect(asFile.code).toBe(2);
    expect(asFile.errors).toContain("error:");
    expect(asFile.errors).toContain("--kit");
    expect(asFile.errors).toContain(fileKit);
    expect(existsSync(join(fileDest, "AGENTS.md"))).toBe(false);
  });

  it("relative --kit resolves from the process cwd", () => {
    const kit = patchedKit();
    const dest = tempDir();
    const rel = relative(process.cwd(), kit);
    expect(rel.startsWith("/") || /^[A-Za-z]:/u.test(rel)).toBe(false);
    const result = run("setup", dest, "--kit", rel, "--provider", "cursor");
    expect(result.code).toBe(0);
    expect(existsSync(join(dest, `.agents/skills/${SENTINEL_SKILL}/SKILL.md`))).toBe(true);
  });

  it("scan and route still reject --kit as an unknown option", () => {
    const dest = tempDir();
    const scan = run("scan", dest, "--kit", dest);
    expect(scan.code).toBe(2);
    expect(scan.errors).toContain("Unknown option '--kit'");
    const routed = run("route", "explorer", "--stakes", "standard", "--kit", dest);
    expect(routed.code).toBe(2);
    expect(routed.errors).toContain("Unknown option '--kit'");
  });
});
