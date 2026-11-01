"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Stack, cn } from "@zedtech/zedkit-ui";
import { HeroDemoStyleControl } from "@/components/hero-demo-style-control";
import type { PreviewMode } from "@/components/admin-dashboard-demo-app";
import { DEFAULT_IDENTITY } from "@/lib/default-identity";
import { HOME_HERO_PREVIEW_SHELL_CLASS } from "@/ui/home/home-rhythm";

const HomeAdminDashboardDemo = dynamic(
  () => import("@/components/demos/home-admin-dashboard-demo").then((mod) => mod.HomeAdminDashboardDemo),
  { loading: () => <Stack className="min-h-32 flex-1" aria-hidden="true" /> },
);

/** Reference hero specimen: manipulable admin demo with bounded identity + light/dark scope. */
export function HomeHeroPreview() {
  const [look, setLook] = useState(DEFAULT_IDENTITY);
  const [dark, setDark] = useState(false);
  const [preview, setPreview] = useState<PreviewMode>("ready");
  const darkScope = dark ? "dark" : undefined;

  return (
    <Stack
      id="demo"
      data-home-hero-proof
      data-home-hero-preview
      data-home-dashboard-card
      data-home-specimen-stage=""
      className={cn(
        darkScope,
        HOME_HERO_PREVIEW_SHELL_CLASS,
        "max-w-full min-w-0 scroll-mt-24 rounded-xl border border-border bg-card",
      )}
    >
      <Stack className="border-b border-border px-3 py-2.5 sm:px-4" data-home-specimen-toolbar="">
        <HeroDemoStyleControl
          look={look}
          dark={dark}
          preview={preview}
          onLook={setLook}
          onDark={setDark}
          onPreview={(value) => setPreview(value as PreviewMode)}
        />
      </Stack>
      <div
        data-identity-scope=""
        data-identity={look}
        className="flex min-h-0 min-w-0 flex-col bg-background font-sans text-foreground"
      >
        <Stack className="min-w-0">
          <HomeAdminDashboardDemo
            label="Interactive admin dashboard demo in the hero"
            preview={preview}
            onPreviewChange={setPreview}
            variant="home"
          />
        </Stack>
      </div>
    </Stack>
  );
}
