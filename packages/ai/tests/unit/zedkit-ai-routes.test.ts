import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir, readManifest } from "#kit.js";

type Route = {
  command: string;
  skill: string;
  via: string;
  cues: string[];
};

const OPEN_SKILL = new Set(["fix", "improve-from-review", "setup-ai"]);

const FIXTURES: Array<{ request: string; expected: string[] }> = [
  { request: "audit this package for unused exports", expected: ["audit"] },
  { request: "attack this plan before we code", expected: ["challenge"] },
  { request: "fix the failing typecheck in core", expected: ["fix"] },
  { request: "turn this audit file into a plan", expected: ["from-audit"] },
  { request: "write a handoff for the next session", expected: ["handoff"] },
  { request: "implement ticket 311 first batch", expected: ["implement"] },
  { request: "encode today's correction into AGENTS.md", expected: ["improve-config"] },
  { request: "apply this punchlist then encode the miss", expected: ["improve-from-review"] },
  {
    request: "coordinate plan then implement then review",
    expected: ["orchestrate"],
  },
  { request: "plan GitHub issue 311", expected: ["plan"] },
  { request: "draft the PR body for this branch", expected: ["pr"] },
  { request: "quick wins in the docs nav, audit only", expected: ["quick-wins"] },
  {
    request: "research how Agent Skills frontmatter works",
    expected: ["research"],
  },
  { request: "review the diff since origin/dev", expected: ["review"] },
  {
    request: "set up AI on this repo from what it contains",
    expected: ["setup-ai"],
  },
  {
    request: "zedkit-ai: set up this repo from what it contains",
    expected: ["setup-ai"],
  },
  {
    request: "we are unsure of the facts; audit this topic first",
    expected: ["to-audit"],
  },
  { request: "triage the issue inbox and write briefs", expected: ["triage"] },
  {
    request: "onboard agents after installing the kit",
    expected: ["setup-ai"],
  },
  { request: "ship npm / cut a Version PR", expected: ["release-stop"] },
  {
    request: "implement and merge to main",
    expected: ["implement", "release-stop"],
  },
  { request: "review this button PR", expected: ["review"] },
  { request: "add a public export to src/index.ts", expected: ["plan"] },
  { request: "fix it", expected: ["fix", "plan"] },
  {
    request: "improve from review and also publish",
    expected: ["improve-from-review", "release-stop"],
  },
  {
    request: "search the repo: are there other unused checks",
    expected: ["audit"],
  },
  { request: "run orchestrate on this mix", expected: ["orchestrate"] },
  { request: "quick wins implement QW-1 in the nav", expected: ["quick-wins"] },
  { request: "write the PR body, do not merge", expected: ["pr"] },
  { request: "challenge the attached spec", expected: ["challenge"] },
  {
    request: "from-audit then implement the findings",
    expected: ["from-audit"],
  },
];

function skillText(): string {
  return readFileSync(join(kitDir(), "skills", "zedkit-ai", "SKILL.md"), "utf8");
}

function routesText(): string {
  return readFileSync(join(kitDir(), "skills", "zedkit-ai", "routes.md"), "utf8");
}

function parseRoutes(md: string): Route[] {
  const rows: Route[] = [];
  for (const line of md.split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    const command = cells[0] ?? "";
    if (command === "" || command === "Command" || /^:?-{3,}:?$/.test(command)) {
      continue;
    }
    rows.push({
      command,
      skill: cells[1] ?? "",
      via: cells[2] ?? "",
      cues: (cells[3] ?? "")
        .split(";")
        .map((cue) => cue.trim())
        .filter(Boolean),
    });
  }
  return rows;
}

function classify(request: string, routes: Route[]): string {
  const text = request.toLowerCase();
  let best = routes[0]?.command ?? "";
  let bestScore = -1;
  for (const row of routes) {
    const score = row.cues.reduce(
      (sum, cue) => (text.includes(cue.toLowerCase()) ? sum + cue.length : sum),
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      best = row.command;
    }
  }
  return best;
}

describe("zedkit-ai entry skill", () => {
  it("lists every kit command except the entry itself, plus the release overlay", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const commands = (manifest.value.commands ?? []).filter((name) => name !== "zedkit-ai");
    expect(commands).toContain("setup-ai");
    expect(commands).toHaveLength(17);
    const routes = parseRoutes(routesText());
    const overlay = routes.filter((row) => row.command === "release-stop");
    expect(overlay).toHaveLength(1);
    expect(overlay[0]?.via).toBe("stop");
    const dest = routes.filter((row) => row.command !== "release-stop");
    expect(dest.map((row) => row.command).sort()).toEqual([...commands].sort());
    const improve = dest.find((row) => row.command === "improve-config");
    expect(improve?.skill).toBe("rules-upkeep");
    for (const row of dest) {
      expect(existsSync(join(kitDir(), "skills", row.skill, "SKILL.md")), row.skill).toBe(
        true,
      );
      if (OPEN_SKILL.has(row.command)) expect(row.via, row.command).toBe("open-skill");
      else expect(row.via, row.command).toBe("orchestrate");
    }
  });

  it("ships /zedkit-ai once and no zk alias", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const listed = manifest.value.commands ?? [];
    expect(listed.filter((name) => name === "zedkit-ai")).toEqual(["zedkit-ai"]);
    expect(listed).not.toContain("zk");
    expect(existsSync(join(kitDir(), "commands", "zk.md"))).toBe(false);
    const cmd = readFileSync(join(kitDir(), "commands", "zedkit-ai.md"), "utf8");
    expect(cmd).toContain("before any tool call");
    expect(cmd).toContain("run the `zedkit-ai` skill on `$ARGUMENTS`");
    expect(cmd).not.toContain("/zk");
  });

  it("reuses orchestrate and tokenomics; does not grow a parallel router", () => {
    const text = skillText();
    expect(text).toContain("disable-model-invocation: true");
    expect(text).toContain("orchestrate");
    expect(text).toContain("Playbook:");
    expect(text).toContain(".agents/tokenomics.md");
    expect(text).toContain("zedkit-ai route");
    expect(text).toContain("--provider");
    expect(text).toContain("by path");
    expect(text.toLowerCase()).not.toContain("skill tool");
    expect(text).not.toMatch(/^providers:/mu);
    expect(text).not.toContain("## Dispatch");
    expect(text).not.toContain("| Kind |");
    expect(text).toContain("model matrix");
    expect(text).toMatch(/cheap[^]*build[^]*check|cheap cells/iu);
    expect(text).toContain("business or user-need decisions");
    expect(text).toMatch(/reviews/iu);
    expect(text).not.toMatch(/\b(claude|gpt|gemini|composer|sonnet|opus)-[^\s`]+/iu);
  });

  it("prints the Route card before any tool call and quotes UI DoD v2", () => {
    const text = skillText();
    expect(text).toContain("before any tool call");
    expect(text).toContain("Route:");
    expect(text).toContain("Stakes:");
    expect(text).toContain("Mode:");
    expect(text).toContain("Chain:");
    expect(text).toContain("Gates:");
    expect(text).toContain("Stops:");
    expect(text).toContain("375");
    expect(text).toContain("809");
    expect(text).toContain("1440");
    expect(text).toContain("UNSEEN");
    expect(text).toContain("Confidence");
    expect(text).toContain("6");
    expect(text).toContain("definition-of-done");
    expect(text).toContain("Visual work");
    expect(text.split("\n").length).toBeLessThanOrEqual(90);
  });

  it("routes at least 27 of 31 labelled requests, covering every inventoried command", () => {
    expect(FIXTURES).toHaveLength(31);
    const routes = parseRoutes(routesText());
    const hits = FIXTURES.filter((fixture) =>
      fixture.expected.includes(classify(fixture.request, routes)),
    );
    expect(hits.length, JSON.stringify(
      FIXTURES.filter((fixture) => !fixture.expected.includes(classify(fixture.request, routes)))
        .map((fixture) => [fixture.request, classify(fixture.request, routes)]),
    )).toBeGreaterThanOrEqual(27);
    const covered = new Set(FIXTURES.flatMap((fixture) => fixture.expected));
    const dest = routes
      .map((row) => row.command)
      .filter((name) => name !== "release-stop");
    for (const name of dest) {
      expect(covered, `fixture for ${name}`).toContain(name);
    }
    expect(covered).toContain("setup-ai");
    expect(covered).toContain("release-stop");
  });

  it("does not add a zk command file among kit commands", () => {
    const files = readdirSync(join(kitDir(), "commands")).filter((name) => name.endsWith(".md"));
    expect(files).not.toContain("zk.md");
  });
});
