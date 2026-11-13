"use client";

import { siteChromeCopy } from "@/ui/i18n/site-chrome-copy";

/**
 * First tab stop on every page: jumps keyboard focus to `#main-content`,
 * past header, nav, and search chrome. The id is in the SSR HTML so native
 * hash navigation works without JS. onClick prefers that node, then `main`,
 * and focuses it so browsers that do not move focus on fragment navigation
 * still land in the content.
 *
 * Revealed with absolute positioning so Tab does not insert an in-flow
 * row and shift the flex-column body. Unfocused it stays sr-only (1×1)
 * with pointer-events-none so a pointer hit check does not treat the
 * hidden skip as a 24px target; focus restores pointer events.
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      onClick={(event) => {
        const target =
          document.getElementById("main-content") ?? document.querySelector("main");
        if (target !== null) {
          event.preventDefault();
          if (!target.hasAttribute("tabindex")) target.tabIndex = -1;
          target.focus();
        }
      }}
      className="pointer-events-none sr-only focus:pointer-events-auto focus:not-sr-only focus:absolute! focus:top-float focus:left-float focus:z-overlay focus:inline-flex focus:min-h-overlay-touch-target focus:items-center focus:rounded-md focus:bg-foreground focus:px-touch focus:text-background"
    >
      {siteChromeCopy.skipToContent}
    </a>
  );
}
