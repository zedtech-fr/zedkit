import type { ReactNode } from "react";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { SiteBrand } from "@/components/site-chrome/site-brand";
import { siteHeaderLinks } from "@/lib/site-header-links";
import { SitePageShell } from "@/components/site-chrome/site-page-shell";
import { siteChromeSlots } from "@/components/site-chrome/site-chrome-slots";

/** Shared marketing page grid and footer. Desktop site header lives on the root persistent host. */
export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <HomeLayout
      nav={{
        enabled: false,
        title: <SiteBrand />,
        url: "/",
      }}
      githubUrl="https://github.com/zedtech-fr/zedkit"
      links={siteHeaderLinks()}
      searchToggle={{ enabled: true }}
      themeSwitch={{ enabled: false }}
      slots={siteChromeSlots}
    >
      <SitePageShell>{children}</SitePageShell>
    </HomeLayout>
  );
}
