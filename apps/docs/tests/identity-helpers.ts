import type { Page } from "@playwright/test";

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
