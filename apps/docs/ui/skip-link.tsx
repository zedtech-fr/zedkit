import type { ReactNode } from "react";

/**
 * First tab stop on every page: jumps past the header, nav, and search
 * chrome. Visually hidden until focused; the docs shell owns both ends
 * (fumadocs layouts expose no stable main id), so the target travels
 * with the link.
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:inline-flex focus:min-h-overlay-touch-target focus:items-center focus:rounded-md focus:bg-foreground focus:px-touch focus:text-background"
    >
      Skip to content
    </a>
  );
}

/**
 * Fragment target for SkipLink. focusable so activation moves keyboard
 * focus into the page, not just the scroll position.
 */
export function SkipTarget({ children }: { children: ReactNode }) {
  return (
    <div id="main-content" tabIndex={-1}>
      {children}
    </div>
  );
}
