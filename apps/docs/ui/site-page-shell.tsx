import type { ReactNode } from "react";
import { SiteMaintainerFooter } from "@/ui/site-footer";

/** Wraps page content so the maintainer footer sits at the bottom of the viewport. */
export function SitePageShell({
  children,
  changelogHref,
}: {
  children: ReactNode;
  changelogHref: string;
}) {
  // Rendered inside fumadocs HomeLayout's <main>: no top-level landmark.
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex-1">{children}</div>
      <SiteMaintainerFooter changelogHref={changelogHref} embeddedInMain />
    </div>
  );
}
