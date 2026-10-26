import type { ReactNode } from "react";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { siteHeaderLinks } from "@/lib/site-header-links";
import { SiteBrand } from "@/ui/site-brand";
import { SiteHeader } from "@/ui/site-headers";
import { SitePageShell } from "@/ui/site-page-shell";
import { siteChromeSlots } from "@/ui/site-chrome";

/** Shared marketing shell: nav, search, theme toggle, GitHub link. */
export function SiteLayout({
  children,
  changelogHref,
}: {
  children: ReactNode;
  changelogHref: string;
}) {
  return (
    <HomeLayout
      slots={{ header: SiteHeader }}
      nav={{
        title: <SiteBrand />,
        url: "/",
      }}
      githubUrl="https://github.com/zedtech-fr/zedkit"
      links={siteHeaderLinks(changelogHref)}
      searchToggle={{ enabled: true }}
      themeSwitch={{ enabled: true }}
      slots={siteChromeSlots}
    >
      <SitePageShell changelogHref={changelogHref}>{children}</SitePageShell>
    </HomeLayout>
  );
}
