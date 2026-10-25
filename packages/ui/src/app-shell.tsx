import type * as React from "react";

import { cn } from "./utils.js";

export interface AppShellProps {
  sidebar: React.ReactNode;
  topbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AppShell({ sidebar, topbar, children, className }: AppShellProps) {
  return (
    <div className={cn("flex min-h-svh w-full", className)}>
      <aside className="hidden w-64 shrink-0 border-r bg-muted/40 md:block">{sidebar}</aside>
      <div className="flex min-w-0 flex-1 flex-col">
        {topbar ? (
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">{topbar}</header>
        ) : null}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
