"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Button, Stack, Text, cn } from "@zedtech/zedkit-ui";
import { DemoStyleSelect, usePinnedLook } from "@/components/demo-style-scope";

const noop = () => () => {};

const PreviewMobileContext = createContext(false);

/**
 * True while the preview shows the Mobile frame. Media queries follow the real
 * window, so a demo whose layout changes at a breakpoint reads this to match
 * the narrow frame on a wide screen.
 */
export function usePreviewMobile(): boolean {
  return useContext(PreviewMobileContext);
}

/**
 * Preview island with viewport and theme switches. The `dark` class re-scopes
 * kit CSS variables for the preview subtree only.
 */
export function PreviewViewport({ center, children }: { center?: boolean; children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const [dark, setDark] = useState(false);
  const [mobile, setMobile] = useState(false);
  const demoStyle = usePinnedLook();

  useEffect(() => {
    if (mounted) setDark(resolvedTheme === "dark");
  }, [mounted, resolvedTheme]);

  const darkScope = dark ? "dark" : undefined;
  return (
    <Stack gap={3} data-component-preview className={darkScope}>
      <Stack direction="horizontal" gap={2} className="flex-wrap items-center justify-between">
        <Stack direction="horizontal" gap={3} className="flex-wrap items-center">
          <Text variant="muted" className="text-xs">Preview</Text>
          <DemoStyleSelect look={demoStyle.look} pinned={demoStyle.pinned} onPin={demoStyle.pin} />
        </Stack>
        <Stack direction="horizontal" gap={2} className="flex-wrap">
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
          mobile && "mx-auto w-full max-w-[390px]",
        )}
        {...demoStyle.scopeAttrs}
      >
        <PreviewMobileContext.Provider value={mobile}>
          {center ? <Stack className="mx-auto w-fit max-w-full">{children}</Stack> : children}
        </PreviewMobileContext.Provider>
      </Stack>
    </Stack>
  );
}
