import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import {
  applyCustomIdentitySheet,
  applyIdentityTokenSheet,
  historyOf,
  historyPush,
  historyRedo,
  historyUndo,
  identityPresets,
  identityTokenSchema,
  parseIdentityTokens,
  suggestIdentityTokens,
  tokensToCss,
  tokensToCssVars,
  type IdentityId,
} from "#identity-tokens.js";

const src = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src");
const read = (file: string): string => readFileSync(join(src, file), "utf8");

function cssTokens(css: string, name: string): string[] {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  return [...stripped.matchAll(new RegExp(`${name}\\s*:\\s*([^;]+);`, "g"))].map((match) =>
    (match[1] ?? "").replace(/\s+/g, " ").trim(),
  );
}

function cssToken(css: string, name: string): string | undefined {
  return cssTokens(css, name)[0];
}

const DRAFT = '[data-identity-scope][data-identity="draft"]';

afterEach(() => {
  document.head.replaceChildren();
  localStorage.clear();
});

describe("identity token schema", () => {
  it("accepts every shipped preset", () => {
    for (const tokens of Object.values(identityPresets)) {
      expect(identityTokenSchema.parse(tokens)).toEqual(tokens);
    }
  });

  it("rejects a broken colour channel", () => {
    const result = parseIdentityTokens({
      ...identityPresets.mist,
      light: { ...identityPresets.mist.light, background: "red" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a preset with no dark pair", () => {
    expect(parseIdentityTokens({ ...identityPresets.press, dark: undefined }).success).toBe(false);
  });

  it("keeps compact fields in step with shipped identity CSS", () => {
    const identitiesCss = read("identities.css");
    const looks: Record<IdentityId, string> = {
      mist: identitiesCss.slice(identitiesCss.indexOf("Scoped mist resets the stock tokens.")),
      press: read("identities/press.css"),
      tide: read("identities/tide.css"),
      volt: read("identities/volt.css"),
      maison: read("identities/maison.css"),
      glass: read("identities/glass.css"),
    };
    const sharedScale = read("shared-type-scale.css");
    const fields = [
      ["spacing", "--spacing"],
      ["borderWidth", "--zk-border-width"],
      ["radius", "--radius"],
    ] as const;
    const sharedLeading = [
      ["bodyLeading", "--zk-body-leading"],
      ["headingLeading", "--zk-heading-leading"],
    ] as const;
    const colours = ["background", "foreground", "primary", "accent", "border"] as const;
    for (const [id, css] of Object.entries(looks) as [IdentityId, string][]) {
      const preset = identityPresets[id];
      for (const [field, name] of fields) {
        expect(preset[field]).toBe(cssToken(css, name));
      }
      for (const [field, name] of sharedLeading) {
        const fromCss = id === "mist" ? cssToken(css, name) : cssToken(sharedScale, name);
        const expected = fromCss === "initial" ? "1.1" : fromCss;
        expect(preset[field]).toBe(expected);
      }
      const headingFields = [
        ["headingTracking", "--zk-heading-tracking"],
        ["labelTracking", "--zk-label-tracking"],
      ] as const;
      for (const [field, name] of headingFields) {
        const value = cssToken(css, name);
        if (!value || value === "initial") continue;
        expect(preset[field]).toBe(value);
      }
      for (const colour of colours) {
        const pair = cssTokens(css, `--${colour}`);
        expect(preset.light[colour]).toBe(pair[0]);
        expect(preset.dark[colour]).toBe(pair[1]);
      }
    }
  });
});

describe("token to CSS var writer", () => {
  it("emits every family for a scoped selector", () => {
    const css = tokensToCss(identityPresets.press, DRAFT);
    expect(css.startsWith(`${DRAFT} {`)).toBe(true);
    expect(css).toContain("--spacing: 0.2rem");
    expect(css).toContain("--zk-border-width: 2px");
    expect(css).toContain("--radius: 0px");
    expect(css).toContain("--zk-body-leading: 1.6");
    expect(css).toContain("--zk-heading-tracking: -0.015em");
    expect(css).toContain("--background: 45 35% 94%");
    expect(css).toContain("--zk-shadow-sm: 0 0 0 0 transparent");
    expect(css).toContain("--zk-font-display:");
  });

  it("writes dark colour channels under .dark", () => {
    const css = tokensToCss(identityPresets.press, DRAFT);
    expect(css).toContain(`.dark ${DRAFT}`);
    expect(css).toContain(`${DRAFT}.dark`);
    expect(css).toContain("--background: 0 0% 6%");
    expect(css).toContain("--primary: 164 62% 56%");
  });

  it("writes a custom sheet onto :root and persists the CSS", () => {
    const sheet = applyCustomIdentitySheet(identityPresets.tide);
    expect(sheet.getAttribute("data-slot")).toBe("identity-custom-sheet");
    expect(sheet.textContent).toContain(":root {");
    expect(sheet.textContent).toContain("--spacing: 0.28rem");
    expect(sheet.textContent).toContain(":root.dark");
    expect(localStorage.getItem("zk-identity-custom")).toBe(sheet.textContent);
  });

  it("writes the sheet onto document.head without a reload", () => {
    const sheet = applyIdentityTokenSheet(identityPresets.tide, DRAFT);
    expect(sheet.getAttribute("data-slot")).toBe("identity-token-sheet");
    expect(sheet.parentNode).toBe(document.head);
    expect(sheet.textContent).toContain("--radius: 1rem");
    applyIdentityTokenSheet(identityPresets.volt, DRAFT);
    expect(document.querySelectorAll('style[data-slot="identity-token-sheet"]')).toHaveLength(1);
    expect(sheet.textContent).toContain("--radius: 0.25rem");
  });

  it("maps one radius onto every radius step", () => {
    expect(tokensToCssVars(identityPresets.press)["--radius-xl"]).toBe("0px");
  });

  it("paints sidebar and card from the compact background", () => {
    const vars = tokensToCssVars(identityPresets.maison);
    expect(vars["--sidebar"]).toBe(identityPresets.maison.light.background);
    expect(vars["--card"]).toBe(identityPresets.maison.light.background);
    expect(vars["--muted"]).toBe(identityPresets.maison.light.background);
    const css = tokensToCss(identityPresets.maison, ':root[data-identity="mist"]');
    expect(css).toContain("--sidebar: 40 33% 98%");
    expect(css).toContain("--sidebar-accent: 38 45% 48%");
    expect(css).toContain(":root[data-identity=\"mist\"].dark");
    expect(css).toContain("--sidebar: 30 12% 7%");
  });
});

describe("suggestIdentityTokens", () => {
  it("returns a full validated set for a prompt", () => {
    const tokens = suggestIdentityTokens("calm editorial, rounded, warm");
    expect(identityTokenSchema.parse(tokens)).toEqual(tokens);
    expect(tokens.dark.background).toMatch(/^\d/);
  });
});

describe("token history", () => {
  it("undoes then redoes a change", () => {
    let history = historyPush(historyOf(identityPresets.mist), identityPresets.press);
    expect(history.present).toEqual(identityPresets.press);
    history = historyUndo(history);
    expect(history.present).toEqual(identityPresets.mist);
    history = historyRedo(history);
    expect(history.present).toEqual(identityPresets.press);
  });
});
