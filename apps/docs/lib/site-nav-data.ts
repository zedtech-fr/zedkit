import type { LinkItemType } from "fumadocs-ui/layouts/shared";

export type SiteNavLink = {
  text: string;
  href: string;
  external?: boolean;
  active?: "url" | "nested-url";
};

export function isHomePath(pathname: string): boolean {
  return pathname === "/" || pathname === "";
}

export function isCatalogPath(pathname: string): boolean {
  return pathname === "/catalog";
}

/**
 * Phone (and policy) chrome: which actions a path may mount.
 * GitHub is always mounted. Theme, version, and a site-nav disclosure are never on.
 * The page tree is in-flow, so `docsTreeOpener` stays off.
 */
export function siteHeaderChrome(pathname: string) {
  const home = isHomePath(pathname);
  return {
    links: sitePrimaryNavLinks(),
    search: !home,
    getStarted: home,
    docsTreeOpener: false,
  };
}

export function sitePrimaryNavLinks(): SiteNavLink[] {
  return [
    { text: "AI", href: "/docs/ai/setup", active: "url" },
    { text: "UI", href: "/docs/foundations", active: "url" },
    { text: "Docs", href: "/docs", active: "url" },
    { text: "Catalog", href: "/catalog", active: "url" },
  ];
}

export function isSiteNavLinkActive(pathname: string, link: SiteNavLink): boolean {
  if (link.external || !link.active) return false;
  if (link.active === "nested-url") {
    return pathname === link.href || pathname.startsWith(`${link.href}/`);
  }
  return pathname === link.href;
}

/** Fumadocs header link model (desktop chrome). */
export function siteHeaderLinks(): LinkItemType[] {
  return sitePrimaryNavLinks().map((item) => ({
    text: item.text,
    url: item.href,
    ...(item.active ? { active: item.active } : {}),
    ...(item.external ? { external: true } : {}),
  }));
}
