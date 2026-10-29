"use client";

import dynamic from "next/dynamic";
import { Card, Stack } from "@zedtech/zedkit-ui";
import { HOME_HERO_PREVIEW_SHELL_CLASS } from "@/ui/home/home-rhythm";

const HomeAdminScene = dynamic(
  () => import("@/ui/home/home-admin-scene").then((mod) => mod.HomeAdminScene),
  {
    loading: () => <Stack className="min-h-48 flex-1" aria-hidden="true" />,
  },
);

/**
 * Hero visual: live kit components in the page identity. Decorative only.
 */
export function HomeHeroPreview() {
  return (
    <Stack aria-hidden="true" className={HOME_HERO_PREVIEW_SHELL_CLASS} data-home-hero-preview>
      <Card className="h-full select-none">
        <Stack className="h-full justify-between p-card-padding">
          <HomeAdminScene />
        </Stack>
      </Card>
    </Stack>
  );
}
