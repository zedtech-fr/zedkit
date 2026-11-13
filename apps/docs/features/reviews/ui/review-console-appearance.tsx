"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ThemeScope, identityPresets } from "@zedtech/zedkit-ui";

import {
  compactPreviewSpacing,
  hasReviewAppearanceQuery,
  parseReviewAppearance,
} from "../model/review-appearance";

/**
 * Full-viewport ThemeScope for the live console. Same pin rule as
 * `ReviewAppearanceFrame`: appearance query keys pin identity+mode to codec
 * defaults; an empty query inherits `html` identity and `.dark` from the site
 * script. No look-control strip — the dock and a share URL are enough.
 */
export function ReviewConsoleAppearanceFrame({ children }: { children: ReactNode }) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  useEffect(() => {
    setSearch(window.location.search);
  }, []);
  const appearance = parseReviewAppearance(search);
  const pin = hasReviewAppearanceQuery(search);
  const tokens = identityPresets[appearance.identity] ?? identityPresets.glass;
  const compact =
    appearance.density === "compact" ? compactPreviewSpacing(tokens.spacing) : undefined;
  useEffect(() => {
    const node = scopeRef.current;
    if (!node) return;
    if (compact) node.style.setProperty("--spacing", compact);
    else node.style.removeProperty("--spacing");
  }, [compact]);

  return (
    <ThemeScope
      ref={scopeRef}
      identity={pin ? appearance.identity : undefined}
      mode={pin ? appearance.mode : undefined}
      data-review-console=""
      className="flex h-svh pane-shrink flex-col overflow-hidden bg-background text-foreground"
    >
      {children}
    </ThemeScope>
  );
}
