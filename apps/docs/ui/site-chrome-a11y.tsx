"use client";

import { useEffect } from "react";
import { siteChromeCopy } from "@/ui/i18n/site-chrome-copy";

/** Adds native tooltips where Fumadocs chrome only sets `aria-label` (#396). */
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
  }, []);
  return null;
}
