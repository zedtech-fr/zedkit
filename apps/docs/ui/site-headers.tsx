"use client";

import type { ReactNode } from "react";
import { Header } from "fumadocs-ui/layouts/home/slots/header";
import { usePathname } from "next/navigation";
import { cn } from "@zedtech/zedkit-ui";
import { DocsAppLink } from "@/ui/docs-app-link";
import { HomeGetStartedAction, HomeGitHubLink } from "@/ui/home-header-actions";
import { MobileHeader } from "@/ui/mobile-header";
import { SiteBrand } from "@/ui/site-brand";
import { SiteFullSearchTrigger } from "@/ui/site-chrome";
import { siteChromeCopy } from "@/ui/i18n/site-chrome-copy";
import { isCatalogPath, isHomePath, isSiteNavLinkActive, sitePrimaryNavLinks } from "@/lib/site-nav-data";

function MarketingDesktopNav({
  mark,
  actions,
}: {
  mark: "home" | "catalog";
  actions: ReactNode;
}) {
  const pathname = usePathname();
  return (
    <header
      id="nd-nav"
      {...(mark === "home" ? { "data-home-header": "" } : { "data-catalog-header": "" })}
      className="sticky pin-top z-header max-md:hidden"
    >
      <div>
        <nav
          aria-label={siteChromeCopy.nav.siteNavigation}
          className="mx-auto flex w-full max-w-(--fd-layout-width) items-center px-page-gutter"
        >
          <DocsAppLink
            href="/"
            aria-label={siteChromeCopy.brand.homeAriaLabel}
            className="inline-flex items-center gap-icon text-foreground focus-ring-control"
          >
            <SiteBrand />
          </DocsAppLink>
          <ul className="flex list-none items-center flush">
            {sitePrimaryNavLinks().map((link) => {
              const active = isSiteNavLinkActive(pathname, link);
              return (
                <li key={link.href}>
                  <DocsAppLink
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "text-muted-foreground hover:text-foreground",
                      active && "text-foreground",
                    )}
                  >
                    {link.text}
                  </DocsAppLink>
                </li>
              );
            })}
          </ul>
          <div data-header-actions="" className="ms-auto flex items-center">
            {actions}
          </div>
        </nav>
      </div>
    </header>
  );
}

/**
 * Métier: public TypeScript kit documentation site.
 * Client personas: integrating developers who own the consuming app.
 * Customers: those same developers (this site is the product surface).
 * Customer personas: first visit on `/` — next action is Get started or Docs, not search or a version chip.
 * UI decisions: home header is brand + AI/UI/Docs/Catalog + GitHub text + Get started, because customer = first-visit integrator on `/`.
 */
function HomeDesktopHeader() {
  return (
    <MarketingDesktopNav
      mark="home"
      actions={
        <>
          <HomeGitHubLink />
          <HomeGetStartedAction />
        </>
      }
    />
  );
}

/**
 * Customer personas: hunting a component on `/catalog`, often at 1440, hurried.
 * UI decisions: catalog header is brand + primary nav + Search ⌘K + GitHub text, because the customer is already in the kit and needs find-in-docs, not Get started.
 */
function CatalogDesktopHeader() {
  return (
    <MarketingDesktopNav
      mark="catalog"
      actions={
        <>
          <SiteFullSearchTrigger />
          <HomeGitHubLink />
        </>
      }
    />
  );
}

/** Marketing header slot: phone header below md. Home and Catalog use the mockup desktop chrome; other routes keep fumadocs Header. */
export function MarketingSiteHeader() {
  const pathname = usePathname();
  const home = isHomePath(pathname);
  const catalog = isCatalogPath(pathname);
  return (
    <>
      <MobileHeader mode="home" />
      {home ? (
        <HomeDesktopHeader />
      ) : catalog ? (
        <CatalogDesktopHeader />
      ) : (
        <Header className="max-md:hidden" />
      )}
    </>
  );
}

/** Docs layout phone header (desktop docs chrome has no top bar). */
export function DocsSiteHeader() {
  return (
    <MobileHeader
      mode="docs"
      className="sticky top-(--fd-docs-row-1) flex min-h-phone-bar flex-wrap items-center border-b px-page-gutter backdrop-blur-sm [grid-area:header] md:hidden"
    />
  );
}
