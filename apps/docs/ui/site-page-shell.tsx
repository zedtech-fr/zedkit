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
  // Inside fumadocs HomeLayout <main>. id is the skip-link / hash target
  // (SSR, no JS); tabIndex -1 lets it take focus without being a tab stop.
  return (
    <div data-page-shell="" id="main-content" tabIndex={-1} className="flex flex-col">
      <div className="flex-1">{children}</div>
      <SiteMaintainerFooter changelogHref={changelogHref} embeddedInMain />
    </div>
  );
}
