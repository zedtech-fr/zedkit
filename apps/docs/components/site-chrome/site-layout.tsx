import type { ReactNode } from "react";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { SiteBrand } from "@/components/site-chrome/site-brand";
import { siteHeaderLinks } from "@/lib/site-header-links";
import { SitePageShell } from "@/components/site-chrome/site-page-shell";
import { siteChromeSlots } from "@/components/site-chrome/site-chrome-slots";
import { MarketingSiteHeader } from "@/components/site-chrome/site-headers";

/** Shared marketing shell: nav, search, GitHub link. Theme and version live off this header. */
export function SiteLayout({
  children,
  header = MarketingSiteHeader,
}: {
  children: ReactNode;
  header?: typeof MarketingSiteHeader;
}) {
  return (
    <HomeLayout
      nav={{
        title: <SiteBrand />,
        url: "/",
      }}
      githubUrl="https://github.com/zedtech-fr/zedkit"
      links={siteHeaderLinks()}
      searchToggle={{ enabled: true }}
      themeSwitch={{ enabled: false }}
      slots={{ ...siteChromeSlots, header }}
    >
      <SitePageShell>{children}</SitePageShell>
    </HomeLayout>
  );
}
