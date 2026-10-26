import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

describe("input font-size token", () => {
  it("keeps the 14px design size by default", () => {
    expect(css).toMatch(/:root(?:,\s*\[data-identity-scope\]\[data-identity="mist"\])?\s*{[^}]*--zk-input-font-size:\s*0\.875rem;/s);
  });

  it("raises the token to a 16px floor on touch and phone-width screens", () => {
    const media = css.match(/@media \(pointer: coarse\), \(max-width: 767px\)\s*{\s*:root(?:,\s*\[data-identity-scope\]\[data-identity="mist"\])?\s*{([^}]*)}/s);
    expect(media?.[1]).toMatch(/--zk-input-font-size:\s*max\(16px,\s*0\.875rem\)/);
  });

  it("exposes the token as the text-control utility", () => {
    expect(css).toMatch(/--text-control:\s*var\(--zk-input-font-size\)/);
  });
});
