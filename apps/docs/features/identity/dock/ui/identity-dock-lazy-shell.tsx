"use client";

import { IdentityDockWidget } from "@/features/identity/dock/ui/identity-dock-widget";

/** Loaded with the dock chunk so the home first-load bundle stays under budget. */
export function IdentityDockLazyShell() {
  return <IdentityDockWidget />;
}
