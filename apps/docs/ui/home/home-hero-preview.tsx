"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Card, Stack, cn } from "@zedtech/zedkit-ui";
import { HeroDemoStyleControl } from "@/components/hero-demo-style-control";
import { DEFAULT_IDENTITY } from "@/lib/default-identity";
import { HOME_HERO_PREVIEW_SHELL_CLASS } from "@/ui/home/home-rhythm";

const HomeAdminDashboardDemo = dynamic(
  () => import("@/components/demos/home-admin-dashboard-demo").then((mod) => mod.HomeAdminDashboardDemo),
  { loading: () => <Stack className="min-h-48 flex-1" aria-hidden="true" /> },
);

/** Reference hero specimen: manipulable admin demo with bounded identity + light/dark scope. */
export function HomeHeroPreview() {
  const [look, setLook] = useState(DEFAULT_IDENTITY);
  const [dark, setDark] = useState(false);
  const darkScope = dark ? "dark" : undefined;

  return (
    <Stack gap={3} id="demo" data-home-hero-proof className="max-w-full min-w-0 scroll-mt-24">
      <HeroDemoStyleControl look={look} dark={dark} onLook={setLook} onDark={setDark} />
      <Stack className={cn(darkScope, HOME_HERO_PREVIEW_SHELL_CLASS)} data-home-hero-preview>
        <div
          data-identity-scope=""
          data-identity={look}
          className="flex h-full min-h-0 flex-col bg-background font-sans text-foreground"
        >
          <Card
            data-home-dashboard-card
            className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border shadow-sm"
          >
            <Stack className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
              <HomeAdminDashboardDemo label="Interactive admin dashboard demo in the hero" />
            </Stack>
          </Card>
        </div>
      </Stack>
    </Stack>
  );
}
