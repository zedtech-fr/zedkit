"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { Palette } from "lucide-react";
import { Button, Card, Stack, Text, cn, identities } from "@zedtech/zedkit-ui";
import { DEFAULT_IDENTITY } from "@/lib/default-identity";
import { HOME_HERO_PREVIEW_SHELL_CLASS } from "@/ui/home/home-rhythm";

const HomeAdminScene = dynamic(
  () => import("@/ui/home/home-admin-scene").then((mod) => mod.HomeAdminScene),
  {
    loading: () => <Stack className="min-h-48 flex-1" aria-hidden="true" />,
  },
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
 * Hero visual the visitor can touch: the admin scene restyles in place
 * under a scoped identity + dark class (the same two attributes the
 * identity pages document), and the line under the card shows the
 * attribute that just changed. The scene itself stays decorative.
 */
export function HomeHeroPreview() {
  const [look, setLook] = useState(DEFAULT_IDENTITY);
  const [dark, setDark] = useState(false);
  const darkScope = dark ? "dark" : undefined;

  // Start from whatever the site already shows, so the card never
  // contradicts the header switcher on load; after that it is local.
  useEffect(() => {
    setLook(document.documentElement.getAttribute("data-identity") ?? DEFAULT_IDENTITY);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  return (
    <Stack gap={3} data-home-hero-proof>
      <HeroProofControls look={look} dark={dark} onLook={setLook} onDark={() => setDark(!dark)} />
      {/* Scoped dark needs `dark` on an ancestor of the identity scope. */}
      <Stack className={cn(darkScope, HOME_HERO_PREVIEW_SHELL_CLASS)} data-home-hero-preview>
        <div data-identity-scope="" data-identity={look} className="h-full bg-background font-sans text-foreground">
          <Card className="h-full select-none">
            <Stack aria-hidden="true" className="pointer-events-none h-full justify-between p-card-padding">
              <HomeAdminScene />
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
