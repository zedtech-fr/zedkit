"use client";

import type { ComponentProps } from "react";
import { cn } from "@zedtech/zedkit-ui";

/**
 * Fumadocs 16.17.10 `Container` sets inline `gridTemplate` on `#nd-docs-layout`,
 * which beats the phone restack in `docs-shell-tokens.css`. Own the variables
 * here; the stylesheet owns both breakpoint templates and `--fd-sidebar-width`
 * (phone is header + docs-nav trigger + main, not an in-flow page tree).
 */
export function DocsContainer({ className, ...props }: ComponentProps<"div">) {
  const rest = { ...props };
  delete rest.style;
  return (
    <div
      id="nd-docs-layout"
      {...rest}
      className={cn(
        "grid min-h-(--fd-docs-height) overflow-x-clip [--fd-docs-height:100dvh] [--fd-docs-row-1:var(--fd-banner-height,0px)] [--fd-docs-row-2:calc(var(--fd-docs-row-1)+var(--fd-header-height))] [--fd-docs-row-3:calc(var(--fd-docs-row-2)+var(--fd-toc-popover-height))] [--fd-header-height:0px] [--fd-sidebar-col:var(--fd-sidebar-width)] [--fd-toc-popover-height:0px] [--fd-toc-width:0px]",
        className,
      )}
    />
  );
}
