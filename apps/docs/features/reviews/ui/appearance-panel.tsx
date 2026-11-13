"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Container, Stack, ThemeScope, identityPresets } from "@zedtech/zedkit-ui";

import {
  compactPreviewSpacing,
  hasReviewAppearanceQuery,
  parseReviewAppearance,
} from "../model/review-appearance";

export function ReviewAppearanceFrame({
  children,
  layout = "page",
}: {
  children: ReactNode;
  layout?: "page" | "workspace";
}) {
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
      className="bg-background text-foreground"
    >
      <Container
        width="full"
        data-issues-column=""
        {...(layout === "workspace" ? { "data-issues-layout": "workspace" } : {})}
        className="max-w-(--zk-header-max-width) py-section-sm pb-section-lg"
      >
        <Stack gap="lg">{children}</Stack>
      </Container>
    </ThemeScope>
  );
}
