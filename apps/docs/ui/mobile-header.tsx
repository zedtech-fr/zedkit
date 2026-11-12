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
        <ul className="flex list-none flex-wrap items-center flush">
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
      <div data-header-actions="" className="ms-auto flex flex-wrap items-center">
        {chrome.search ? <SiteFullSearchTrigger className="min-h-overlay-touch-target" /> : null}
        <HomeGitHubLink />
        {chrome.getStarted ? <HomeGetStartedAction /> : null}
        {chrome.docsTreeOpener ? <DocsMenuButton /> : null}
      </div>
    </header>
  );
}
