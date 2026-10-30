import { expect, type Page } from "@playwright/test";

/** Sets `data-identity` and colour mode on `<html>`, then waits for fonts. */
export async function useIdentity(page: Page, identity: string | null, theme: "light" | "dark") {
  await page.evaluate(
    ({ id, mode }) => {
      const root = document.documentElement;
      if (id) root.setAttribute("data-identity", id);
      else root.removeAttribute("data-identity");
      root.classList.toggle("dark", mode === "dark");
      root.classList.toggle("light", mode === "light");
      root.style.colorScheme = mode;
    },
    { id: identity, mode: theme },
  );
  await page.evaluate(() => document.fonts.ready);
}

/** Wait until html has this identity and colour mode, and in-document fonts are loaded. */
export async function waitForAppliedLook(page: Page, identity: string, theme: "light" | "dark"): Promise<void> {
  const root = page.locator("html");
  await expect(root).toHaveAttribute("data-identity", identity);
  await expect(root).toHaveClass(new RegExp(`\\b${theme}\\b`));
  await page.evaluate(async () => {
    const specs = new Set<string>();
    for (const el of document.querySelectorAll("html, [data-identity], [data-identity-scope]")) {
      const { fontFamily, fontSize, fontWeight } = getComputedStyle(el);
      const family = fontFamily.split(",")[0]?.trim();
      if (family) specs.add(`${fontWeight} ${fontSize} ${family}`);
    }
    await Promise.all([...specs].map((spec) => document.fonts.load(spec)));
    await document.fonts.ready;
  });
}

/** Computed value of a CSS expression, read through a probe element in `<main>`. */
export async function probe(page: Page, property: string, value: string) {
  return page.evaluate(
    ([prop, val]) => {
      const el = document.createElement("span");
      el.style.setProperty(prop, val);
      document.querySelector("main")!.appendChild(el);
      const out = getComputedStyle(el).getPropertyValue(prop);
      el.remove();
      return out;
    },
    [property, value] as const,
  );
}
