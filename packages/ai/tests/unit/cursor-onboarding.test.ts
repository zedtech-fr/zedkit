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
    expect(md).toContain("npx @zedtech/zedkit-ai setup --provider cursor");
    expect(md).toContain("/setup-ai");
    expect(md).toContain("npx @zedtech/zedkit-ai validate");
  });

  it("does not tell the paste prompt to spawn a fast model, and names the scan buckets", () => {
    const md = readFileSync(join(kitDir(), "cursor-onboarding.md"), "utf8");
    expect(md).not.toMatch(/fast model/i);
    expect(md).toMatch(/1–5/u);
    expect(md).toMatch(/6–10/u);
    expect(md).toMatch(/11–20/u);
  });
});
