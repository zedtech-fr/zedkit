"use client";

import type { ComponentProps, CSSProperties } from "react";
import { cn } from "@zedtech/zedkit-ui";
import { useDocsLayout } from "fumadocs-ui/layouts/docs";

/**
 * Fumadocs 16.17.10 `Container` sets inline `gridTemplate` on `#nd-docs-layout`,
 * which beats the phone restack in `docs-shell-tokens.css`. Own the variables
 * here; the stylesheet owns both breakpoint templates.
 */
export function DocsContainer({ className, style, ...props }: ComponentProps<"div">) {
  const { slots } = useDocsLayout();
  const { collapsed } = slots.sidebar.useSidebar();
  const layoutVars = {
    "--fd-docs-row-1": "var(--fd-banner-height, 0px)",
    "--fd-docs-row-2": "calc(var(--fd-docs-row-1) + var(--fd-header-height))",
    "--fd-docs-row-3": "calc(var(--fd-docs-row-2) + var(--fd-toc-popover-height))",
    "--fd-sidebar-col": collapsed ? "0px" : "var(--fd-sidebar-width)",
  } as CSSProperties;
  return (
    <div
      id="nd-docs-layout"
      data-sidebar-collapsed={collapsed}
      {...props}
      style={{ ...layoutVars, ...style }}
      className={cn(
        "grid overflow-x-clip min-h-(--fd-docs-height) [--fd-docs-height:100dvh] [--fd-header-height:0px] [--fd-toc-popover-height:0px] [--fd-sidebar-width:0px] [--fd-toc-width:0px] transition-[--fd-sidebar-col]",
        className,
      )}
    />
  );
}
