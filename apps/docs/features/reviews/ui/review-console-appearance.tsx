"use client";

import type { ReactNode } from "react";
import { ThemeScope } from "@zedtech/zedkit-ui";

import { consoleScopeAppearance } from "../model/review-appearance";
import { useReviewAppearanceScope } from "./use-review-appearance-scope";

/**
 * Full-viewport ThemeScope for the live console. The console defaults to a
 * dark preview (identity still inherits `html` `data-identity` from
 * IdentityScript); a share URL with appearance keys pins identity+mode
 * instead. No look-control strip — the dock and a share URL are enough.
 */
export function ReviewConsoleAppearanceFrame({ children }: { children: ReactNode }) {
  const { scopeRef, identity, mode } = useReviewAppearanceScope(consoleScopeAppearance);

  return (
    <ThemeScope
      ref={scopeRef}
      identity={identity}
      mode={mode}
      data-review-console=""
      className="flex h-svh pane-shrink flex-col overflow-hidden bg-background text-foreground"
    >
      {children}
    </ThemeScope>
  );
}
