"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useState, useSyncExternalStore } from "react";
import { Stack, ThemeScope, cn } from "@zedtech/zedkit-ui";
import { HeroDemoStyleControl } from "@/components/hero-demo-style-control";
import type { PreviewMode } from "@/components/admin-dashboard-demo-app";
import {
  resolveHeroDemoDark,
  type HeroDemoModePin,
} from "@/components/hero-demo-style-fields";
import { DEFAULT_IDENTITY } from "@/lib/default-identity";
import { HOME_HERO_PREVIEW_SHELL_CLASS } from "@/ui/home/home-rhythm";
import { HomeHeroCalendarScene, HomeHeroDrawerScene } from "@/ui/home/home-hero-scene-visuals";
import { homeCopy } from "@/ui/home/i18n/home-copy";

const HomeAdminDashboardDemo = dynamic(
  () => import("@/components/demos/home-admin-dashboard-demo").then((mod) => mod.HomeAdminDashboardDemo),
  { loading: () => <Stack className="min-h-32 flex-1" aria-hidden="true" /> },
);

const noop = () => () => {};

/** Hero specimen: one frame, three examples that the page scroll crossfades. */
export function HomeHeroPreview() {
  const [look, setLook] = useState(DEFAULT_IDENTITY);
  const [modePin, setModePin] = useState<HeroDemoModePin>("follow");
  const [preview, setPreview] = useState<PreviewMode>("ready");
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const siteDark = mounted && resolvedTheme === "dark";
  const dark = resolveHeroDemoDark(modePin, siteDark);

  return (
    <Stack
      id="demo"
      data-home-hero-proof
      data-home-hero-preview
      data-home-dashboard-card
      data-home-specimen-stage=""
      className={cn(
        HOME_HERO_PREVIEW_SHELL_CLASS,
        "max-w-full min-w-0 scroll-mt-24 rounded-xl border border-border bg-card",
      )}
    >
      <Stack className="border-b border-border px-3 py-2.5 sm:px-4" data-home-specimen-toolbar="">
        <HeroDemoStyleControl
          look={look}
          modePin={modePin}
          preview={preview}
          onLook={setLook}
          onModePin={setModePin}
          onPreview={(value) => setPreview(value as PreviewMode)}
        />
      </Stack>
      <ThemeScope
        identity={look}
        mode={dark ? "dark" : "light"}
        className="flex min-h-0 min-w-0 flex-col bg-background"
      >
        <div data-home-hero-visuals="">
          <article data-scroll-scene="admin">
            <div data-scroll-scene-visual="">
              <HomeAdminDashboardDemo
                label={homeCopy.heroPreview.demoLabel}
                preview={preview}
                onPreviewChange={setPreview}
                variant="home"
              />
            </div>
          </article>
          <article data-scroll-scene="drawer" aria-hidden="true" inert>
            <div data-scroll-scene-visual="">
              <HomeHeroDrawerScene />
            </div>
          </article>
          <article data-scroll-scene="calendar" aria-hidden="true" inert>
            <div data-scroll-scene-visual="">
              <HomeHeroCalendarScene />
            </div>
          </article>
        </div>
      </ThemeScope>
    </Stack>
  );
}
