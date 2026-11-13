"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import {
  cn,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  IconButton,
} from "@zedtech/zedkit-ui";
import { DocsAppLink } from "@/ui/docs-app-link";
import { HomeGetStartedAction, HomeGitHubLink } from "@/ui/home-header-actions";
import { SiteBrand } from "@/ui/site-brand";
import { SiteSearchTrigger } from "@/ui/site-chrome";
import { siteChromeCopy } from "@/ui/i18n/site-chrome-copy";
import { isSiteNavLinkActive, siteHeaderChrome, type SiteNavLink } from "@/lib/site-nav-data";

/**
 * Métier: public TypeScript kit documentation site.
 * Client personas: integrating developers who own the consuming app.
 * Customers: those same developers (this site is the product surface).
 * Customer personas: hurried first visit on a 390px phone — next action is Get started or a primary nav link, not a taller chrome that pushes the hero off the first screen.
 * UI decisions: compact one-row bar (wordmark left; Get started or icon search, then Menu) because customer = hurried phone visitor who needs the first screen to start at the hero. Menu is a kit Drawer of AI / UI / Docs / Catalog / Issues / GitHub because those links must stay reachable after the wrap is removed.
 *
 * Phone header (< md): wordmark; path primary action; Menu. Home: Get started, no search.
 * Else: icon search. GitHub lives in the menu. Docs routes do not open a page-tree drawer
 * from this bar: that control lives in DocsSidebar. Foundations has no page tree. Never theme, version, or a site-nav disclosure.
 */
function PhoneSiteMenuPanel({
  pathname,
  links,
  onNavigate,
}: {
  pathname: string;
  links: SiteNavLink[];
  onNavigate: () => void;
}) {
  return (
    <DrawerContent>
      <DrawerHeader className="flex-row items-center justify-end">
        <DrawerTitle className="sr-only">{siteChromeCopy.nav.siteNavigation}</DrawerTitle>
        <DrawerCloseButton />
      </DrawerHeader>
      <DrawerBody
        tabIndex={0}
        className="focus-ring"
        onClick={(event) => {
          const node = event.target;
          if (!(node instanceof Node)) return;
          const el = node instanceof Element ? node : node.parentElement;
          if (el?.closest("a")) onNavigate();
        }}
      >
        <nav aria-label={siteChromeCopy.nav.siteNavigation}>
          <ul className="flex list-none flex-col items-stretch flush">
            {links.map((link) => {
              const active = isSiteNavLinkActive(pathname, link);
              return (
                <li key={link.href}>
                  <DocsAppLink
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-overlay-touch-target items-center text-zk-type-nav text-muted-foreground hover:text-foreground",
                      active && "text-foreground underline link-offset",
                    )}
                  >
                    {link.text}
                  </DocsAppLink>
                </li>
              );
            })}
            <li>
              <HomeGitHubLink />
            </li>
          </ul>
        </nav>
      </DrawerBody>
    </DrawerContent>
  );
}

export function MobileHeader({ className }: { className?: string }) {
  const pathname = usePathname();
  const chrome = siteHeaderChrome(pathname);
  const docsPhoneBar = pathname === "/docs" || pathname.startsWith("/docs/");
  const [open, setOpen] = useState(false);
  return (
    <Drawer direction="right" mobile="side" open={open} onOpenChange={setOpen}>
      <header
        id="nd-mobile-nav"
        {...(docsPhoneBar ? { "data-docs-phone-bar": "" } : {})}
        className={
          className ??
          "sticky pin-top z-header flex min-h-phone-bar flex-nowrap items-center border-b bg-background px-page-gutter md:hidden"
        }
      >
        <DocsAppLink
          href="/"
          aria-label={siteChromeCopy.brand.homeAriaLabel}
          className="inline-flex min-h-overlay-touch-target items-center gap-icon rounded-md text-foreground focus-ring-control"
        >
          <SiteBrand />
        </DocsAppLink>
        <div data-header-actions="" className="ms-auto flex items-center">
          {chrome.search ? (
            <SiteSearchTrigger className="min-h-overlay-touch-target min-w-overlay-touch-target" />
          ) : null}
          {chrome.getStarted ? <HomeGetStartedAction /> : null}
          <DrawerTrigger asChild>
            <IconButton
              label={siteChromeCopy.nav.menu}
              variant="ghost"
              aria-expanded={open}
              className="min-h-overlay-touch-target min-w-overlay-touch-target"
            >
              <Menu aria-hidden="true" />
            </IconButton>
          </DrawerTrigger>
        </div>
      </header>
      <PhoneSiteMenuPanel pathname={pathname} links={chrome.links} onNavigate={() => setOpen(false)} />
    </Drawer>
  );
}
