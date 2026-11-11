"use client";

import { Header } from "fumadocs-ui/layouts/home/slots/header";
import { usePathname } from "next/navigation";
import {
  featuredPackageReleasesUrl,
  featuredPackageVersion,
} from "@/content/gallery";
import { cn } from "@zedtech/zedkit-ui";
import { DocsAppLink } from "@/ui/docs-app-link";
import { HomeGetStartedAction, HomeGitHubLink } from "@/ui/home-header-actions";
import { MobileHeader } from "@/ui/mobile-header";
import { SiteBrand } from "@/ui/site-brand";
import { siteChromeCopy } from "@/ui/i18n/site-chrome-copy";
import { isHomePath, isSiteNavLinkActive, sitePrimaryNavLinks } from "@/lib/site-nav-data";

/**
 * Métier: public TypeScript kit documentation site.
 * Client personas: integrating developers who own the consuming app.
 * Customers: those same developers (this site is the product surface).
 * Customer personas: first visit on `/` — next action is Get started or Docs, not search or a version chip.
 * UI decisions: home header is brand + AI/UI/Docs/Catalog + GitHub text + Get started, because customer = first-visit integrator on `/`.
 */
function HomeDesktopHeader() {
  const pathname = usePathname();
  return (
    <header id="nd-nav" data-home-header="" className="sticky pin-top z-header max-md:hidden">
      <div>
        <nav
          aria-label={siteChromeCopy.nav.siteNavigation}
          className="mx-auto flex w-full max-w-(--fd-layout-width) items-center gap-stack-lg px-page-gutter"
        >
          <DocsAppLink
            href="/"
            aria-label={siteChromeCopy.brand.homeAriaLabel}
            className="inline-flex items-center gap-icon text-foreground focus-ring-control"
          >
            <SiteBrand />
          </DocsAppLink>
          <ul className="flex list-none items-center gap-stack-lg flush">
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
          <div className="ms-auto flex items-center gap-stack-md">
            <HomeGitHubLink />
            <HomeGetStartedAction />
          </div>
        </nav>
      </div>
    </header>
  );
}

/** Marketing header slot: phone header below md, stock desktop header from md up. Home `/` uses the mockup allowlist. */
export function MarketingSiteHeader() {
  const home = isHomePath(usePathname());
  return (
    <>
      <MobileHeader
        mode="home"
        version={featuredPackageVersion}
        releasesHref={featuredPackageReleasesUrl}
      />
      {home ? <HomeDesktopHeader /> : <Header className="max-md:hidden" />}
    </>
  );
}

/** Docs layout phone header (desktop docs chrome has no top bar). */
export function DocsSiteHeader() {
  return (
    <MobileHeader
      mode="docs"
      version={featuredPackageVersion}
      releasesHref={featuredPackageReleasesUrl}
      className="sticky top-(--fd-docs-row-1) flex h-phone-bar items-center justify-between gap-stack-sm border-b px-control-tight backdrop-blur-sm [grid-area:header] md:hidden"
    />
  );
}
