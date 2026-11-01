"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Stack, Tabs, TabsContent, TabsList, TabsTrigger, ThemeScope, cn } from "@zedtech/zedkit-ui";
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

type ModePin = "follow" | "light" | "dark";

function Segmented({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex items-center rounded-md border border-input bg-background p-0.5"
    >
      {children}
    </div>
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
      className="min-h-11 rounded px-2.5 text-xs text-muted-foreground focus-ring-control transition-colors hover:text-foreground aria-pressed:bg-muted aria-pressed:text-foreground md:min-h-7"
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
  codePanel,
  children,
}: {
  center?: boolean;
  codePanel: ReactNode;
  children: ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const [tab, setTab] = useState("preview");
  const [modePin, setModePin] = useState<ModePin>("follow");
  const [mobile, setMobile] = useState(false);
  const demoStyle = usePinnedLook();
  const siteDark = mounted && resolvedTheme === "dark";
  const dark = modePin === "follow" ? siteDark : modePin === "dark";

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex w-full min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <TabsList className="h-auto gap-1 rounded-none bg-transparent p-0">
          {["preview", "code"].map((value) => (
            <TabsTrigger
              key={value}
              value={value}
              className="h-9 rounded-md px-3 text-sm text-muted-foreground capitalize data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              {value}
            </TabsTrigger>
          ))}
        </TabsList>
        {tab === "preview" ? (
          <div data-preview-display="" className="flex min-w-0 flex-wrap items-center gap-2">
            <DemoStyleSelect
              look={demoStyle.look}
              pinned={demoStyle.pinned}
              onPin={demoStyle.pin}
              labelHidden
            />
            <Segmented label="Width">
              <Segment pressed={!mobile} onClick={() => setMobile(false)}>
                Full
              </Segment>
              <Segment pressed={mobile} onClick={() => setMobile(true)}>
                Mobile
              </Segment>
            </Segmented>
            <Segmented label="Mode">
              <Segment pressed={modePin === "follow"} onClick={() => setModePin("follow")}>
                Site
              </Segment>
              <Segment pressed={modePin === "light"} onClick={() => setModePin("light")}>
                Light
              </Segment>
              <Segment pressed={modePin === "dark"} onClick={() => setModePin("dark")}>
                Dark
              </Segment>
            </Segmented>
          </div>
        ) : null}
      </div>
      <div data-preview-frame="" className="min-w-0 overflow-hidden rounded-lg border border-border">
        <TabsContent value="preview" className="mt-0">
          <ThemeScope
            data-preview-surface=""
            identity={demoStyle.look}
            mode={dark ? "dark" : "light"}
            className={cn(
              // not-prose is a fumadocs escape hatch, not a Tailwind utility.
              // eslint-disable-next-line better-tailwindcss/no-unknown-classes
              "not-prose w-full min-w-0 bg-background p-4 md:p-6",
              mobile && "mx-auto max-w-[390px]",
            )}
          >
            <PreviewMobileContext.Provider value={mobile}>
              {center ? <Stack className="mx-auto w-fit max-w-full">{children}</Stack> : children}
            </PreviewMobileContext.Provider>
          </ThemeScope>
        </TabsContent>
        <TabsContent value="code" className="mt-0">
          <div data-preview-code-panel="" className="min-w-0">
            {codePanel}
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}
