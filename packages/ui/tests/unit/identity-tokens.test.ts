import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const src = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src");
const read = (file: string): string => readFileSync(join(src, file), "utf8");

function tokens(css: string, name: string): string[] {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  return [...stripped.matchAll(new RegExp(`${name}\\s*:\\s*([^;]+);`, "g"))].map((match) =>
    (match[1] ?? "").replace(/\s+/g, " ").trim(),
  );
}

function token(css: string, name: string): string | undefined {
  return tokens(css, name)[0];
}

describe("per-identity leading, border, colour duration (#799)", () => {
  it("keeps mist at today's stock values", () => {
    const stock = read("identities.css");
    expect(token(stock, "--zk-body-leading")).toBe("1.6");
    expect(token(stock, "--zk-border-width")).toBe("1px");
    expect(token(stock, "--zk-color-duration")).toBe("150ms");
    expect(read("styles.css")).toMatch(/--default-transition-duration:\s*var\(--zk-color-duration, 150ms\)/);
    expect(read("identities.css")).toMatch(
      /\.transition-colors\s*\{[^}]*transition-duration:\s*var\(--zk-color-duration, 150ms\)/,
    );
  });

  it("does not keep unused density knobs", () => {
    const files = ["identities.css", "identities/maison.css", "identities/glass.css"].map(read).join("\n");
    expect(files).not.toMatch(/--zk-density/);
    expect(files).not.toMatch(/--zk-control-scale/);
  });

  it("gives each identity its own type size, tracking, shadow, spacing, and radius", () => {
    const mistReset = read("identities.css").slice(read("identities.css").indexOf("Scoped mist resets the stock tokens."));
    const looks = {
      mist: mistReset,
      press: read("identities/press.css"),
      maison: read("identities/maison.css"),
      glass: read("identities/glass.css"),
      tide: read("identities/tide.css"),
      volt: read("identities/volt.css"),
    };
    expect(token(looks.mist, "--text-sm") ?? "").toBe("0.875rem");
    expect(token(looks.mist, "--text-lg") ?? "").toBe("1.125rem");
    expect(token(looks.mist, "--tracking-tight") ?? "").toBe("-0.025em");
    expect(token(looks.mist, "--spacing") ?? "").toBe("0.25rem");
    expect(token(looks.press, "--spacing") ?? "").toBe("0.24rem");
    expect(token(looks.tide, "--spacing") ?? "").toBe("0.28rem");
    expect(token(looks.glass, "--spacing") ?? "").toBe("0.27rem");
    const steps = ["--text-xs", "--text-sm", "--text-base", "--text-lg", "--text-xl", "--text-2xl", "--text-3xl", "--text-4xl", "--text-5xl"] as const;
    for (const css of Object.values(looks)) {
      const rem = steps.map((name) => Number.parseFloat(token(css, name) ?? "0"));
      for (let i = 1; i < rem.length; i++) {
        expect(rem[i]).toBeGreaterThan(rem[i - 1] ?? 0);
      }
    }
    for (const name of ["--text-sm", "--text-base", "--text-lg", "--text-2xl", "--text-3xl", "--text-4xl", "--text-5xl", "--tracking-tight", "--tracking-wide", "--zk-heading-tracking", "--zk-label-tracking", "--zk-shadow-xs", "--zk-shadow-md", "--spacing", "--radius", "--radius-xs", "--radius-sm", "--radius-md", "--zk-color-duration", "--zk-heading-leading"] as const) {
      const seen = new Map<string, string>();
      for (const [id, css] of Object.entries(looks)) {
        const value = token(css, name) ?? "";
        expect(value.length).toBeGreaterThan(0);
        expect(seen.get(value) ?? "").toBe("");
        seen.set(value, id);
      }
    }
  });

  it("sets a distinct leading, border, and colour duration per identity", () => {
    expect(token(read("identities/press.css"), "--zk-body-leading")).toBe("1.45");
    expect(token(read("identities/press.css"), "--zk-border-width")).toBe("2px");
    expect(token(read("identities/press.css"), "--zk-color-duration")).toBe("80ms");
    expect(token(read("identities/maison.css"), "--zk-body-leading")).toBe("1.7");
    expect(token(read("identities/maison.css"), "--zk-color-duration")).toBe("200ms");
    expect(token(read("identities/maison.css"), "--radius-xs") ?? "").toBe("0.5px");
    expect(token(read("identities/glass.css"), "--zk-body-leading")).toBe("1.65");
    expect(token(read("identities/glass.css"), "--zk-color-duration")).toBe("220ms");
    expect(token(read("identities/glass.css"), "--zk-border-width") ?? "").toBe("0.75px");
    expect(token(read("identities/glass.css"), "--radius") ?? "").toBe("1.25rem");
    expect(token(read("identities/glass.css"), "--radius-sm") ?? "").toBe("0.625rem");
    expect(token(read("identities/glass.css"), "--radius-md") ?? "").toBe("0.875rem");
    expect(token(read("identities/glass.css"), "--text-3xl") ?? "").toBe("2rem");
    expect(token(read("identities/glass.css"), "--text-5xl") ?? "").toBe("3.125rem");
    expect(token(read("identities/glass.css"), "--zk-heading-leading") ?? "").toBe("1.14");
    expect(token(read("identities/glass.css"), "--zk-shadow-xs") ?? "").toBe(
      "0 1px 3px hsl(var(--zk-shadow-color) / 0.07)",
    );
    expect(token(read("identities/tide.css"), "--zk-body-leading")).toBe("1.55");
    expect(token(read("identities/tide.css"), "--text-2xl") ?? "").toBe("2.125rem");
    expect(token(read("identities/tide.css"), "--zk-color-duration")).toBe("180ms");
    expect(token(read("identities/tide.css"), "--zk-border-width") ?? "").toBe("1.5px");
    expect(token(read("identities/volt.css"), "--zk-body-leading")).toBe("1.4");
    expect(token(read("identities/volt.css"), "--zk-color-duration")).toBe("100ms");
    expect(token(read("identities/volt.css"), "--text-4xl") ?? "").toBe("2.125rem");
    expect(token(read("identities/volt.css"), "--zk-border-width") ?? "").toBe("1.25px");
  });

  it("gives each identity its own dark --zk-shadow-xs", () => {
    const darkXs = {
      maison: tokens(read("identities/maison.css"), "--zk-shadow-xs")[1],
      glass: tokens(read("identities/glass.css"), "--zk-shadow-xs")[1],
      tide: tokens(read("identities/tide.css"), "--zk-shadow-xs")[1],
      volt: tokens(read("identities/volt.css"), "--zk-shadow-xs")[1],
    };
    expect(darkXs.maison).toBe("none");
    expect(darkXs.glass).toBe("0 1px 2px rgb(0 0 0 / 0.35), var(--zk-glass-highlight)");
    const seen = new Map<string, string>();
    for (const [id, value] of Object.entries(darkXs)) {
      expect(value ?? "").not.toBe("");
      expect(seen.get(value ?? "") ?? "").toBe("");
      seen.set(value ?? "", id);
    }
  });
});
