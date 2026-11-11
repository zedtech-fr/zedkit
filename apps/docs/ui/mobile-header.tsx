"use client";

import { useState, useSyncExternalStore } from "react";
import { DocsAppLink } from "@/ui/docs-app-link";
import { OffPathLink } from "@/ui/off-path-link";
import { usePathname } from "next/navigation";
import { Menu, Moon, Sun } from "lucide-react";
import { GithubIcon } from "@/ui/github-icon";
import { useTheme } from "next-themes";
import { useSidebar } from "fumadocs-ui/components/sidebar/base";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  IconButton,
} from "@zedtech/zedkit-ui";
import { HomeGetStartedAction, HomeGitHubLink } from "@/ui/home-header-actions";
import { MobileSearchTrigger } from "@/ui/mobile-search-trigger";
import { SiteBrand } from "@/ui/site-brand";
import { SiteFullSearchTrigger } from "@/ui/site-chrome";
import { KitVersionLabel } from "@/ui/kit-version-label";
import { siteChromeCopy } from "@/ui/i18n/site-chrome-copy";
import { SITE_GITHUB_URL } from "@/lib/site-links.mjs";
import { SHELL_NAV_PRIMARY_ITEM_CLASS } from "@/lib/shell-nav-classes";
import {
  isHomePath,
  isSiteNavLinkActive,
  sitePrimaryNavLinks,
  type SiteNavLink,
} from "@/lib/site-nav-data";

const iconButtonClassName =
  "inline-flex min-h-overlay-touch-target min-w-overlay-touch-target items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-ring-control";

const noop = () => () => {};

function ThemeButton({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const dark = mounted && resolvedTheme === "dark";
  return (
    <IconButton
      label={siteChromeCopy.theme.toggleAriaLabel}
      variant="ghost"
      size="icon"
      className={className ?? iconButtonClassName}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <Moon aria-hidden="true" className="size-icon" /> : <Sun aria-hidden="true" className="size-icon" />}
    </IconButton>
  );
}

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

function NavDrawerLink({
  link,
  pathname,
  onNavigate,
  className,
}: {
  link: SiteNavLink;
  pathname: string;
  onNavigate: () => void;
  className: string;
}) {
  const active = isSiteNavLinkActive(pathname, link);
  const itemClassName = `${className}${active ? " menu-current text-foreground" : ""}`;
  if (link.external) {
    return (
      <OffPathLink
        href={link.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={itemClassName}
      >
        <span className="content-shrink flex-1">{link.text}</span>
      </OffPathLink>
    );
  }
  return (
    <DocsAppLink
      href={link.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={itemClassName}
    >
      <span className="content-shrink flex-1">{link.text}</span>
    </DocsAppLink>
  );
}

function SiteNavDrawerBody({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const home = isHomePath(pathname);
  const primary = sitePrimaryNavLinks();

  return (
    <div data-shell-nav-drawer className="flex flex-col gap-stack-lg overflow-y-auto px-drawer-chrome-padding pb-sheet">
      {home ? null : (
        <div className="w-full [&_[data-search]]:w-full">
          <SiteFullSearchTrigger className="w-full max-w-none" />
        </div>
      )}
      <nav aria-label={siteChromeCopy.nav.menu} className="flex flex-col gap-stack-tight">
        {primary.map((link) => (
          <NavDrawerLink
            key={link.href}
            link={link}
            pathname={pathname}
            onNavigate={onNavigate}
            className={SHELL_NAV_PRIMARY_ITEM_CLASS}
          />
        ))}
      </nav>
      {home ? (
        <div data-shell-drawer-foot="" className="flex flex-col gap-stack-md border-t content-offset">
          <HomeGitHubLink className={SHELL_NAV_PRIMARY_ITEM_CLASS} />
          <HomeGetStartedAction onClick={onNavigate} />
        </div>
      ) : (
        <div data-shell-drawer-foot="" className="flex items-center justify-between gap-stack-md border-t content-offset">
          <OffPathLink
            href={SITE_GITHUB_URL}
            className={`${SHELL_NAV_PRIMARY_ITEM_CLASS} inline-flex w-auto gap-stack-sm text-muted-foreground`}
          >
            <GithubIcon className="size-icon shrink-0" />
            {siteChromeCopy.nav.github}
          </OffPathLink>
          <ThemeButton />
        </div>
      )}
    </div>
  );
}

function SiteNavDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const close = () => onOpenChange(false);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHandle />
        <DrawerHeader className="sr-only">
          <DrawerTitle>{siteChromeCopy.nav.menu}</DrawerTitle>
          <DrawerDescription>{siteChromeCopy.nav.siteNavigation}</DrawerDescription>
        </DrawerHeader>
        <SiteNavDrawerBody onNavigate={close} />
      </DrawerContent>
    </Drawer>
  );
}

function HomeMenuButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <IconButton
        label={siteChromeCopy.nav.openMenu}
        variant="ghost"
        size="icon"
        aria-haspopup="dialog"
        className={iconButtonClassName}
        onClick={() => setOpen(true)}
      >
        <Menu aria-hidden="true" className="size-icon" />
      </IconButton>
      <SiteNavDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}

/**
 * Phone header (< md): brand at the left; remaining chrome at the right.
 * Home `/` is brand, GitHub text, Get started, and the menu — no search, theme, or version.
 */
export function MobileHeader({
  mode,
  className,
  version,
  releasesHref,
}: {
  mode: "home" | "docs";
  className?: string;
  version: string;
  releasesHref: string;
}) {
  const home = isHomePath(usePathname());
  return (
    <>
      <header
        id="nd-mobile-nav"
        {...(mode === "docs" ? { "data-docs-phone-bar": "" } : {})}
        className={
          className ??
          "sticky pin-top z-header flex h-phone-bar items-center justify-between gap-stack-sm border-b bg-background px-control-tight md:hidden"
        }
      >
        <div className="flex content-shrink items-center gap-icon">
          <DocsAppLink
            href="/"
            aria-label={siteChromeCopy.brand.homeAriaLabel}
            className="inline-flex min-h-overlay-touch-target items-center rounded-md px-touch text-foreground focus-ring-control"
          >
            <SiteBrand />
          </DocsAppLink>
          {home ? null : (
            <span className="hidden sm:inline-flex">
              <KitVersionLabel version={version} releasesHref={releasesHref} tone="shell" />
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center">
          {home ? (
            <>
              <HomeGitHubLink className="px-touch" />
              <HomeGetStartedAction />
              <HomeMenuButton />
            </>
          ) : (
            <>
              <MobileSearchTrigger className={iconButtonClassName} />
              <ThemeButton />
              <OffPathLink href={SITE_GITHUB_URL} aria-label={siteChromeCopy.nav.github} className={iconButtonClassName}>
                <GithubIcon className="size-icon" />
              </OffPathLink>
              {mode === "docs" ? <DocsMenuButton /> : <HomeMenuButton />}
            </>
          )}
        </div>
      </header>
    </>
  );
}
