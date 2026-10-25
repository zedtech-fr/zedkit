import type { ReactNode } from "react";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { KitVersionLabel } from "@/ui/kit-version-label";

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
      links={[{ text: "Documentation", url: "/docs" }]}
      searchToggle={{ enabled: true }}
      themeSwitch={{ enabled: true }}
    >
      {children}
    </HomeLayout>
  );
}
