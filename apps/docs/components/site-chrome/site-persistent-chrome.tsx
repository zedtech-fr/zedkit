"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { PersistentShell } from "@zedtech/zedkit-ui";
import { HomeGetStartedAction, HomeGitHubLink } from "@/components/site-chrome/header-actions";
import { MobileHeader } from "@/components/site-chrome/mobile-header";
import { SiteFullSearchTrigger, SiteSearchTrigger } from "@/components/site-chrome/site-chrome";
import { MarketingDesktopNav } from "@/components/site-chrome/site-headers";
import { siteDesktopHeaderKind } from "@/lib/site-nav-data";

/**
 * Site chrome that must keep its nodes across client navigations.
 * Persistence is the root layout ancestor; this host only picks slots.
 * Identity dock stays on Provider. Docs sidebar stays on DocsLayout.
 */
export function SitePersistentChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const desktop = siteDesktopHeaderKind(pathname);
  const showPhone = desktop === "home" || desktop === "catalog";
  const showDesktop = desktop !== "none";

  return (
    <PersistentShell
      header={
        showDesktop || showPhone ? (
          <>
            {showPhone ? <MobileHeader /> : null}
            {showDesktop ? (
              <MarketingDesktopNav
                mark={desktop}
                actions={
                  desktop === "home" ? (
                    <>
                      <HomeGitHubLink />
                      <HomeGetStartedAction />
                    </>
                  ) : (
                    <>
                      <SiteSearchTrigger className="lg:hidden" />
                      <SiteFullSearchTrigger className="max-lg:hidden" />
                      <HomeGitHubLink />
                    </>
                  )
                }
              />
            ) : null}
          </>
        ) : undefined
      }
    >
      {children}
    </PersistentShell>
  );
}
