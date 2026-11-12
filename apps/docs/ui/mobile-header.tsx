"use client";

import { usePathname } from "next/navigation";
import { cn } from "@zedtech/zedkit-ui";
import { DocsAppLink } from "@/ui/docs-app-link";
import { HomeGetStartedAction, HomeGitHubLink } from "@/ui/home-header-actions";
import { SiteBrand } from "@/ui/site-brand";
import { SiteFullSearchTrigger } from "@/ui/site-chrome";
import { siteChromeCopy } from "@/ui/i18n/site-chrome-copy";
import { isSiteNavLinkActive, siteHeaderChrome } from "@/lib/site-nav-data";

/**
 * Métier: public TypeScript kit documentation site.
 * Client personas: integrating developers who own the consuming app.
 * Customers: those same developers (this site is the product surface).
 * Customer personas: hurried first visit on a 390px phone — next action is Get started or a primary nav link, not a taller chrome that pushes the hero off the first screen.
 * UI decisions: two-row wrap (wordmark + AI/UI/Docs/Catalog, then GitHub and path actions), because customer = hurried phone visitor who needs the first screen to start at the hero.
 *
 * Phone header (< md): wordmark + nowrap primary links, then a full-width actions row.
 * Home: GitHub text + Get started, no search. Else: Search ⌘K + GitHub text.
 * Docs mode does not open a page-tree drawer: the list is in the page. Foundations has no page tree. Never theme, version, or a site-nav disclosure.
 */
export function MobileHeader({
  mode,
  className,
}: {
  mode: "home" | "docs";
  className?: string;
}) {
  const pathname = usePathname();
  const chrome = siteHeaderChrome(pathname);
  return (
    <header
      id="nd-mobile-nav"
      {...(mode === "docs" ? { "data-docs-phone-bar": "" } : {})}
      className={
        className ??
        "sticky pin-top z-header flex min-h-phone-bar flex-wrap items-center border-b bg-background px-page-gutter md:hidden"
      }
    >
      <DocsAppLink
        href="/"
        aria-label={siteChromeCopy.brand.homeAriaLabel}
        className="inline-flex min-h-overlay-touch-target items-center gap-icon rounded-md text-foreground focus-ring-control"
      >
        <SiteBrand />
      </DocsAppLink>
      <nav aria-label={siteChromeCopy.nav.siteNavigation}>
        <ul className="flex list-none items-center flush">
          {chrome.links.map((link) => {
            const active = isSiteNavLinkActive(pathname, link);
            return (
              <li key={link.href}>
                <DocsAppLink
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-overlay-touch-target items-center text-zk-type-nav text-muted-foreground hover:text-foreground",
                    active && "text-foreground underline link-offset",
                  )}
                >
                  {link.text}
                </DocsAppLink>
              </li>
            );
          })}
        </ul>
      </nav>
      <div data-header-actions="" className="ms-auto flex items-center">
        {chrome.search ? <SiteFullSearchTrigger className="min-h-overlay-touch-target" /> : null}
        <HomeGitHubLink />
        {chrome.getStarted ? <HomeGetStartedAction /> : null}
      </div>
    </header>
  );
}
