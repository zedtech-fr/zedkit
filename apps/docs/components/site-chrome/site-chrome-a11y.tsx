"use client";

import { useEffect } from "react";
import { siteChromeCopy } from "@/components/site-chrome/i18n/site-chrome-copy";

const INERT_MARK = "data-zk-inert";

function syncAriaHiddenInert(root: ParentNode): void {
  for (const el of root.querySelectorAll("[aria-hidden='true']")) {
    if (!(el instanceof HTMLElement) || el.hasAttribute("inert")) continue;
    el.setAttribute(INERT_MARK, "");
    el.setAttribute("inert", "");
  }
  for (const el of root.querySelectorAll(`[inert][${INERT_MARK}]`)) {
    if (!(el instanceof HTMLElement)) continue;
    if (el.getAttribute("aria-hidden") === "true") continue;
    el.removeAttribute("inert");
    el.removeAttribute(INERT_MARK);
  }
}

/** Adds native tooltips where Fumadocs chrome only sets `aria-label` (#396).
 * Also sets `inert` when an overlay marks a node `aria-hidden`, so axe
 * aria-hidden-focus does not fire on header and skip-link. */
export function SiteChromeA11yPatch() {
  useEffect(() => {
    const opens = siteChromeCopy.nav.opensInNewTab;
    const titles: Record<string, string> = {
      GitHub: `View zedkit repository on GitHub (${opens})`,
      "Toggle Menu": "Open site menu",
      "Open Sidebar": "Open navigation sidebar",
      "Close Sidebar": "Close navigation sidebar",
      "Collapse Sidebar": "Collapse navigation sidebar",
    };
    for (const [ariaLabel, title] of Object.entries(titles)) {
      for (const el of document.querySelectorAll(`[aria-label="${ariaLabel}"]`)) {
        if (!el.getAttribute("title")) el.setAttribute("title", title);
        if (ariaLabel === "GitHub") el.setAttribute("aria-label", `GitHub (${opens})`);
      }
    }
    const root = document.body;
    syncAriaHiddenInert(root);
    const observer = new MutationObserver(() => syncAriaHiddenInert(root));
    observer.observe(root, { subtree: true, attributes: true, attributeFilter: ["aria-hidden"] });
    return () => observer.disconnect();
  }, []);
  return null;
}
