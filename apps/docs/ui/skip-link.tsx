"use client";

/**
 * First tab stop on every page: jumps keyboard focus into the page's
 * `<main>`, past header, nav, and search chrome. The target is focused
 * imperatively on purpose: wrapping page content in a target node breaks
 * fumadocs' first-child selectors and shifts layouts, and fumadocs exposes
 * no stable main id to point a plain fragment at.
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      onClick={(event) => {
        const main = document.querySelector("main");
        if (main !== null) {
          event.preventDefault();
          if (!main.hasAttribute("tabindex")) main.tabIndex = -1;
          main.focus();
        }
      }}
      className="sr-only focus:not-sr-only focus:inline-flex focus:min-h-overlay-touch-target focus:items-center focus:rounded-md focus:bg-foreground focus:px-touch focus:text-background"
    >
      Skip to content
    </a>
  );
}
