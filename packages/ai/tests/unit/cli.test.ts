import { existsSync, mkdirSync, readFileSync, readdirSync, symlinkSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { main } from "#cli.js";
import { ALL_PROVIDERS } from "#install.js";
import { COMMAND, put, SKILL, tempDir, usageProviders } from "./helpers.js";

function run(...argv: string[]): { code: number; text: string; errors: string } {
  const out: string[] = [];
  const errors: string[] = [];
  const code = main(argv, { out: (line) => out.push(line), err: (line) => errors.push(line) });
  return { code, text: out.join("\n"), errors: errors.join("\n") };
}

const VALIDATE_OK =
  "ok \u2014 structural kit checks only (skills, agents, commands, wiring, tokenomics, atlas paths); browser rendering, focus, hosting and on-target behavior are NOT checked by validate";

function expectValidateOk(dest: string, allowDeprecationWarnings = false): void {
  const result = run("validate", dest);
  expect(result.code).toBe(0);
  expect(result.errors).toBe("");
  const lines = result.text.split("\n");
  expect(lines.at(-1)).toBe(VALIDATE_OK);
  const extra = lines.slice(0, -1).filter((line) => line !== "");
  if (!allowDeprecationWarnings) {
    expect(extra).toEqual([]);
    return;
  }
  expect(extra.every((line) => /: warning: command "[^"]+" is deprecated; use \/zedkit-ai$/.test(line))).toBe(true);
}

describe("cli", () => {
  it("prints usage with no arguments (exit 0) and for unknown commands (exit 2)", () => {
    expect(run().code).toBe(0);
    const unknown = run("nope");
    expect(unknown.code).toBe(2);
    expect(unknown.errors).toContain("zedkit-ai <command>");
    expect(unknown.text).toBe("");
  });

  it("prints usage on stdout for --help and -h (exit 0)", () => {
    for (const flag of ["--help", "-h"]) {
      const result = run(flag);
      expect(result.code, flag).toBe(0);
      expect(result.text, flag).toContain("zedkit-ai <command>");
      expect(result.errors, flag).toBe("");
    }
  });

  it("lists presets, agents and commands", () => {
    const { code, text } = run("list");
    expect(code).toBe(0);
    expect(text).toContain("preset starter:");
    expect(text).toContain("preset core:");
    expect(text).toContain("agents: explorer");
    expect(text).toContain("commands: review");
  });

  it("init installs into the given directory", () => {
    const dest = tempDir();
    const { code, text } = run("init", dest, "--target", "claude");
    expect(code).toBe(0);
    expect(text).toContain("AGENTS.md");
    expect(text).toContain("/setup-ai");
    expect(existsSync(join(dest, ".agents/skills/ground-truth/SKILL.md"))).toBe(true);
    expect(existsSync(join(dest, "CLAUDE.md"))).toBe(true);
    expect(existsSync(join(dest, ".cursor"))).toBe(false);
  });

  it("setup installs with setup preset and prints the /setup-ai next step", () => {
    const dest = tempDir();
    const { code, text } = run("setup", dest, "--provider", "cursor");
    expect(code).toBe(0);
    expect(text).toContain("/setup-ai");
    expect(text).toContain("validate");
    expect(text).toContain("product.md");
    expect(existsSync(join(dest, ".cursor/commands/setup-ai.md"))).toBe(true);
    expect(existsSync(join(dest, ".agents/skills/domain-modeling/SKILL.md"))).toBe(true);
  });

  it("setup exits 0 with phase C checklist when package.json is malformed", () => {
    const dest = tempDir();
    put(dest, "package.json", "{ broken\n");
    const { code, text } = run("setup", dest, "--provider", "cursor");
    expect(code).toBe(0);
    expect(text).toContain("product.md");
    expect(text).not.toContain("prettier: add to .prettierignore");
    expect(run("validate", dest).code).toBe(0);
  });

  it("init prints prettier ignore lines when the host uses Prettier", () => {
    const dest = tempDir();
    put(dest, "package.json", JSON.stringify({ devDependencies: { prettier: "3.9.0" } }));
    put(dest, ".prettierrc.json", "{}\n");
    const { code, text } = run("init", dest, "--provider", "cursor", "--preset", "starter");
    expect(code).toBe(0);
    expect(text).toContain("prettier: add to .prettierignore:");
    expect(text).toContain(".agents/");
    expect(text).toContain(".cursor/skills/");
  });

  it("scan prints the prettier hint early when kit paths are missing from .prettierignore", () => {
    const dest = tempDir();
    put(dest, "package.json", JSON.stringify({ devDependencies: { prettier: "3.9.0" } }));
    const { code, text } = run("scan", dest);
    expect(code).toBe(0);
    expect(text).toContain("prettier: add to .prettierignore:");
    expect(text).toContain(".agents/");
    const plain = tempDir();
    expect(run("scan", plain).text).not.toContain("prettier:");
  });

  it("setup on an empty dir uses the setup preset, validate ok, second run no-op", () => {
    const dest = tempDir();
    expect(run("setup", dest, "--provider", "cursor").code).toBe(0);
    expect(existsSync(join(dest, ".agents/skills/domain-modeling/SKILL.md"))).toBe(true);
    expect(existsSync(join(dest, ".agents/agents/product-director.md"))).toBe(true);
    expectValidateOk(dest, true);
    const again = run("setup", dest, "--provider", "cursor");
    expect(again.code).toBe(0);
    const writes = again.text.split("\n").filter((line) => /^(copy|link|write)\s/u.test(line));
    expect(writes).toEqual([]);
  });

  it("setup re-run does not send the user back to /setup-ai once product.md exists", () => {
    const dest = tempDir();
    const first = run("setup", dest, "--provider", "cursor");
    expect(first.text).toContain("next: run /setup-ai");
    put(dest, ".agents/product.md", "# Product\n");
    const again = run("setup", dest, "--provider", "cursor");
    expect(again.code).toBe(0);
    expect(again.text).toContain("next: validate, then phase E score");
    const hints = again.text.split("\n").filter((line) => /^(next|note):/u.test(line));
    expect(hints.some((line) => line.includes("/setup-ai"))).toBe(false);
  });

  it("setup --preset starter installs starter skills only", () => {
    const dest = tempDir();
    expect(run("setup", dest, "--provider", "cursor", "--preset", "starter").code).toBe(0);
    expect(existsSync(join(dest, ".agents/skills/domain-modeling/SKILL.md"))).toBe(false);
    expect(existsSync(join(dest, ".agents/skills/ground-truth/SKILL.md"))).toBe(true);
  });

  it("setup keeps pre-existing .cursor skills, agents, and commands", () => {
    const dest = tempDir();
    put(dest, ".cursor/skills/team-own/SKILL.md", "team\n");
    put(dest, ".cursor/agents/explorer.md", "custom explorer\n");
    put(dest, ".cursor/commands/review.md", "custom review\n");
    expect(run("setup", dest, "--provider", "cursor").code).toBe(0);
    expect(readFileSync(join(dest, ".cursor/skills/team-own/SKILL.md"), "utf8")).toBe("team\n");
    expect(readFileSync(join(dest, ".cursor/agents/explorer.md"), "utf8")).toBe("custom explorer\n");
    expect(readFileSync(join(dest, ".cursor/commands/review.md"), "utf8")).toBe("custom review\n");
    expectValidateOk(dest, true);
  });

  it("init wires cursor when asked", () => {
    const dest = tempDir();
    expect(run("init", dest, "--target", "cursor").code).toBe(0);
    expect(existsSync(join(dest, ".cursor/rules/project.mdc"))).toBe(true);
    expect(existsSync(join(dest, ".claude"))).toBe(false);
  });

  it("init --provider selects providers, all wires everything", () => {
    const codex = tempDir();
    expect(run("init", codex, "--provider", "codex").code).toBe(0);
    expect(existsSync(join(codex, "AGENTS.md"))).toBe(true);
    expect(existsSync(join(codex, ".claude"))).toBe(false);
    expect(existsSync(join(codex, ".cursor"))).toBe(false);
    const all = tempDir();
    expect(run("init", all, "--provider", "all").code).toBe(0);
    expect(existsSync(join(all, ".claude/commands/review.md"))).toBe(true);
    expect(existsSync(join(all, ".cursor/commands/review.md"))).toBe(true);
  });

  it("init rejects an unknown provider", () => {
    const result = run("init", tempDir(), "--provider", "pilot");
    expect(result.code).toBe(2);
    expect(result.errors).toContain('unknown provider "pilot"');
  });

  it("init --adopt keeps a colliding cursor command and writes a kit sidecar", () => {
    const dest = tempDir();
    put(dest, ".cursor/commands/review.md", "mine\n");
    const { code, text } = run("init", dest, "--provider", "cursor", "--adopt");
    expect(code).toBe(0);
    expect(text).toContain("kept user file");
    expect(readFileSync(join(dest, ".cursor/commands/review.md"), "utf8")).toBe("mine\n");
    expect(existsSync(join(dest, ".cursor/commands/review.kit.md"))).toBe(true);
  });

  it("init --dry-run writes nothing", () => {
    const dest = tempDir();
    const { code, text } = run("init", dest, "--dry-run");
    expect(code).toBe(0);
    expect(text).toContain("dry run");
    expect(existsSync(join(dest, "AGENTS.md"))).toBe(false);
  });

  it("init rejects an unknown or empty target, an unknown preset, option and extra argument, on stderr", () => {
    const dest = tempDir();
    for (const args of [
      ["--target", "emacs"],
      ["--target", ""],
      ["--target", "claude,"],
      ["--preset", "nope"],
      ["--preset", "constructor"],
      ["--wat"],
    ]) {
      const result = run("init", dest, ...args);
      expect(result.code, args.join(" ")).toBe(2);
      expect(result.errors, args.join(" ")).toContain("error:");
      expect(result.text, args.join(" ")).toBe("");
    }
    expect(run("init", dest, "extra").errors).toContain('unexpected argument "extra"');
    expect(run("init", dest, "extra").errors).toContain("zedkit-ai --help");
    expect(readdirSync(dest)).toEqual([]);
  });

  it("accepts exactly the installer providers plus all", () => {
    const dest = tempDir();
    expect(ALL_PROVIDERS.length).toBeGreaterThan(0);
    for (const provider of ALL_PROVIDERS) {
      const result = run("init", dest, "--provider", provider, "--dry-run");
      expect(result.errors, provider).not.toContain("unknown provider");
    }
    const bad = run("init", dest, "--provider", "emacs", "--dry-run");
    expect(bad.code).toBe(2);
    const listed = /\(([^)]+)\)/u.exec(bad.errors)?.[1]?.split(", ").sort() ?? [];
    expect(listed, "error provider list").toEqual([...ALL_PROVIDERS, "all"].sort());
  });

  it("lists the accepted providers in USAGE", () => {
    const bad = run("init", tempDir(), "--provider", "emacs", "--dry-run");
    const listed = /\(([^)]+)\)/u.exec(bad.errors)?.[1]?.split(", ").sort() ?? [];
    expect(usageProviders().sort(), "USAGE provider list").toEqual(listed);
  });

  it("validate does not print ok when a skill references a missing skill", () => {
    const root = tempDir();
    put(root, "skills/alpha/SKILL.md", `${SKILL("alpha")}\nCall the Skill tool with "missing".\n`);
    const result = run("validate", root);
    expect(result.code).toBe(1);
    expect(result.text).toContain('references skill "missing"');
    expect(result.text).not.toMatch(/^ok$/);
    expect(result.text).toContain("1 problem");
  });

  it("validate exits 0 on a good dir and 1 on a bad one", () => {
    const good = tempDir();
    put(good, "skills/alpha/SKILL.md", SKILL("alpha"));
    expectValidateOk(good);
    const bad = tempDir();
    put(bad, "skills/alpha/SKILL.md", SKILL("wrong"));
    const result = run("validate", bad);
    expect(result.code).toBe(1);
    expect(result.text).toContain("1 problem");
    expect(result.text).not.toContain("1 problems");
    put(bad, "skills/beta/SKILL.md", SKILL("wrong"));
    const both = run("validate", bad).text;
    expect(both).toContain("3 problems");
    expect(both).toContain('duplicate skill name "wrong"');
  });

  it("validate success names its structural scope and what it does not check", () => {
    const good = tempDir();
    put(good, "skills/alpha/SKILL.md", SKILL("alpha"));
    const { code, text } = run("validate", good);
    expect(code).toBe(0);
    expect(text).toContain("structural kit checks only");
    expect(text).toContain("NOT checked by validate");
    for (const outside of ["browser rendering", "focus", "hosting", "on-target behavior"]) expect(text).toContain(outside);
    expect(text).not.toContain("setup-log shape");
  });

  it("validate green agrees with the installed close-out record: functional acceptance stays UNVERIFIED", () => {
    const dest = tempDir();
    expect(run("setup", dest, "--provider", "cursor").code).toBe(0);
    const { code, text } = run("validate", dest);
    expect(code).toBe(0);
    expect(text).toContain("NOT checked by validate");
    const record = readFileSync(
      join(dest, ".agents/skills/setup-ai/templates/setup-log.template.md"),
      "utf8",
    );
    for (const state of [
      "implemented",
      "statically checked",
      "behaviorally checked",
      "deployed",
      "verified on target",
    ])
      expect(record).toContain(state);
    expect(record).toContain("UNVERIFIED");
    expect(record).toContain("NOT checked by validate");
  });

  it("validate accepts a project root and reports provider-copy drift", () => {
    const root = tempDir();
    put(root, ".agents/skills/alpha/SKILL.md", SKILL("alpha"));
    put(root, ".agents/commands/run.md", COMMAND("alpha"));
    mkdirSync(join(root, ".cursor/commands"), { recursive: true });
    symlinkSync("../../.agents/commands/run.md", join(root, ".cursor/commands/run.md"));
    expectValidateOk(root);
    unlinkSync(join(root, ".cursor/commands/run.md"));
    put(root, ".cursor/commands/run.md", COMMAND("alpha", "Edited."));
    for (const dir of [root, join(root, ".agents")]) {
      const result = run("validate", dir);
      expect(result.code, dir).toBe(1);
      expect(result.text, dir).toContain("user file kept");
      expect(result.text, dir).toContain("npx @zedtech/zedkit-ai sync");
    }
  });

  it("validate fails on a model name outside tokenomics.md and passes once it is marked", () => {
    const root = tempDir();
    put(root, ".agents/skills/alpha/SKILL.md", SKILL("alpha"));
    put(root, "AGENTS.md", "# Rules\n\nUse gpt-5 for reviews.\n");
    for (const dir of [root, join(root, ".agents")]) {
      const result = run("validate", dir);
      expect(result.code, dir).toBe(1);
      expect(result.text, dir).toContain('AGENTS.md:3: model name "gpt-5" outside tokenomics.md');
      expect(result.text, dir).toContain("1 problem");
    }
    put(root, "AGENTS.md", "# Rules\n\nUse gpt-5 for reviews. <!-- zk:model-ok -->\n");
    expectValidateOk(root);
  });

  it("validate --setup reports a partial setup as failing, never ok (P2.5)", () => {
    const root = tempDir();
    put(root, "PLAN.md", "intro-first: printed before any tool call\n");
    put(root, "AGENTS.md", "# Rules\n\nSee .agents/tokenomics.md.\n");
    put(root, ".agents/skills/alpha/SKILL.md", SKILL("alpha"));
    put(
      root,
      ".agents/setup-log/reading.md",
      [
        "# Reading",
        "",
        "| # | slice | note |",
        "| - | ----- | ---- |",
        "| 1 | . | read `AGENTS.md:1` |",
        "",
        "**Budget:** none found",
        "",
        "## Meaning check",
        "",
        "| id | verdict | code | resolution |",
        "| -- | ------- | ---- | ---------- |",
        "| R1-1 | match | cites `AGENTS.md:1` | kept |",
        "",
      ].join("\n"),
    );
    put(root, ".agents/domain/ownership.md", "# Ownership\n\nsource: owner\n");
    put(root, ".agents/setup-log.md", "- nested-agents: none — one folder\n");
    put(
      root,
      ".agents/atlas.md",
      ["## Where", "", "| Topic | Entry | Why |", "| ----- | ----- | --- |", "| Plan | `PLAN.md` | coverage |", "| Rules | `AGENTS.md` | entry |", "| Policy | `.agents/tokenomics.md` | routing |", ""].join("\n"),
    );
    put(
      root,
      ".agents/tokenomics.md",
      "---\nschema: 1\nproviders:\n  cursor:\n    build:\n      standard: { model: inherit, effort: medium }\n    decide:\n      sensitive: { model: inherit, effort: high }\n---\n\n<!-- inherit-reason: cursor cannot route per spawn; reading done inline -->\n",
    );
    const result = run("validate", root, "--setup");
    expect(result.code).toBe(1);
    expect(result.text).toContain("partial, not complete");
    expect(result.text.split("\n")).not.toContain("ok");
  });

  it("validate fails on a missing directory and on unexpected arguments", () => {
    const missing = run("validate", "/definitely/not/here");
    expect(missing.code).toBe(2);
    expect(missing.errors).toContain("zedkit-ai init");
    expect(run("validate", "a", "b").code).toBe(2);
    expect(run("validate", "--help").code).toBe(2);
    expect(run("list", "--foo").code).toBe(2);
  });

  describe("route", () => {
    function project(tokenomics = ""): string {
      const dir = tempDir();
      put(
        dir,
        ".agents/agents/verifier.md",
        `---\nname: verifier\ndescription: "Verifies. Use when needed."\n---\n\nBody.\n`,
      );
      if (tokenomics !== "") put(dir, ".agents/tokenomics.md", tokenomics);
      return dir;
    }

    it("prints the cell, needs with sources, gates and read-only for a check call", () => {
      const { code, text } = run(
        "route",
        "verifier",
        "--kind",
        "check",
        "--stakes",
        "standard",
        "--provider",
        "cursor",
        "--dir",
        project(),
      );
      expect(code).toBe(0);
      expect(text).toContain("agent: verifier");
      expect(text).toContain("kind: check (call)");
      expect(text).toContain("stakes: standard, column sensitive");
      expect(text).toContain(
        "needs: reasoning=high (agent), context=medium (agent)",
      );
      expect(text).toContain("model: inherit");
      expect(text).toContain("effort: high");
      expect(text).toContain("context window: 256k");
      expect(text).toContain("gates: review=recommended");
      expect(text).toContain("read-only: yes");
      expect(text).not.toContain("note:");
    });

    it("--json prints the route, and --reasoning/--context override the agent default for this call", () => {
      const { code, text } = run(
        "route",
        "verifier",
        "--kind",
        "check",
        "--stakes",
        "standard",
        "--provider",
        "claude",
        "--reasoning",
        "low",
        "--context",
        "large",
        "--json",
        "--dir",
        project(),
      );
      expect(code).toBe(0);
      const route = JSON.parse(text) as {
        column: string;
        effort: string;
        contextWindow: string;
        needsSource: Record<string, string>;
        provider: string;
      };
      expect(route).toMatchObject({
        provider: "claude",
        column: "sensitive",
        effort: "medium",
        contextWindow: "1M",
      });
      expect(route.needsSource).toEqual({ reasoning: "call", context: "call" });
    });

    it("routes orchestrator to muse when --provider muse despite cursor default_provider", () => {
      const root = fileURLToPath(new URL("../../../../", import.meta.url));
      const { code, text } = run(
        "route",
        "orchestrator",
        "--kind",
        "decide",
        "--stakes",
        "standard",
        "--provider",
        "muse",
        "--dir",
        root,
      );
      expect(code).toBe(0);
      expect(text).toContain("provider: muse");
      expect(text).toContain("model: muse-spark-1.3-contributor");
    });

    it("reads the project's tokenomics.md and its default_provider", () => {
      const dir = project(
        "---\nschema: 1\ndefault_provider: claude\nproviders:\n  claude:\n    check:\n      sensitive: { model: my-check-model }\n---\n",
      );
      const { code, text } = run(
        "route",
        "verifier",
        "--kind",
        "check",
        "--stakes",
        "sensitive",
        "--dir",
        dir,
      );
      expect(code).toBe(0);
      expect(text).toContain("provider: claude");
      expect(text).toContain("model: my-check-model");
    });

    it("exits 2 on a fast cell unless --allow-fast", () => {
      const dir = project(
        "---\nschema: 1\ndefault_provider: cursor\nproviders:\n  cursor:\n    check:\n      standard: { model: composer-2.5-fast }\n---\n",
      );
      const denied = run(
        "route",
        "verifier",
        "--kind",
        "check",
        "--stakes",
        "standard",
        "--reasoning",
        "low",
        "--dir",
        dir,
      );
      expect(denied.code).toBe(2);
      expect(denied.errors).toContain("composer-2.5-fast");
      expect(denied.errors).toContain("explicitly requested it in this request");
      const allowed = run(
        "route",
        "verifier",
        "--kind",
        "check",
        "--stakes",
        "standard",
        "--reasoning",
        "low",
        "--allow-fast",
        "--dir",
        dir,
      );
      expect(allowed.code).toBe(0);
      expect(allowed.text).toContain("model: composer-2.5-fast");
    });

    it("sync and validate take the same --allow-fast the route already accepts", () => {
      const dir = project(
        "---\nschema: 1\ndefault_provider: cursor\nproviders:\n  cursor:\n    check:\n      standard: { model: composer-2.5-fast }\n      sensitive: { model: composer-2.5-fast }\n---\n",
      );
      put(dir, ".cursor/rules/x.mdc", "x\n");
      const unknown = run("sync", "--allow-fast", dir);
      expect(unknown.errors).not.toContain("Unknown option");
      const denied = run("sync", dir, "--provider", "cursor");
      expect(denied.code).toBe(2);
      expect(denied.errors).toContain("--allow-fast");
      const allowed = run("sync", dir, "--provider", "cursor", "--allow-fast");
      expect(allowed.code).toBe(0);
      const validateDenied = run("validate", dir);
      expect(validateDenied.code).toBe(1);
      expect(validateDenied.text).toContain("--allow-fast");
      const validateAllowed = run("validate", dir, "--allow-fast");
      expect(validateAllowed.code).toBe(0);
      expect(validateAllowed.text).toContain("ok");
    });

    it("init and setup take --allow-fast and write nothing when a fast cell is refused", () => {
      const fast = `---
schema: 1
default_provider: cursor
providers:
  cursor:
    check:
      standard: { model: composer-2.5-fast }
      sensitive: { model: composer-2.5-fast }
---
`;
      for (const command of ["init", "setup"] as const) {
        const dest = tempDir();
        put(dest, ".agents/tokenomics.md", fast);
        const unknown = run(command, "--allow-fast", dest, "--provider", "cursor");
        expect(unknown.errors, command).not.toContain("Unknown option");
        const empty = tempDir();
        put(empty, ".agents/tokenomics.md", fast);
        const denied = run(command, empty, "--provider", "cursor");
        expect(denied.code, command).toBe(2);
        expect(denied.errors, command).toContain("--allow-fast");
        expect(existsSync(join(empty, "AGENTS.md")), command).toBe(false);
        expect(existsSync(join(empty, ".cursor")), command).toBe(false);
        const allowed = tempDir();
        put(allowed, ".agents/tokenomics.md", fast);
        const ok = run(command, allowed, "--provider", "cursor", "--allow-fast");
        expect(ok.code, command).toBe(0);
        expect(existsSync(join(allowed, "AGENTS.md")), command).toBe(true);
      }
    });

    it("setup refuses a custom agent's fast cell before writing", () => {
      const dest = tempDir();
      const policy = `---
schema: 1
default_provider: cursor
providers:
  cursor:
    check:
      critical: { model: composer-2.5-fast }
---
`;
      const agent = "# custom-check\n\nProject check.\n";
      const meta = `${JSON.stringify(
        {
          "custom-check": {
            role: "custom check",
            default_needs: { reasoning: "medium", context: "medium" },
            default_kind: "check",
            min_stakes: "critical",
          },
        },
        null,
        2,
      )}\n`;
      put(dest, ".agents/tokenomics.md", policy);
      put(dest, ".agents/agents/custom-check.md", agent);
      put(dest, ".agents/agents.meta.json", meta);
      const denied = run("setup", dest, "--provider", "cursor");
      expect(denied.code).toBe(2);
      expect(denied.errors).toContain("custom-check");
      expect(denied.errors).toContain("composer-2.5-fast");
      expect(denied.errors).toContain("--allow-fast");
      expect(existsSync(join(dest, "AGENTS.md"))).toBe(false);
      expect(existsSync(join(dest, ".cursor"))).toBe(false);
      expect(existsSync(join(dest, ".agents/skills"))).toBe(false);
      expect(readFileSync(join(dest, ".agents/agents/custom-check.md"), "utf8")).toBe(agent);
      expect(readFileSync(join(dest, ".agents/tokenomics.md"), "utf8")).toBe(policy);
      expect(readFileSync(join(dest, ".agents/agents.meta.json"), "utf8")).toBe(meta);
    });

    it("validate names an adopt sidecar and still exits 0 when nothing else is wrong", () => {
      const dir = tempDir();
      put(dir, ".agents/skills/alpha/SKILL.md", SKILL("alpha"));
      put(dir, ".agents/skills/zk-alpha/SKILL.md", SKILL("zk-alpha"));
      const result = run("validate", dir);
      expect(result.code).toBe(0);
      expect(result.text).toContain("zk-alpha");
      expect(result.text).toContain("commands still run your old skill names");
      expect(result.text).toContain("ok");
    });

    it("an omitted kind uses the hint and says so; critical prints the second review route", () => {
      const { text } = run(
        "route",
        "verifier",
        "--stakes",
        "critical",
        "--provider",
        "cursor",
        "--dir",
        project(),
      );
      expect(text).toContain("kind: check (hint)");
      expect(text).toContain("note: kind not given, using check (hint)");
      expect(text).toContain("second review: cursor model inherit effort high");
      expect(text).toContain("warning: cannot prove distinct model");
    });

    it("exits 2 on a missing or bad flag, no provider, an unknown agent, a kind the agent forbids and an invalid file", () => {
      const dir = project();
      const base = ["--dir", dir];
      expect(run("route", ...base).errors).toContain("needs an agent name");
      expect(run("route", "verifier", ...base).errors).toContain(
        "needs --stakes",
      );
      expect(
        run("route", "verifier", "--stakes", "urgent", ...base).errors,
      ).toContain("--stakes must be one of");
      expect(
        run(
          "route",
          "verifier",
          "--stakes",
          "standard",
          "--kind",
          "review",
          ...base,
        ).errors,
      ).toContain("--kind must be one of");
      expect(
        run(
          "route",
          "verifier",
          "--stakes",
          "standard",
          "--provider",
          "gemini",
          ...base,
        ).errors,
      ).toContain("--provider must be one of");
      expect(
        run(
          "route",
          "verifier",
          "--stakes",
          "standard",
          "--reasoning",
          "max",
          ...base,
        ).errors,
      ).toContain("--reasoning must be one of");
      expect(
        run("route", "verifier", "--stakes", "standard", ...base).errors,
      ).toContain("no provider");
      expect(
        run(
          "route",
          "nobody",
          "--stakes",
          "standard",
          "--provider",
          "cursor",
          ...base,
        ).errors,
      ).toContain('unknown agent "nobody"');
      expect(
        run(
          "route",
          "verifier",
          "--stakes",
          "standard",
          "--kind",
          "build",
          "--provider",
          "cursor",
          ...base,
        ).errors,
      ).toContain("cannot be invoked as build");
      const bad = project("---\nschema: 1\ntiers: {}\n---\n");
      const invalid = run(
        "route",
        "verifier",
        "--stakes",
        "standard",
        "--provider",
        "cursor",
        "--dir",
        bad,
      );
      expect(invalid.code).toBe(2);
      expect(invalid.errors).toContain("tokenomics.md: tiers: unknown key");
      expect(run("route", "a", "b", "--stakes", "standard").code).toBe(2);
    });
  });
});
