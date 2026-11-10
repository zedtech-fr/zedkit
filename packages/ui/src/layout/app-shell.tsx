/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- overflow scrollports are focusable per scrollable-region-focusable (#396). */
import type * as React from "react";

import { cn } from "../utils.js";
import { AppShellDrawer, AppShellMenuTrigger } from "./app-shell-drawer.js";

export interface AppShellProps {
  sidebar: React.ReactNode;
  topbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /**
   * Control that opens the sidebar as a drawer below `md`.
   * Omit for the built-in menu button; pass `null` to keep the sidebar hidden on small screens.
   * A custom trigger must be a focusable button or link with an accessible name.
   */
  sidebarTrigger?: React.ReactElement | null;
  /** Viewport-tall shell: sidebar and main scroll independently. */
  fixedHeight?: boolean;
  /**
   * Ref to the scrolling `<main>` (stick-to-bottom, `useScrollReset`).
   * Requires a client parent; AppShell itself stays a server module.
   */
  mainRef?: React.Ref<HTMLElement>;
}

export function AppShell({
  sidebar,
  topbar,
  children,
  className,
  sidebarTrigger,
  fixedHeight,
  mainRef,
}: AppShellProps) {
  const showDrawer = sidebarTrigger !== null;
  const column = (
    <div className="flex pane-shrink content-shrink flex-1 flex-col">
      {showDrawer ? (
        <div data-slot="app-shell-menu" className="flex items-center p-app-shell-padding md:hidden">
          <AppShellMenuTrigger trigger={sidebarTrigger ?? undefined} />
        </div>
      ) : null}
      {topbar ? (
        <header className="sticky pin-top z-header border-b bar-scrim backdrop-blur">{topbar}</header>
      ) : null}
      <main
        ref={mainRef}
        tabIndex={0}
        className="pane-shrink flex-1 overflow-y-auto p-app-shell-padding md:p-app-shell-padding-md focus-ring"
      >
        {children}
      </main>
    </div>
  );

  return (
    <div
      data-slot="app-shell"
      className={cn("flex w-full", fixedHeight ? "h-svh overflow-hidden" : "min-h-svh", className)}
    >
      <aside
        tabIndex={fixedHeight ? 0 : undefined}
        className={cn(
          "flex w-app-shell-sidebar shrink-0 flex-col border-r muted-wash max-md:hidden",
          fixedHeight && "pane-shrink overflow-y-auto focus-ring",
        )}
      >
        {sidebar}
      </aside>
      {showDrawer ? <AppShellDrawer sidebar={sidebar}>{column}</AppShellDrawer> : column}
    </div>
  );
}
