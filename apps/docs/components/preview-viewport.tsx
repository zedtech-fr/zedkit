"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Button, Stack, cn } from "@zedtech/zedkit-ui";

/**
 * Preview island with per-demo light/dark and full/mobile switches. The
 * `dark` class re-scopes the kit CSS variables for the preview subtree
 * only; narrow content centers, wide content fills.
 */
export function PreviewViewport({ center, children }: { center?: boolean; children: ReactNode }) {
  const [dark, setDark] = useState(false);
  const [mobile, setMobile] = useState(false);
  // "dark" is the next-themes scope class, not a utility.
  const darkScope = dark ? "dark" : undefined;
  return (
    <Stack gap={2}>
      <Stack direction="horizontal" gap={2} className="justify-between">
        <Stack direction="horizontal" gap={2}>
          <Button
            variant={mobile ? "outline" : "secondary"}
            size="sm"
            onClick={() => setMobile(false)}
            aria-pressed={!mobile}
          >
            Full
          </Button>
          <Button
            variant={mobile ? "secondary" : "outline"}
            size="sm"
            onClick={() => setMobile(true)}
            aria-pressed={mobile}
          >
            Mobile
          </Button>
        </Stack>
        <Stack direction="horizontal" gap={2}>
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
      </Stack>
      <Stack
        className={cn(
          "rounded-lg border border-border bg-muted/40 p-4",
          darkScope,
          mobile && "mx-auto w-full max-w-[390px]",
        )}
      >
        {center ? <Stack className="mx-auto w-fit max-w-full">{children}</Stack> : children}
      </Stack>
    </Stack>
  );
}
