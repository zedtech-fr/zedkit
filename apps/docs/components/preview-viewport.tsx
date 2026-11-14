"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useId, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Button, Stack, Tabs, TabsContent, TabsList, TabsTrigger, ThemeScope, cn } from "@zedtech/zedkit-ui";
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
    <Button
      type="button"
      variant="ghost"
      aria-pressed={pressed}
      onClick={onClick}
      data-preview-segment=""
      className="h-auto min-h-target rounded flush text-dense font-normal text-muted-foreground focus-ring-control transition-colors hover:bg-transparent hover:text-foreground aria-pressed:bg-muted aria-pressed:font-medium aria-pressed:text-foreground md:min-h-segment"
    >
      {children}
    </Button>
  );
}

function PreviewTabsList() {
  return (
    <TabsList className="h-auto! gap-stack-tight rounded-none bg-transparent flush">
      {([previewViewportCopy.tabs.preview, previewViewportCopy.tabs.code] as const).map((value) => (
        <TabsTrigger
          key={value}
          value={value}
          className="h-control-height rounded-md px-tabs-trigger-inline text-dense text-muted-foreground capitalize data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none"
        >
          {value}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}

function QuietPreviewToolbar({
  tab,
  look,
  pinned,
  onPin,
  dark,
  onDark,
}: {
  tab: string;
  look: string;
  pinned: boolean;
  onPin: (id: string | null) => void;
  dark: boolean;
  onDark: () => void;
}) {
  return (
    <Stack
      direction="horizontal"
      data-preview-display=""
      className="flex-wrap items-center justify-between gap-x-stack-sm gap-y-stack-sm border-b border-border px-control-tight py-control-block"
    >
      <PreviewTabsList />
      {tab === previewViewportCopy.tabs.preview ? (
        <Stack direction="horizontal" className="flex-wrap items-center gap-stack-sm">
          <DemoStyleSelect look={look} pinned={pinned} onPin={onPin} fieldLabel={previewViewportCopy.look} />
          <Button
            type="button"
            variant="outline"
            aria-pressed={dark}
            onClick={onDark}
            data-preview-segment=""
            className="min-h-target rounded-md px-tabs-trigger-inline text-dense font-normal"
          >
            {previewViewportCopy.dark}
          </Button>
        </Stack>
      ) : null}
    </Stack>
  );
}

/**
 * One example frame: Preview/Code tabs and a quiet Display row sit above a
 * single hairline frame. Identity and mode live on the stage (the nearest
 * ThemeScope, `.dark` on that node is the mode authority); the tabs and the
 * frame use the site's own tokens, so they never compete with the specimen.
 * Primary component-page specimens (`quiet`) keep one in-card toolbar.
 */
export function PreviewFrame({
  center,
  pinned,
  quiet = false,
  codePanel,
  children,
}: {
  center?: boolean;
  /** Sticky/scroll-driven demos: no scroll container or hidden overflow may sit above them. */
  pinned?: boolean;
  /** Component-page primary: Preview/Code, Look, Dark inside the card. */
  quiet?: boolean;
  codePanel: ReactNode;
  children: ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const [tab, setTab] = useState<string>(previewViewportCopy.tabs.preview);
  const [modePin, setModePin] = useState<ModePin>(quiet ? "light" : "follow");
  const [mobile, setMobile] = useState(false);
  const [displayOpen, setDisplayOpen] = useState(false);
  const displayId = useId();
  const demoStyle = usePinnedLook();
  const siteDark = mounted && resolvedTheme === "dark";
  const dark = quiet ? modePin === "dark" : modePin === "follow" ? siteDark : modePin === "dark";

  const stage = (
    <>
      <TabsContent value="preview" className="trim-top" data-preview-stage="">
        <ThemeScope
          data-preview-surface=""
          {...(center ? { "data-preview-center": "" } : {})}
          data-frame={mobile ? "phone" : undefined}
          identity={demoStyle.look}
          mode={dark ? "dark" : "light"}
          className={cn(
            // not-prose is a fumadocs escape hatch, not a Tailwind utility.
            // eslint-disable-next-line better-tailwindcss/no-unknown-classes
            "not-prose w-full content-shrink bg-background surface-pad-md md:surface-pad-lg",
            !pinned && "overflow-x-auto",
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
    </>
  );

  const frameClass = cn("content-shrink rounded-lg border border-border", pinned ? "overflow-clip" : "overflow-hidden");

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex w-full content-shrink flex-col gap-stack-sm">
      {quiet ? (
        <Stack data-preview-frame="" className={frameClass}>
          <QuietPreviewToolbar
            tab={tab}
            look={demoStyle.look}
            pinned={demoStyle.pinned}
            onPin={demoStyle.pin}
            dark={dark}
            onDark={() => setModePin(modePin === "dark" ? "light" : "dark")}
          />
          {stage}
        </Stack>
      ) : (
        <>
          <Stack direction="horizontal" className="flex-wrap justify-between gap-x-stack-lg gap-y-stack-sm">
            <PreviewTabsList />
            {tab === previewViewportCopy.tabs.preview ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  aria-expanded={displayOpen}
                  aria-controls={displayId}
                  onClick={() => setDisplayOpen(!displayOpen)}
                  data-preview-segment=""
                  className="h-auto min-h-target rounded flush text-dense font-normal text-muted-foreground focus-ring-control transition-colors hover:bg-transparent hover:text-foreground aria-expanded:text-foreground md:hidden"
                >
                  {previewViewportCopy.display}
                </Button>
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
          <Stack data-preview-frame="" className={frameClass}>
            {stage}
          </Stack>
        </>
      )}
    </Tabs>
  );
}
