"use client";

import { useEffect } from "react";

/** Adds native tooltips where Fumadocs chrome only sets `aria-label` (#396). */
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
  }, []);
  return null;
}
