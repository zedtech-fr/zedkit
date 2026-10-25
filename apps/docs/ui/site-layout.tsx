import type { ReactNode } from "react";
import { HomeLayout } from "fumadocs-ui/layouts/home";

/** Shared marketing shell: nav, search, theme toggle, GitHub link. */
export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <HomeLayout
      nav={{ title: "zedkit", url: "/" }}
      githubUrl="https://github.com/zedtech-fr/zedkit"
      links={[{ text: "Documentation", url: "/docs" }]}
      searchToggle={{ enabled: true }}
      themeSwitch={{ enabled: true }}
    >
      {children}
    </HomeLayout>
  );
}
