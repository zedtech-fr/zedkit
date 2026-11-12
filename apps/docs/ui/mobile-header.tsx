"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn, IconButton } from "@zedtech/zedkit-ui";
import { useSidebar } from "fumadocs-ui/components/sidebar/base";
import { DocsAppLink } from "@/ui/docs-app-link";
import { HomeGetStartedAction, HomeGitHubLink } from "@/ui/home-header-actions";
import { SiteBrand } from "@/ui/site-brand";
import { SiteFullSearchTrigger } from "@/ui/site-chrome";
import { siteChromeCopy } from "@/ui/i18n/site-chrome-copy";
import { isSiteNavLinkActive, siteHeaderChrome } from "@/lib/site-nav-data";

const iconButtonClassName =
  "inline-flex min-h-overlay-touch-target min-w-overlay-touch-target items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-ring-control";

function DocsMenuButton() {
  const sidebar = useSidebar();
  return (
    <IconButton
      label={siteChromeCopy.nav.openNavigation}
      variant="ghost"
      size="icon"
      className={iconButtonClassName}
      onClick={() => sidebar.setOpen(true)}
    >
      <Menu aria-hidden="true" className="size-icon" />
    </IconButton>
  );
}

/**
 * Métier: public TypeScript kit documentation site.
 * Client personas: integrating developers who own the consuming app.
 * Customers: those same developers (this site is the product surface).
 * Customer personas: hurried first visit on a 390-wide phone — next action is a named kit area or Get started, not a menu.
 * UI decisions: wrapping text nav in the phone header, because customer = first-visit integrator who should see AI/UI/Docs/Catalog without a disclosure.
 *
 * Phone header (< md): wordmark, wrapping primary links, then ms-auto actions.
 * Home: GitHub text + Get started, no search. Else: Search ⌘K + GitHub text.
 * Docs mode keeps the page-tree opener. Never theme, version, or a site-nav disclosure.
 */
export function MobileHeader({
  mode,
  className,
}: {
  mode: "home" | "docs";
  className?: string;
}) {
  const pathname = usePathname();
  const chrome = siteHeaderChrome(pathname, mode);
  return (
    <header
      id="nd-mobile-nav"
      {...(mode === "docs" ? { "data-docs-phone-bar": "" } : {})}
      className={
        className ??
        "sticky pin-top z-header flex min-h-phone-bar flex-wrap items-center gap-stack-lg border-b bg-background px-page-gutter md:hidden"
      }
    >
      <DocsAppLink
        href="/"
        aria-label={siteChromeCopy.brand.homeAriaLabel}
        className="inline-flex min-h-overlay-touch-target items-center rounded-md text-foreground focus-ring-control"
      >
        <SiteBrand />
      </DocsAppLink>
      <nav
        aria-label={siteChromeCopy.nav.siteNavigation}
        className="flex flex-wrap items-center gap-stack-lg"
      >
        {chrome.links.map((link) => {
          const active = isSiteNavLinkActive(pathname, link);
          return (
            <DocsAppLink
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-overlay-touch-target items-center text-muted-foreground hover:text-foreground",
                active && "text-foreground",
              )}
            >
              {link.text}
            </DocsAppLink>
          );
        })}
      </nav>
      <div className="ms-auto flex flex-wrap items-center gap-stack-md">
        {chrome.search ? <SiteFullSearchTrigger className="min-h-overlay-touch-target" /> : null}
        {chrome.github ? <HomeGitHubLink /> : null}
        {chrome.getStarted ? <HomeGetStartedAction /> : null}
        {chrome.docsTreeOpener ? <DocsMenuButton /> : null}
      </div>
    </header>
  );
}
