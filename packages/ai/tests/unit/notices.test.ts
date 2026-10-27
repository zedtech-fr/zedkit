import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";

function shippedSkills(): string[] {
  return readdirSync(`${kitDir()}/skills`, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function firstPartyFromNotices(notices: string): string[] {
  const block = /is not\ncovered here: ([\s\S]*?)\. Each upstream/.exec(notices);
  expect(block, "notices first-party list block").not.toBeNull();
  return [...(block?.[1] ?? "").matchAll(/`([a-z][a-z0-9-]*)`/g)]
    .map((m) => m[1] ?? "")
    .sort();
}

function upstreamFromNotices(notices: string): string[] {
  const names = new Set<string>();
  for (const m of notices.matchAll(/- Skills: [\s\S]*?\(upstream/g)) {
    for (const k of m[0].matchAll(/`([a-z][a-z0-9-]*)`/g)) {
      if (k[1]) names.add(k[1]);
    }
  }
  return [...names].sort();
}

function readmeFirstParty(): string[] {
  const readme = readFileSync(fileURLToPath(new URL("../../README.md", import.meta.url)), "utf8");
  const block = /\*\*Skills first-party:\*\* ([\s\S]*?)\./.exec(readme);
  expect(block, "README first-party list").not.toBeNull();
  return [...(block?.[1] ?? "").matchAll(/`([a-z][a-z0-9-]*)`/g)]
    .map((m) => m[1] ?? "")
    .sort();
}

describe("third-party notices", () => {
  it("names every shipped skill (first-party list or upstream section)", () => {
    const notices = readFileSync(`${kitDir()}/THIRD_PARTY_NOTICES.md`, "utf8");
    const skills = shippedSkills();
    expect(skills.length).toBeGreaterThan(0);
    for (const skill of skills) {
      expect(notices, skill).toContain(`\`${skill}\``);
    }
  });

  it("partitions shipped skills exactly: first-party plus upstream, no overlap", () => {
    const notices = readFileSync(`${kitDir()}/THIRD_PARTY_NOTICES.md`, "utf8");
    const firstParty = firstPartyFromNotices(notices);
    const upstream = upstreamFromNotices(notices);
    expect(firstParty.filter((name) => upstream.includes(name))).toEqual([]);
    expect([...firstParty, ...upstream].sort()).toEqual(shippedSkills());
  });

  it("matches the README first-party list with the notices first-party list", () => {
    const notices = readFileSync(`${kitDir()}/THIRD_PARTY_NOTICES.md`, "utf8");
    expect(readmeFirstParty()).toEqual(firstPartyFromNotices(notices));
  });

  it("matches every notices LICENSE mention with a shipped file, and vice versa", () => {
    const notices = readFileSync(`${kitDir()}/THIRD_PARTY_NOTICES.md`, "utf8");
    const mentioned = [
      ...new Set(
        [...notices.matchAll(/skills\/(LICENSE-[A-Za-z0-9.-]+)/g)].map((m) => m[1] ?? ""),
      ),
    ].sort();
    expect(mentioned.length).toBeGreaterThan(0);
    const shipped = readdirSync(`${kitDir()}/skills`)
      .filter((entry) => entry.startsWith("LICENSE-"))
      .sort();
    expect(shipped).toEqual(mentioned);
  });

  it("names only shipped skills in the README vendored paragraph", () => {
    const readme = readFileSync(fileURLToPath(new URL("../../README.md", import.meta.url)), "utf8");
    const at = readme.indexOf("**Skills vendored (MIT):**");
    expect(at, "vendored paragraph").toBeGreaterThanOrEqual(0);
    const paragraph = readme.slice(at, readme.indexOf("\n\n", at));
    const names = [...paragraph.matchAll(/`([a-z][a-z0-9-]*)`/g)].map((m) => m[1] ?? "");
    expect(names.length).toBeGreaterThan(0);
    const shipped = new Set(shippedSkills());
    for (const name of names) {
      expect(shipped.has(name), `vendored name ${name}`).toBe(true);
    }
  });
});
