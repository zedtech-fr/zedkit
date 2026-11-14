import type * as React from "react";

import { cn } from "../utils.js";

export interface PersistentShellProps extends React.ComponentProps<"div"> {
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  dock?: React.ReactNode;
}

/**
 * Slot host for chrome that must keep its nodes when page content swaps.
 * Put it in a layout ancestor. It does not implement drawers, breakpoints,
 * or landmarks — callers own those.
 */
function PersistentShell({
  header,
  sidebar,
  dock,
  children,
  className,
  ...props
}: PersistentShellProps) {
  return (
    <div data-slot="persistent-shell" className={cn(className)} {...props}>
      {header}
      {sidebar}
      {dock}
      {children}
    </div>
  );
}

export { PersistentShell };
