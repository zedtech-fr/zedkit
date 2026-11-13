"use client";

import type { ReactNode } from "react";
import { ThemeScope } from "@zedtech/zedkit-ui";

import { useReviewAppearanceScope } from "./use-review-appearance-scope";

/**
 * Full-viewport ThemeScope for the live console. Same pin rule as
 * `ReviewAppearanceFrame` (`useReviewAppearanceScope`): appearance query keys
 * pin identity+mode to codec defaults; an empty query inherits `html`
 * `data-identity` (IdentityScript) and `.dark` (theme provider). No
 * look-control strip — the dock and a share URL are enough.
 */
export function ReviewConsoleAppearanceFrame({ children }: { children: ReactNode }) {
  const { scopeRef, identity, mode } = useReviewAppearanceScope();

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
