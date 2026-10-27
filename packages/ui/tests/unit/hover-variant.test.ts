// @vitest-environment node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * A @custom-variant hover redefinition once shipped here and emitted
 * malformed CSS (`@media (hover: hover) { &:hover } { ...`), which
 * broke consumer builds the moment any hover: utility was used.
 * Tailwind v4's default hover variant is already hover-gated, so no
 * redefinition exists — these checks pin that through a real build.
 */
async function buildKitStyles(): Promise<string> {
  const input = `@import ${JSON.stringify(join(here, "..", "..", "src", "styles.css"))};\n@source ${JSON.stringify(join(here, "fixtures", "hover.html"))};\n`;
  const out = await postcss([tailwind()]).process(input, { from: join(here, "hover-variant.css") });
  return out.css;
}

describe("hover variant", () => {
  it("emits no custom-variant redefinition", () => {
    const styles = readFileSync(join(here, "..", "..", "src", "styles.css"), "utf8");
    expect(styles).not.toContain("@custom-variant hover");
  });

  it("builds hover utilities well-formed and hover-gated", async () => {
    const css = await buildKitStyles();
    expect(css).not.toContain("&:hover } {");
    expect(css).toContain("@media (hover: hover)");
    expect(css).toContain(".hover\\:underline:hover");
  });
});
