"use client";

import { useState, useSyncExternalStore } from "react";
import { DocsAppLink } from "@/ui/docs-app-link";
import { usePathname } from "next/navigation";
import { ExternalLink, Menu, Moon, Sun } from "lucide-react";
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
  Text,
} from "@zedtech/zedkit-ui";
import { MobileSearchTrigger } from "@/ui/mobile-search-trigger";
import { SiteBrand } from "@/ui/site-brand";
import { SiteFullSearchTrigger } from "@/ui/site-chrome";
import { KitVersionLabel } from "@/ui/kit-version-label";
import { siteChromeCopy } from "@/ui/i18n/site-chrome-copy";
import { SITE_GITHUB_URL } from "@/lib/site-links.mjs";
import {
  SHELL_NAV_GUIDE_ITEM_CLASS,
  SHELL_NAV_GUIDE_LABEL_CLASS,
  SHELL_NAV_PRIMARY_ITEM_CLASS,
} from "@/lib/shell-nav-classes";
import {
  isSiteNavLinkActive,
  sitePrimaryNavLinks,
  SITE_GUIDE_LINKS,
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
  return (
    <DocsAppLink
      href={link.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`${className}${active ? " menu-current text-foreground" : ""}`}
      {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      <span className="content-shrink flex-1">{link.text}</span>
      {link.external ? <ExternalLink aria-hidden="true" data-external-mark="" className="size-icon shrink-0" /> : null}
    </DocsAppLink>
  );
}

function SiteNavDrawerBody({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const primary = sitePrimaryNavLinks();

  return (
    <div data-shell-nav-drawer className="flex flex-col gap-stack-lg overflow-y-auto px-drawer-chrome-padding pb-sheet">
      <div className="w-full [&_[data-search]]:w-full">
        <SiteFullSearchTrigger className="w-full max-w-none" />
      </div>
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
        <Text className={SHELL_NAV_GUIDE_LABEL_CLASS} data-nav-group="">
          {siteChromeCopy.nav.guides}
        </Text>
        {SITE_GUIDE_LINKS.map((link) => (
          <NavDrawerLink
            key={link.href}
            link={link}
            pathname={pathname}
            onNavigate={onNavigate}
            className={SHELL_NAV_GUIDE_ITEM_CLASS}
          />
        ))}
      </nav>
      <div data-shell-drawer-foot="" className="flex items-center justify-between gap-stack-md border-t content-offset">
        <a
          href={SITE_GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className={`${SHELL_NAV_PRIMARY_ITEM_CLASS} inline-flex w-auto gap-stack-sm text-muted-foreground`}
        >
          <GithubIcon className="size-icon shrink-0" />
          {siteChromeCopy.nav.github}
        </a>
        <ThemeButton />
      </div>
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
 * Phone header (< md): brand and version at the left; menu, theme, and GitHub at the right.
 * Search opens from the header on phone (top bar + results sheet).
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
          <span className="hidden sm:inline-flex">
            <KitVersionLabel version={version} releasesHref={releasesHref} tone="shell" />
          </span>
        </div>
        <div className="flex shrink-0 items-center">
          <MobileSearchTrigger className={iconButtonClassName} />
          <ThemeButton />
          <a href={SITE_GITHUB_URL} target="_blank" rel="noreferrer" aria-label={siteChromeCopy.nav.github} className={iconButtonClassName}>
            <GithubIcon className="size-icon" />
          </a>
          {mode === "docs" ? <DocsMenuButton /> : <HomeMenuButton />}
        </div>
      </header>
    </>
  );
}
