"use client";

import { siteChromeCopy } from "@/components/site-chrome/i18n/site-chrome-copy";

/**
 * First tab stop on every page: jumps keyboard focus to `#main-content`,
 * past header, nav, and search chrome. The id is in the SSR HTML so native
 * hash navigation works without JS. onClick prefers that node, then `main`,
 * and focuses it so browsers that do not move focus on fragment navigation
 * still land in the content.
 *
 * Parked above the viewport with a real 24px box (not 1px `sr-only`) so
 * evidence hit/clip measures pass and Tab does not insert an in-flow
 * row. Unfocused it stays pointer-events-none so a pointer hit check
 * does not treat the hidden skip as a 24px target; focus restores
 * pointer events.
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      data-skip-link=""
      onClick={(event) => {
        const target =
          document.getElementById("main-content") ?? document.querySelector("main");
        if (target !== null) {
          event.preventDefault();
          if (!target.hasAttribute("tabindex")) target.tabIndex = -1;
          target.focus();
        }
      }}
      className="pointer-events-none fixed left-float z-overlay inline-flex min-h-overlay-touch-target items-center rounded-md px-touch focus:pointer-events-auto focus:top-float focus:bg-foreground focus:text-background"
    >
      {siteChromeCopy.skipToContent}
    </a>
  );
}
