/** Routes exercised by site-semantics e2e (#300). Flip flags when landing/tutorial PRs land. */
export interface SiteAuditRoute {
  path: string;
  label: string;
  /** Axe on `main`, nested-interactive, and ambiguous link names in `main`. */
  strictSemantics: boolean;
  /** Nested-interactive + link names without axe (home until layout axe is stable). */
  linkAndInteractiveAudit?: boolean;
  /** Skip entire row when the static export has no page yet. */
  pendingPath?: boolean;
  /** Prose/card layouts wider than narrow `main` on mobile until layout refresh (#286). */
  skipMobileOverflow?: boolean;
}

export const SITE_AUDIT_ROUTES: SiteAuditRoute[] = [
  {
    path: "/",
    label: "home",
    strictSemantics: false,
    linkAndInteractiveAudit: true,
  },
  { path: "/docs", label: "docs-index", strictSemantics: true, skipMobileOverflow: true },
  {
    path: "/docs/getting-started",
    label: "getting-started",
    strictSemantics: true,
    skipMobileOverflow: true,
  },
  {
    path: "/docs/build-an-admin-dashboard",
    label: "tutorial-dashboard",
    strictSemantics: true,
    skipMobileOverflow: true,
  },
  {
    path: "/docs/set-up-your-coding-agents",
    label: "tutorial-agents",
    strictSemantics: true,
    skipMobileOverflow: true,
  },
  {
    path: "/docs/nest/start-a-safe-nestjs-api",
    label: "tutorial-nest",
    strictSemantics: true,
    skipMobileOverflow: true,
  },
  {
    path: "/docs/add-seo-to-nextjs",
    label: "tutorial-seo",
    strictSemantics: true,
    skipMobileOverflow: true,
  },
  {
    path: "/docs/zedkit-and-shadcn",
    label: "tutorial-shadcn",
    strictSemantics: true,
    skipMobileOverflow: true,
  },
];

/** Registry URLs advertised on doc pages; must stay 200 on the served export. */
export const REGISTRY_SMOKE_URLS = ["/r/badge.json", "/r/drawer.json", "/r/confirm-dialog.json"] as const;
