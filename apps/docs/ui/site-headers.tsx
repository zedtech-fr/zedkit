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
import { isCatalogPath, isFoundationsPath, isHomePath, isSiteNavLinkActive, sitePrimaryNavLinks } from "@/lib/site-nav-data";

function MarketingDesktopNav({
  mark,
  actions,
  className,
}: {
  mark: "home" | "catalog" | "docs";
  actions: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const markAttr =
    mark === "home"
      ? { "data-home-header": "" }
      : mark === "catalog"
        ? { "data-catalog-header": "" }
        : { "data-docs-header": "" };
  return (
    <header
      id="nd-nav"
      {...markAttr}
      className={cn("sticky pin-top z-header max-md:hidden", className)}
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
 * UI decisions: home-style bar plus Search ⌘K; no version, theme, sidebar, or TOC.
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
          <SiteFullSearchTrigger />
          <HomeGitHubLink />
          <HomeGetStartedAction />
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
      <MobileHeader
        mode="docs"
        className="sticky top-(--fd-docs-row-1) z-header flex min-h-phone-bar flex-wrap items-center border-b bg-background px-page-gutter backdrop-blur-sm [grid-area:header] md:hidden"
      />
      {foundations ? <FoundationsDesktopHeader /> : null}
    </>
  );
}
