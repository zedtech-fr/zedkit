"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@zedtech/zedkit-ui";
import { DocsAppLink } from "@/components/site-chrome/docs-app-link";
import { HomeGetStartedAction, HomeGitHubLink } from "@/components/site-chrome/header-actions";
import { MobileHeader } from "@/components/site-chrome/mobile-header";
import { SiteBrand } from "@/components/site-chrome/site-brand";
import { SiteFullSearchTrigger, SiteSearchTrigger } from "@/components/site-chrome/site-chrome";
import { siteChromeCopy } from "@/components/site-chrome/i18n/site-chrome-copy";
import { isFoundationsPath, isSiteNavLinkActive, sitePrimaryNavLinks } from "@/lib/site-nav-data";

const HEADER_MARK = {
  home: { "data-home-header": "" },
  catalog: { "data-catalog-header": "" },
  docs: { "data-docs-header": "" },
} as const;

function MarketingDesktopNav({
  mark,
  actions,
  className,
}: {
  mark: keyof typeof HEADER_MARK;
  actions: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <header
      id="nd-nav"
      {...HEADER_MARK[mark]}
      className={cn("sticky pin-top z-header [--fd-layout-width:var(--zk-header-max-width)] max-md:hidden", className)}
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
 * UI decisions: home header is brand + AI/UI/Docs/Catalog/Issues + GitHub text + Get started, because customer = first-visit integrator on `/`.
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
function SearchGitHubDesktopHeader({ mark }: { mark: "catalog" | "docs" }) {
  return (
    <MarketingDesktopNav
      mark={mark}
      actions={
        <>
          <SiteFullSearchTrigger />
          <HomeGitHubLink />
        </>
      }
    />
  );
}

function CatalogDesktopHeader() {
  return <SearchGitHubDesktopHeader mark="catalog" />;
}

/**
 * Customer personas: reading `/docs/foundations` as a marketing-style guide, not a docs article.
 * UI decisions: home-style bar plus search (icon below lg, Search ⌘K from lg so the bar fits 809); no version, theme, sidebar, or TOC.
 * Search is on this bar because the 7-section guide has no in-page nav (#73); the quiet-glass mockup has zero search hits.
 * Reuses mark="home" so the bar shares home chrome CSS (`data-home-header`); it is not the home route.
 * Desktop Get started is the home-style bar; phone follows siteHeaderChrome (`getStarted: home` only).
 */
function FoundationsDesktopHeader() {
  return (
    <MarketingDesktopNav
      mark="home"
      className="[grid-area:header]"
      actions={
        <>
          <SiteSearchTrigger className="lg:hidden" />
          <SiteFullSearchTrigger className="max-lg:hidden" />
          <HomeGitHubLink />
          <HomeGetStartedAction />
        </>
      }
    />
  );
}

/** Home header slot: phone header below md; desktop is brand + Get started, no search. */
export function HomeMarketingHeader() {
  return (
    <>
      <MobileHeader />
      <HomeDesktopHeader />
    </>
  );
}

/** Marketing header slot: phone header below md. Every (site) route uses the shared desktop bar (search + GitHub). */
export function MarketingSiteHeader() {
  return (
    <>
      <MobileHeader />
      <CatalogDesktopHeader />
    </>
  );
}

/**
 * Customer personas: integrating developer on a docs page at 1440, hurried.
 * UI decisions: docs header is brand + primary nav + Search ⌘K + GitHub text, because the customer already uses that bar on Home and Catalog.
 */
export function DocsDesktopHeader() {
  return <SearchGitHubDesktopHeader mark="docs" />;
}

/** Docs layout phone header. Desktop docs chrome is DocsDesktopHeader above the shell, except foundations. */
export function DocsSiteHeader() {
  const foundations = isFoundationsPath(usePathname());
  return (
    <>
      <MobileHeader className="sticky top-(--fd-docs-row-1) z-header flex min-h-phone-bar flex-nowrap items-center border-b bg-background px-page-gutter backdrop-blur-sm [grid-area:header] md:hidden" />
      {foundations ? <FoundationsDesktopHeader /> : null}
    </>
  );
}
