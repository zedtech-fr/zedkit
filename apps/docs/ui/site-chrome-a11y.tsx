"use client";

import { useEffect } from "react";
import { applySurfaceGlassPanel } from "@zedtech/zedkit-ui";

/** Fumadocs renders the Guides viewport with no prop seam: apply kit glass Surface chrome. */
const GUIDES_PANEL_SELECTOR = ".flex.w-full.justify-center > *";

function tagGuidesPanel(root: ParentNode): void {
  const panel = root.querySelector(GUIDES_PANEL_SELECTOR);
  if (panel instanceof HTMLElement && panel.getAttribute("data-surface") !== "glass") {
    applySurfaceGlassPanel(panel, { elevation: 3, radius: "xl" });
  }
}

export function SiteHeaderSurfacePatch() {
  useEffect(() => {
    const nav = document.querySelector("#nd-nav");
    if (!nav) return;
    tagGuidesPanel(nav);
    const observer = new MutationObserver(() => tagGuidesPanel(nav));
    observer.observe(nav, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}

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
    const titles: Record<string, string> = {
      GitHub: "View zedkit repository on GitHub",
      "Toggle Menu": "Open site menu",
      "Open Sidebar": "Open navigation sidebar",
      "Close Sidebar": "Close navigation sidebar",
      "Collapse Sidebar": "Collapse navigation sidebar",
    };
    for (const [ariaLabel, title] of Object.entries(titles)) {
      for (const el of document.querySelectorAll(`[aria-label="${ariaLabel}"]`)) {
        if (!el.getAttribute("title")) el.setAttribute("title", title);
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
