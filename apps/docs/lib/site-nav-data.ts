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

export function isFoundationsPath(pathname: string): boolean {
  return pathname === "/docs/foundations" || pathname === "/docs/foundations/";
}

export function isCatalogPath(pathname: string): boolean {
  return pathname === "/catalog";
}

export function isDocsPath(pathname: string): boolean {
  return pathname === "/docs" || pathname.startsWith("/docs/");
}

/** Full-viewport live console routes. The public run history list stays on marketing chrome. */
export function isLiveConsolePath(pathname: string): boolean {
  const path = pathname.split("?")[0] ?? pathname;
  if (path === "/issues/run" || path.startsWith("/issues/run/")) return true;
  return /^\/issues\/(?:pr\/)?[^/]+\/runs\//.test(path);
}

export type SiteDesktopHeaderKind = "home" | "catalog" | "docs" | "none";

/** Which desktop `#nd-nav` mark the persistent host should keep mounted. */
export function siteDesktopHeaderKind(pathname: string): SiteDesktopHeaderKind {
  if (isLiveConsolePath(pathname) || isFoundationsPath(pathname)) return "none";
  if (isHomePath(pathname)) return "home";
  if (isDocsPath(pathname)) return "docs";
  return "catalog";
}

/**
 * Phone (and policy) chrome: which actions a path may mount.
 * GitHub is always mounted: desktop bar, and the phone site menu (not a second header row).
 * Theme, version, and a site-nav disclosure are never on.
 * The phone page tree is a kit Drawer in the docs shell (DocsSidebar always mounts desktop `#nd-sidebar`; the drawer clone has no id; DocsContainer omits inline gridTemplate so docs-shell-tokens.css can restack header + trigger + main).
 * Foundations keeps search and has no page tree (sidebar off in the docs layout).
 */
export function siteHeaderChrome(pathname: string) {
  const home = isHomePath(pathname);
  return {
    links: sitePrimaryNavLinks(),
    search: !home,
    getStarted: home,
  };
}

export function sitePrimaryNavLinks(): SiteNavLink[] {
  return [
    { text: "AI", href: "/docs/ai/setup", active: "url" },
    { text: "UI", href: "/docs/foundations", active: "url" },
    { text: "Docs", href: "/docs", active: "url" },
    { text: "Catalog", href: "/catalog", active: "url" },
    { text: "Issues", href: "/issues", active: "nested-url" },
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
