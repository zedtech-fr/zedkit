import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const src = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src");
const read = (file: string): string => readFileSync(join(src, file), "utf8");

function token(css: string, name: string): string | undefined {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const match = new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*([^;]+);`).exec(stripped);
  return match?.[1]?.replace(/\s+/g, " ").trim();
}

function remPx(value: string): number {
  const trimmed = value.trim();
  if (trimmed.includes("var(--zk-type-base)")) return 16;
  if (trimmed.endsWith("rem")) return Number.parseFloat(trimmed) * 16;
  if (trimmed.endsWith("px")) return Number.parseFloat(trimmed);
  return Number.parseFloat(trimmed);
}

const shared = read("shared-type-scale.css");
const identityFiles = readdirSync(join(src, "identities")).filter((f) => f.endsWith(".css"));

describe("shared type scale (P0)", () => {
  it("defines semantic roles and a 16px body base", () => {
    expect(token(shared, "--zk-type-base")).toBe("1rem");
    expect(token(shared, "--text-base")).toBe("var(--zk-type-base)");
    expect(remPx(token(shared, "--text-xs") ?? "0")).toBe(12);
    expect(remPx(token(shared, "--text-sm") ?? "0")).toBe(14);
    expect(remPx(token(shared, "--text-lg") ?? "0")).toBe(18);
    expect(token(shared, "--zk-body-leading")).toBe("1.6");
  });

  it("keeps label < small < body < card title < h2 step < h1 step", () => {
    const label = remPx(token(shared, "--text-xs") ?? "0");
    const small = remPx(token(shared, "--text-sm") ?? "0");
    const body = remPx("1rem");
    const h3 = remPx(token(shared, "--text-lg") ?? "0");
    const h2Min = remPx(token(shared, "--text-2xl") ?? "0");
    const h1Min = remPx(token(shared, "--text-4xl") ?? "0");
    expect(label).toBeLessThan(small);
    expect(small).toBeLessThan(body);
    expect(body).toBeLessThan(h3);
    expect(h3).toBeLessThan(h2Min);
    expect(h2Min).toBeLessThan(h1Min);
    const bodyLeading = Number.parseFloat(token(shared, "--zk-body-leading") ?? "0");
    expect(bodyLeading).toBeGreaterThanOrEqual(1.45);
    expect(bodyLeading).toBeLessThanOrEqual(1.65);
  });

  it("does not let identities override Tailwind text steps or body leading", () => {
    for (const file of identityFiles) {
      const css = read(join("identities", file));
      expect(css).not.toMatch(/^\s*--text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)\s*:/m);
      expect(css).not.toMatch(/^\s*--zk-body-leading\s*:/m);
      expect(css).not.toMatch(/^\s*--zk-heading-leading\s*:/m);
    }
  });

  it("fixes Tide semibold at 600, not bold", () => {
    expect(token(read("identities/tide.css"), "--font-weight-semibold")).toBe("600");
  });

  it("still gives each identity distinct tracking and spacing flavour", () => {
    const ids = identityFiles.map((file) => [file, read(join("identities", file))] as const);
    const seen = new Map<string, string>();
    for (const [file, css] of ids) {
      const track = token(css, "--zk-heading-tracking") ?? "";
      expect(track.length).toBeGreaterThan(0);
      expect(seen.get(track) ?? "").toBe("");
      seen.set(track, file);
    }
  });
});
