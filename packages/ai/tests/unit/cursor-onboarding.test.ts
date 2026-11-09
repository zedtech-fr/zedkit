import { kitDir } from "#kit.js";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

describe("cursor onboarding copy", () => {
  it("keeps the mini prompt in README and kit/cursor-mini-prompt.txt in sync", () => {
    const mini = readFileSync(join(kitDir(), "cursor-mini-prompt.txt"), "utf8").trimEnd();
    const readme = readFileSync(join(pkgRoot, "README.md"), "utf8");
    expect(readme).toContain(mini);
    expect(mini).toContain("https://zedkit.app/ai/setup.md");
  });

  it("documents setup and /setup-ai in cursor-onboarding.md", () => {
    const md = readFileSync(join(kitDir(), "cursor-onboarding.md"), "utf8");
    const pkg = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8")) as { version: string };
    // Expectations derive from the candidate package version: only the prose names the selected published target.
    expect(md).toContain(`npx @zedtech/zedkit-ai@${pkg.version} setup --provider cursor`);
    expect(md).toContain("/setup-ai");
    expect(md).toContain(`npx @zedtech/zedkit-ai@${pkg.version} validate`);
    expect(md).toContain("current published version");
    expect(md).toContain(`npx @zedtech/zedkit-ai@${pkg.version} sync`);
    expect(md).toMatch(/skip only if .* already pins/);
  });

  it("does not tell the paste prompt to spawn a fast model, and names the scan buckets", () => {
    const md = readFileSync(join(kitDir(), "cursor-onboarding.md"), "utf8");
    expect(md).not.toMatch(/fast model/i);
    expect(md).toMatch(/1–5/u);
    expect(md).toMatch(/6–10/u);
    expect(md).toMatch(/11–20/u);
  });

  it("pins every installer invocation to one deliberate version", () => {
    // Maintenance policy: the walkthrough pins one deliberate version everywhere (uniformity, enforced here). The
    // prose names the selected published target; the guard ties pins to the candidate package.json version. Those
    // two are not automatically interchangeable: when this guard fails after a version bump, decide deliberately —
    // bump the documented target or hold it — never auto-derive the prose from package.json.
    const md = readFileSync(join(kitDir(), "cursor-onboarding.md"), "utf8");
    const pkg = JSON.parse(
      readFileSync(join(pkgRoot, "package.json"), "utf8"),
    ) as { version: string };
    const pins = new Set(
      [...md.matchAll(/@zedtech\/zedkit-ai@([0-9][\w.-]*)/g)].map((m) => m[1]),
    );
    expect(pins.size).toBeGreaterThan(0);
    expect([...pins]).toEqual([pkg.version]);
  });
});
