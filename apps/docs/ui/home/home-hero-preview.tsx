"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { Palette } from "lucide-react";
import { Button, Card, Stack, Text, cn, identities } from "@zedtech/zedkit-ui";
import { DEFAULT_IDENTITY } from "@/lib/default-identity";
import { HOME_HERO_PREVIEW_SHELL_CLASS } from "@/ui/home/home-rhythm";

const HomeAdminDashboardDemo = dynamic(
  () => import("@/components/demos/home-admin-dashboard-demo").then((mod) => mod.HomeAdminDashboardDemo),
  { loading: () => <Stack className="min-h-48 flex-1" aria-hidden="true" /> },
);

type HeroProofControlsProps = {
  look: string;
  dark: boolean;
  onLook: (look: string) => void;
  onDark: () => void;
};

function HeroProofControls({ look, dark, onLook, onDark }: HeroProofControlsProps) {
  const selectId = useId();
  return (
    <Stack direction="horizontal" gap={3} className="flex-wrap items-center justify-between">
      <Stack direction="horizontal" gap={3} className="flex-wrap items-center">
        <span className="inline-flex items-center gap-2">
          <Palette aria-hidden="true" className="size-4 text-muted-foreground" />
          <label htmlFor={selectId} className="text-sm text-muted-foreground">
            Try a look
          </label>
          <select
            id={selectId}
            value={look}
            onChange={(event) => onLook(event.target.value)}
            className="h-control-height-sm rounded-md border border-input bg-background px-3 text-control text-foreground focus-ring-control"
          >
            {identities.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </span>
        <Button type="button" variant="outline" size="sm" aria-pressed={dark} onClick={onDark}>
          Dark
        </Button>
      </Stack>
      <Link
        href="/docs/ui/theme-an-admin-app-dark-light-included"
        className="text-sm text-primary underline-offset-4 hover:underline"
      >
        See it dark
      </Link>
    </Stack>
  );
}

/**
 * Hero visual the visitor can use: the same local admin demo as below the fold,
 * restyled under a scoped identity + dark class, with the attribute line under the card.
 */
export function HomeHeroPreview() {
  const [look, setLook] = useState(DEFAULT_IDENTITY);
  const [dark, setDark] = useState(false);
  const darkScope = dark ? "dark" : undefined;

  useEffect(() => {
    setLook(document.documentElement.getAttribute("data-identity") ?? DEFAULT_IDENTITY);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  return (
    <Stack gap={3} id="demo" data-home-hero-proof className="max-w-full min-w-0 scroll-mt-24">
      <HeroProofControls look={look} dark={dark} onLook={setLook} onDark={() => setDark(!dark)} />
      <Stack className={cn(darkScope, HOME_HERO_PREVIEW_SHELL_CLASS)} data-home-hero-preview>
        <div
          data-identity-scope=""
          data-identity={look}
          className="flex h-full min-h-0 flex-col bg-background font-sans text-foreground"
        >
          <Card className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border shadow-sm">
            <Stack className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
              <HomeAdminDashboardDemo label="Interactive admin dashboard demo in the hero" />
            </Stack>
          </Card>
        </div>
      </Stack>
      <Text variant="muted" className="font-mono text-xs">
        {dark ? `<div class="dark"><div data-identity="${look}">` : `<div data-identity="${look}">`}
      </Text>
    </Stack>
  );
}
