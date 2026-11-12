import type { ReactNode } from "react";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { SiteBrand } from "@/ui/site-brand";
import { siteHeaderLinks } from "@/lib/site-header-links";
import { SitePageShell } from "@/ui/site-page-shell";
import { siteChromeSlots } from "@/ui/site-chrome-slots";
import { MarketingSiteHeader } from "@/ui/site-headers";

/** Shared marketing shell: nav, search, GitHub link. Theme and version live off this header. */
export function SiteLayout({ children }: { children: ReactNode }) {
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
      slots={{ ...siteChromeSlots, header: MarketingSiteHeader }}
    >
      <SitePageShell>{children}</SitePageShell>
    </HomeLayout>
  );
}
