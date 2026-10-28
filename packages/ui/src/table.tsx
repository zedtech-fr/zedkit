/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- Table scroll container is focusable per scrollable-region-focusable (#396). */
// Derived from shadcn/ui (table) — see Provenance in packages/ui/README.md. Tolerated exception: migrated to custom code only when customization needs it.
//
// Allowed arbitraries: structural selectors only ([&_tr], :last-child,
// data-[state=selected], :has([role=checkbox])). They carry no values,
// so no theme token can replace them. All sizes/paddings use tokens.
"use client";

import * as React from "react";

import { cn } from "./utils.js";
import { useUiMessages } from "./ui-provider.js";

export interface TableProps extends React.ComponentProps<"table"> {
  /** Accessible name for the horizontal scroll region (axe scrollable-region-focusable). */
  scrollAriaLabel?: string;
}

/** Edge hidden by more than this overhang counts as cut off (faded). */
const EDGE_CUT_PX = 0.5;

function Table({ className, scrollAriaLabel, children, ...props }: TableProps) {
  const messages = useUiMessages();
  const regionRef = React.useRef<HTMLDivElement>(null);
  const [edges, setEdges] = React.useState({ left: false, right: false });

  // Scroll hints: compare the first row's edge cells against the scroll
  // region. A cut edge fades (see the data-edge selectors in styles.css);
  // fitted tables stay crisp. Edge-based, so cells wider than the viewport
  // still resolve correctly.
  React.useEffect(() => {
    const region = regionRef.current;
    if (!region) return;
    const update = () => {
      const firstRow = region.querySelector("table tr");
      const firstCell = firstRow?.querySelector(":scope > *:first-child") ?? null;
      const lastCell = firstRow?.querySelector(":scope > *:last-child") ?? null;
      if (!firstCell || !lastCell) return;
      const box = region.getBoundingClientRect();
      const first = firstCell.getBoundingClientRect();
      const last = lastCell.getBoundingClientRect();
      const next = {
        left: first.left < box.left - EDGE_CUT_PX,
        right: last.right > box.right + EDGE_CUT_PX,
      };
      setEdges((previous) => (next.left === previous.left && next.right === previous.right ? previous : next));
    };
    update();
    region.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    // Layout-driven width changes (a sidebar toggling) do not fire window resize.
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    resizeObserver?.observe(region);
    return () => {
      region.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      resizeObserver?.disconnect();
    };
  }, [children]);

  return (
    <div
      role="region"
      ref={regionRef}
      data-slot="table-container"
      data-edge-left={edges.left || undefined}
      data-edge-right={edges.right || undefined}
      className="relative w-full overflow-x-auto"
      tabIndex={0}
      aria-label={scrollAriaLabel ?? messages.scrollableTable}
    >
      <table data-slot="table" className={cn("w-full caption-bottom text-sm", className)} {...props}>
        {children}
      </table>
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={cn("[&_tr]:border-b", className)} {...props} />;
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-table-head-height px-table-cell text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-table-checkbox-nudge",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn("p-table-cell align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-table-checkbox-nudge", className)}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return <caption data-slot="table-caption" className={cn("mt-table-caption-gap text-sm text-muted-foreground", className)} {...props} />;
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
