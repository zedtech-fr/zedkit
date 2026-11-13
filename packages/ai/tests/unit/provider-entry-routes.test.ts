import { cpSync, existsSync, readdirSync, readFileSync, readlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { hasMarker } from "#generate.js";
import { installKit } from "#install.js";
import { deprecatedCommandNames, kitDir, readManifest } from "#kit.js";
import { run, tempDir } from "./helpers.js";

const SENTINEL = "KIT_B_ROUTES_SENTINEL_314_UNIQUE";
const pkgRoot = join(fileURLToPath(new URL("../..", import.meta.url)));

function leftoverStems(): string[] {
  const manifest = readManifest();
  if (!manifest.ok) throw manifest.error;
  return deprecatedCommandNames(manifest.value);
}

function install(dest: string, provider: string): void {
  const result = installKit({ dest, preset: "starter", providers: [provider] });
  if (!result.ok) throw result.error;
}

function expectRoutes(path: string): void {
  expect(existsSync(path), path).toBe(true);
  expect(readFileSync(path, "utf8")).toContain("| Command");
}

function expectNoLeftovers(dest: string, commandsDir: string): void {
  for (const stem of leftoverStems()) {
    expect(existsSync(join(dest, commandsDir, `${stem}.md`)), `${commandsDir}/${stem}.md`).toBe(false);
  }
}

function kitB(): string {
  const kit = tempDir();
  cpSync(kitDir(), kit, { recursive: true });
  const routes = join(kit, "skills/zedkit-ai/routes.md");
  writeFileSync(routes, `${readFileSync(routes, "utf8")}\n<!-- ${SENTINEL} -->\n`);
  return kit;
}

const MATRIX = [
  {
    provider: "cursor",
    title: "Cursor: command link, skill routes.md, no leftover command stems",
    routes: ".cursor/skills/zedkit-ai/routes.md",
    leftovers: [".cursor/commands", ".agents/commands"],
    extra(dest: string) {
      const command = join(dest, ".cursor/commands/zedkit-ai.md");
      expect(readlinkSync(command)).toBe("../../.agents/commands/zedkit-ai.md");
      expect(readFileSync(command, "utf8")).toContain("run the `zedkit-ai` skill");
    },
  },
  {
    provider: "claude",
    title: "Claude: commands link, installed skill keeps disable-model-invocation and by-path, routes.md, no leftovers",
    routes: ".claude/skills/zedkit-ai/routes.md",
    leftovers: [".claude/commands"],
    extra(dest: string) {
      expect(readlinkSync(join(dest, ".claude/commands"))).toBe("../.agents/commands");
      expect(existsSync(join(dest, ".claude/commands/zedkit-ai.md"))).toBe(true);
      const skill = readFileSync(join(dest, ".claude/skills/zedkit-ai/SKILL.md"), "utf8");
      expect(skill).toContain("disable-model-invocation: true");
      expect(skill).toContain("by path");
    },
  },
  {
    provider: "codex",
    title: "Codex: shared source only — AGENTS.md, entry command, routes.md, no leftover stems",
    routes: ".agents/skills/zedkit-ai/routes.md",
    leftovers: [".agents/commands"],
    extra(dest: string) {
      expect(existsSync(join(dest, ".cursor"))).toBe(false);
      expect(existsSync(join(dest, ".claude"))).toBe(false);
      expect(existsSync(join(dest, "AGENTS.md"))).toBe(true);
      expect(existsSync(join(dest, ".agents/commands/zedkit-ai.md"))).toBe(true);
    },
  },
  {
    provider: "muse",
    title: "Muse: skill routes.md, generated agents, leftover stems absent (commands are not a Muse scan root)",
    routes: ".agents/skills/zedkit-ai/routes.md",
    leftovers: [".agents/commands"],
    extra(dest: string) {
      const agents = readdirSync(join(dest, ".agents/agents")).filter((name) => name.endsWith(".md"));
      expect(agents.some((name) => hasMarker(readFileSync(join(dest, ".agents/agents", name), "utf8")))).toBe(true);
    },
  },
] as const;

describe("provider entry command and routes.md", () => {
  for (const row of MATRIX) {
    it(row.title, () => {
      const dest = tempDir();
      install(dest, row.provider);
      expectRoutes(join(dest, row.routes));
      for (const dir of row.leftovers) expectNoLeftovers(dest, dir);
      row.extra(dest);
    });
  }

  it("setup --kit kit-b installs that kit's routes.md; validate --kit is green; omitted --kit has no sentinel", () => {
    const kit = kitB();
    const withKit = tempDir();
    expect(run("setup", withKit, "--kit", kit, "--provider", "cursor").code).toBe(0);
    expect(readFileSync(join(withKit, ".agents/skills/zedkit-ai/routes.md"), "utf8")).toContain(SENTINEL);
    expect(readFileSync(join(withKit, ".cursor/skills/zedkit-ai/routes.md"), "utf8")).toContain(SENTINEL);

    const validated = run("validate", withKit, "--kit", kit);
    expect(validated.code).toBe(0);
    const last = validated.text.trimEnd().split("\n").at(-1) ?? "";
    expect(last).toMatch(/^ok\b/);

    const bundled = tempDir();
    expect(run("setup", bundled, "--provider", "cursor").code).toBe(0);
    const bundledRoutes = readFileSync(join(bundled, ".agents/skills/zedkit-ai/routes.md"), "utf8");
    expect(bundledRoutes).not.toContain(SENTINEL);
    expect(bundledRoutes).toContain("| Command");
  });

  it("pins the Muse fallback in the package README", () => {
    const readme = readFileSync(join(pkgRoot, "README.md"), "utf8");
    expect(readme).toContain("zedkit-ai: set up this repo from what it contains");
    expect(readme).toContain("does not scan `.agents/commands`");
    expect(readme).toContain("invoke the `zedkit-ai` skill by name");
  });

  it("does not publish a changeset that maps guides MDX to /docs/ai/setup", () => {
    const dir = join(pkgRoot, "../..", ".changeset");
    for (const name of readdirSync(dir)) {
      if (!name.endsWith(".md") || name === "README.md") continue;
      const text = readFileSync(join(dir, name), "utf8");
      expect(text, name).not.toMatch(/guides MDX to `\/docs\/ai\/setup`/);
    }
  });
});
