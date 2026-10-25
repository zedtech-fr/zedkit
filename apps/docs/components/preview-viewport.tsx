"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Button, Stack, cn } from "@zedtech/zedkit-ui";

/**
 * Preview island with a per-demo light/dark switch. The `dark` class
 * re-scopes the kit CSS variables for the preview subtree only.
 */
export function PreviewViewport({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  return (
    <Stack gap={2}>
      <Stack direction="horizontal" gap={2} className="justify-end">
        <Button
          variant={dark ? "outline" : "secondary"}
          size="sm"
          onClick={() => setDark(false)}
          aria-pressed={!dark}
        >
          Light
        </Button>
        <Button
          variant={dark ? "secondary" : "outline"}
          size="sm"
          onClick={() => setDark(true)}
          aria-pressed={dark}
        >
          Dark
        </Button>
      </Stack>
      {/* eslint-disable-next-line better-tailwindcss/no-unknown-classes -- "dark" is the next-themes scope class, not a utility */}
      <Stack className={cn("rounded-lg border border-border bg-card p-4", dark && "dark")}>
        {children}
      </Stack>
    </Stack>
  );
}
