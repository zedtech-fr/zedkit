import type { ReactNode } from "react";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { siteHeaderLinks } from "@/lib/site-header-links";
import { KitVersionLabel } from "@/ui/kit-version-label";
import { SitePageShell } from "@/ui/site-page-shell";

/** Shared marketing shell: nav, search, theme toggle, GitHub link. */
export function SiteLayout({
  children,
  version,
  changelogHref,
}: {
  children: ReactNode;
  version: string;
  changelogHref: string;
}) {
  return (
    <HomeLayout
      nav={{
        title: "zedkit",
        url: "/",
        // Version sits beside the title link — not inside it (avoids nested <a> / hydration #418).
        children: <KitVersionLabel version={version} changelogHref={changelogHref} />,
      }}
      githubUrl="https://github.com/zedtech-fr/zedkit"
      links={siteHeaderLinks(changelogHref)}
      searchToggle={{ enabled: true }}
      themeSwitch={{ enabled: true }}
    >
      <SitePageShell changelogHref={changelogHref}>{children}</SitePageShell>
    </HomeLayout>
  );
}
