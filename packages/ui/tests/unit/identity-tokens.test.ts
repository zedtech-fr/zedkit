import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const src = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src");
const read = (file: string): string => readFileSync(join(src, file), "utf8");

function token(css: string, name: string): string | undefined {
  const match = css.replace(/\/\*[\s\S]*?\*\//g, "").match(new RegExp(`${name}\\s*:\\s*([^;]+);`));
  return match?.[1]?.replace(/\s+/g, " ").trim();
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

  it("sets a distinct leading, border, and colour duration per identity", () => {
    expect(token(read("identities/press.css"), "--zk-body-leading")).toBe("1.45");
    expect(token(read("identities/press.css"), "--zk-border-width")).toBe("2px");
    expect(token(read("identities/press.css"), "--zk-color-duration")).toBe("80ms");
    expect(token(read("identities/maison.css"), "--zk-body-leading")).toBe("1.7");
    expect(token(read("identities/maison.css"), "--zk-color-duration")).toBe("200ms");
    expect(token(read("identities/glass.css"), "--zk-body-leading")).toBe("1.65");
    expect(token(read("identities/glass.css"), "--zk-color-duration")).toBe("200ms");
    expect(token(read("identities/tide.css"), "--zk-body-leading")).toBe("1.55");
    expect(token(read("identities/tide.css"), "--zk-color-duration")).toBe("180ms");
    expect(token(read("identities/volt.css"), "--zk-body-leading")).toBe("1.4");
    expect(token(read("identities/volt.css"), "--zk-color-duration")).toBe("100ms");
  });
});
