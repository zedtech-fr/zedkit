/** Routes exercised by site-semantics e2e (#300). Flip flags when landing/tutorial PRs land. */
export interface SiteAuditRoute {
  path: string;
  label: string;
  /** Nested-interactive + unique link names (blocked on home until #286). */
  strictSemantics: boolean;
  /** Skip entire row when the static export has no page yet (#289, #290–#293). */
  pendingPath?: boolean;
}

export const SITE_AUDIT_ROUTES: SiteAuditRoute[] = [
  { path: "/", label: "home", strictSemantics: false },
  { path: "/docs", label: "docs-index", strictSemantics: true },
  {
    path: "/docs/getting-started",
    label: "getting-started",
    strictSemantics: true,
  },
  {
    path: "/docs/guides/build-admin-dashboard",
    label: "tutorial-dashboard",
    strictSemantics: true,
    pendingPath: true,
  },
  {
    path: "/docs/guides/coding-agents",
    label: "tutorial-agents",
    strictSemantics: true,
    pendingPath: true,
  },
  {
    path: "/docs/guides/nestjs-api",
    label: "tutorial-nest",
    strictSemantics: true,
    pendingPath: true,
  },
  {
    path: "/docs/guides/nextjs-seo",
    label: "tutorial-seo",
    strictSemantics: true,
    pendingPath: true,
  },
];

/** Registry URLs advertised on doc pages; must stay 200 on the served export. */
export const REGISTRY_SMOKE_URLS = ["/r/badge.json", "/r/drawer.json"] as const;
