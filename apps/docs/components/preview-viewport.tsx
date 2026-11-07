"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useId, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Stack, Tabs, TabsContent, TabsList, TabsTrigger, ThemeScope, cn } from "@zedtech/zedkit-ui";
import { DemoStyleSelect, usePinnedLook } from "@/components/demo-style-scope";
import { previewViewportCopy } from "@/components/i18n/preview-viewport-copy";

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

type ModePin = "follow" | "light" | "dark";

function Segmented({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <Stack
      direction="horizontal"
      role="group"
      aria-label={label}
      className={cn("inline-flex items-center gap-segment", className)}
    >
      {children}
    </Stack>
  );
}

function Segment({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className="min-h-target rounded px-2.5 text-sm text-muted-foreground focus-ring-control transition-colors hover:text-foreground aria-pressed:bg-muted aria-pressed:font-medium aria-pressed:text-foreground md:min-h-segment"
    >
      {children}
    </button>
  );
}

/**
 * One example frame: Preview/Code tabs and a quiet Display row sit above a
 * single hairline frame. Identity and mode live on the stage (the nearest
 * ThemeScope, `.dark` on that node is the mode authority); the tabs and the
 * frame use the site's own tokens, so they never compete with the specimen.
 */
export function PreviewFrame({
  center,
  pinned,
  codePanel,
  children,
}: {
  center?: boolean;
  /** Sticky/scroll-driven demos: no scroll container or hidden overflow may sit above them. */
  pinned?: boolean;
  codePanel: ReactNode;
  children: ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const [tab, setTab] = useState<string>(previewViewportCopy.tabs.preview);
  const [modePin, setModePin] = useState<ModePin>("follow");
  const [mobile, setMobile] = useState(false);
  const [displayOpen, setDisplayOpen] = useState(false);
  const displayId = useId();
  const demoStyle = usePinnedLook();
  const siteDark = mounted && resolvedTheme === "dark";
  const dark = modePin === "follow" ? siteDark : modePin === "dark";

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex w-full content-shrink flex-col gap-stack-sm">
      <Stack direction="horizontal" className="flex-wrap justify-between gap-x-stack-lg gap-y-stack-sm">
        <TabsList className="h-auto! gap-stack-tight rounded-none bg-transparent flush">
          {([previewViewportCopy.tabs.preview, previewViewportCopy.tabs.code] as const).map((value) => (
            <TabsTrigger
              key={value}
              value={value}
              className="h-control-height rounded-md px-tabs-trigger-inline text-sm text-muted-foreground capitalize data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              {value}
            </TabsTrigger>
          ))}
        </TabsList>
        {tab === previewViewportCopy.tabs.preview ? (
          <>
            <button
              type="button"
              aria-expanded={displayOpen}
              aria-controls={displayId}
              onClick={() => setDisplayOpen(!displayOpen)}
              className="min-h-target rounded px-2.5 text-sm text-muted-foreground focus-ring-control transition-colors hover:text-foreground aria-expanded:text-foreground md:hidden"
            >
              {previewViewportCopy.display}
            </button>
            <Stack
              direction="horizontal"
              id={displayId}
              data-preview-display=""
              // Phone: a full-width row opened by the Display toggle. From md up the toggle is gone and the row
              // always sits beside the tabs, whatever the toggle said on the way here.
              className={cn("content-shrink flex-wrap gap-stack-sm md:flex md:w-auto", displayOpen ? "w-full" : "hidden")}
            >
              <DemoStyleSelect look={demoStyle.look} pinned={demoStyle.pinned} onPin={demoStyle.pin} labelHidden />
              <Segmented label={previewViewportCopy.width} className="hidden md:inline-flex">
                <Segment pressed={!mobile} onClick={() => setMobile(false)}>
                  {previewViewportCopy.full}
                </Segment>
                <Segment pressed={mobile} onClick={() => setMobile(true)}>
                  {previewViewportCopy.mobile}
                </Segment>
              </Segmented>
              <Segmented label={previewViewportCopy.mode}>
                <Segment pressed={modePin === "follow"} onClick={() => setModePin("follow")}>
                  {previewViewportCopy.site}
                </Segment>
                <Segment pressed={modePin === "light"} onClick={() => setModePin("light")}>
                  {previewViewportCopy.light}
                </Segment>
                <Segment pressed={modePin === "dark"} onClick={() => setModePin("dark")}>
                  {previewViewportCopy.dark}
                </Segment>
              </Segmented>
            </Stack>
          </>
        ) : null}
      </Stack>
      <Stack
        data-preview-frame=""
        className={cn("content-shrink rounded-lg border border-border", pinned ? "overflow-clip" : "overflow-hidden")}
      >
        <TabsContent value="preview" className="trim-top">
          <ThemeScope
            data-preview-surface=""
            identity={demoStyle.look}
            mode={dark ? "dark" : "light"}
            className={cn(
              // not-prose is a fumadocs escape hatch, not a Tailwind utility.
              // eslint-disable-next-line better-tailwindcss/no-unknown-classes
              "not-prose w-full content-shrink bg-background surface-pad-md md:surface-pad-lg",
              !pinned && "overflow-x-auto",
              mobile && "mx-auto max-w-[390px]",
            )}
          >
            <PreviewMobileContext.Provider value={mobile}>
              {center ? <Stack className="mx-auto w-fit max-w-full">{children}</Stack> : children}
            </PreviewMobileContext.Provider>
          </ThemeScope>
        </TabsContent>
        <TabsContent value="code" className="trim-top">
          <Stack data-preview-code-panel="" className="content-shrink">
            {codePanel}
          </Stack>
        </TabsContent>
      </Stack>
    </Tabs>
  );
}
