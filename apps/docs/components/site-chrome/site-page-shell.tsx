import type { ReactNode } from "react";
import { SiteMaintainerFooter } from "@/components/site-chrome/site-footer";

/** Wraps page content so the maintainer footer sits at the bottom of the viewport. */
export function SitePageShell({
  children,
}: {
  children: ReactNode;
}) {
  // Inside fumadocs HomeLayout <main>. id is the skip-link / hash target
  // (SSR, no JS); tabIndex -1 lets it take focus without being a tab stop.
  return (
    <div data-page-shell="" id="main-content" tabIndex={-1} className="flex flex-col">
      <div className="flex-1">{children}</div>
      <SiteMaintainerFooter embeddedInMain />
    </div>
  );
}
