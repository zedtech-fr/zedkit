import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";
import { firstPartySkills, skillDirs } from "./helpers.js";

function shippedSkills(): string[] {
  return skillDirs().sort();
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
    const firstParty = firstPartySkills();
    const upstream = upstreamFromNotices(notices);
    expect(firstParty.filter((name) => upstream.includes(name))).toEqual([]);
    expect([...firstParty, ...upstream].sort()).toEqual(shippedSkills());
  });

  it("matches the README first-party list with the notices first-party list", () => {
    expect(readmeFirstParty()).toEqual(firstPartySkills());
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

  it("keeps deliberately unvendored skills out of the shipped set", () => {
    const notices = readFileSync(`${kitDir()}/THIRD_PARTY_NOTICES.md`, "utf8");
    const section = notices.split("## Deliberately not vendored")[1] ?? "";
    expect(section.length, "not-vendored section").toBeGreaterThan(0);
    const excluded = new Set<string>();
    for (const m of section.matchAll(/^-\s*`([a-z][a-z0-9-]*)`/gm)) {
      if (m[1]) excluded.add(m[1]);
    }
    for (const m of section.matchAll(/and `([a-z][a-z0-9-]*)`/g)) {
      if (m[1]) excluded.add(m[1]);
    }
    const paren = /not vendored here \(([^)]*)\)/.exec(section)?.[1] ?? "";
    for (const m of paren.matchAll(/`([a-z][a-z0-9-]*)`/g)) {
      if (m[1]) excluded.add(m[1]);
    }
    expect(excluded.size).toBeGreaterThan(0);
    const shipped = new Set(shippedSkills());
    for (const name of excluded) {
      expect(shipped.has(name), `excluded skill ${name} shipped`).toBe(false);
    }
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
