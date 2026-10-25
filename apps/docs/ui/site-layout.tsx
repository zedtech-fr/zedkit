import type { ReactNode } from "react";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { Stack, Text } from "@zedtech/zedkit-ui";
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
        title: (
          <Stack direction="horizontal" gap={2} className="flex-wrap items-center">
            <Text as="span" className="font-semibold">zedkit</Text>
            <KitVersionLabel version={version} changelogHref={changelogHref} />
          </Stack>
        ),
        url: "/",
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
