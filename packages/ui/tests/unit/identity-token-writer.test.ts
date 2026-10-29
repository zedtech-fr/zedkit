import { afterEach, describe, expect, it } from "vitest";

import {
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
} from "#identity-tokens.js";

const DRAFT = '[data-identity-scope][data-identity="draft"]';

afterEach(() => {
  document.head.replaceChildren();
});

describe("identity token schema", () => {
  it("accepts every shipped preset", () => {
    for (const tokens of Object.values(identityPresets)) {
      expect(identityTokenSchema.parse(tokens)).toEqual(tokens);
    }
  });

  it("rejects a broken colour channel", () => {
    const result = parseIdentityTokens({ ...identityPresets.mist, background: "red" });
    expect(result.success).toBe(false);
  });
});

describe("token to CSS var writer", () => {
  it("emits every family for a scoped selector", () => {
    const css = tokensToCss(identityPresets.press, DRAFT);
    expect(css.startsWith(`${DRAFT} {`)).toBe(true);
    expect(css).toContain("--spacing: 0.24rem");
    expect(css).toContain("--zk-border-width: 2px");
    expect(css).toContain("--radius: 0px");
    expect(css).toContain("--zk-body-leading: 1.45");
    expect(css).toContain("--zk-heading-tracking: -0.015em");
    expect(css).toContain("--background: 45 35% 94%");
    expect(css).toContain("--zk-shadow-sm: 0 0 0 0 transparent");
    expect(css).toContain("--zk-font-display:");
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
});

describe("suggestIdentityTokens", () => {
  it("returns a full validated set for a prompt", () => {
    const tokens = suggestIdentityTokens("calm editorial, rounded, warm");
    expect(identityTokenSchema.parse(tokens)).toEqual(tokens);
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
