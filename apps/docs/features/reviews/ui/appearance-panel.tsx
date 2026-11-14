"use client";

import type { ReactNode } from "react";
import { Container, Stack, ThemeScope } from "@zedtech/zedkit-ui";

import { useReviewAppearanceScope } from "./use-review-appearance-scope";

export function ReviewAppearanceFrame({
  children,
  layout = "page",
}: {
  children: ReactNode;
  layout?: "page" | "workspace";
}) {
  const { scopeRef, identity, mode } = useReviewAppearanceScope();

  return (
    <ThemeScope
      ref={scopeRef}
      identity={identity}
      mode={mode}
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
