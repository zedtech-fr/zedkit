/** Routes exercised by site-semantics e2e (#300). Flip flags when landing/tutorial PRs land. */
export interface SiteAuditRoute {
  path: string;
  label: string;
  /** Axe on `main`, nested-interactive, and ambiguous link names in `main`. */
  strictSemantics: boolean;
  /** Nested-interactive + link names without axe (home until layout axe is stable). */
  linkAndInteractiveAudit?: boolean;
  /** Wide MDX tables/code: #385 column width is covered by docs-mobile-layout.spec.ts. */
  skipMobileOverflow?: boolean;
}

export const SITE_AUDIT_ROUTES: SiteAuditRoute[] = [
  {
    path: "/",
    label: "home",
    strictSemantics: false,
    linkAndInteractiveAudit: true,
  },
  {
    path: "/docs",
    label: "docs-index",
    strictSemantics: true,
    // Overflow check flaky here (verified 2026-10-26); mobile lane owns the fix.
    skipMobileOverflow: true,
  },
  {
    path: "/docs/getting-started",
    label: "getting-started",
    strictSemantics: true,
    // Still overflows at phone width (verified 2026-10-26); mobile lane owns the fix.
    skipMobileOverflow: true,
  },
  {
    path: "/docs/build-an-admin-dashboard",
    label: "tutorial-dashboard",
    strictSemantics: true,
  },
  {
    path: "/docs/set-up-your-coding-agents",
    label: "tutorial-agents",
    strictSemantics: true,
    // Overflows in CI while green locally (verified 2026-10-26); mobile lane owns the fix.
    skipMobileOverflow: true,
  },
  {
    path: "/docs/nest/start-a-safe-nestjs-api",
    label: "tutorial-nest",
    strictSemantics: true,
  },
  {
    path: "/docs/add-seo-to-nextjs",
    label: "tutorial-seo",
    strictSemantics: true,
  },
  {
    path: "/docs/zedkit-and-shadcn",
    label: "tutorial-shadcn",
    strictSemantics: true,
  },
];

/** Registry URLs advertised on doc pages; must stay 200 on the served export. */
export const REGISTRY_SMOKE_URLS = ["/r/badge.json", "/r/drawer.json", "/r/confirm-dialog.json"] as const;
