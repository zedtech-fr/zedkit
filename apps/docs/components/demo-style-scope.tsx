"use client";

import { useId, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { identities, Stack, ThemeScope, useIdentity } from "@zedtech/zedkit-ui";

import { DEFAULT_IDENTITY } from "@/lib/default-identity";

type ScopeAttrs = { "data-identity-scope": ""; "data-identity": string };

/**
 * Demo look, separate from the site identity on `<html>`.
 * The preview inherits the page until someone picks a style.
 * A pick sets `data-identity-scope` on this demo only.
 * State stays in the component: a shared hook was memoized on the site
 * identity and ignored later picks. The home hero can use `DemoStyleScope`.
 */
function usePinnedLook() {
  const site = useIdentity(DEFAULT_IDENTITY);
  const [pinned, setPinned] = useState<string | null>(null);
  const look = pinned ?? site;
  const scopeAttrs: ScopeAttrs | Record<string, never> = pinned
    ? { "data-identity-scope": "", "data-identity": pinned }
    : {};
  return { look, pinned: pinned !== null, pin: setPinned, scopeAttrs };
}

function DemoStyleSelect({ look, pinned, onPin }: { look: string; pinned: boolean; onPin: (id: string | null) => void }) {
  const selectId = useId();
  return (
    <Stack direction="horizontal" gap={2} className="items-center">
      <label htmlFor={selectId} className="text-sm text-muted-foreground">
        Style of this demo
      </label>
      {/* Uncontrolled: a controlled select here reports the previous value on change. */}
      <select
        key={pinned ? look : "follow-site"}
        id={selectId}
        defaultValue={pinned ? look : "follow-site"}
        onChange={(event) => onPin(event.target.value === "follow-site" ? null : event.target.value)}
        className="h-control-height-sm rounded-md border border-input bg-background px-3 text-control text-foreground focus-ring-control"
      >
        <option value="follow-site">Follow site</option>
        {identities.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
    </Stack>
  );
}

function DemoStyleScope({ children }: { children: ReactNode }) {
  const demo = usePinnedLook();
  const { resolvedTheme } = useTheme();
  return (
    <Stack gap={2} className="min-w-0">
      <DemoStyleSelect look={demo.look} pinned={demo.pinned} onPin={demo.pin} />
      <ThemeScope
        identity={demo.pinned ? demo.look : undefined}
        mode={resolvedTheme === "dark" ? "dark" : "light"}
        className="min-w-0"
      >
        {children}
      </ThemeScope>
    </Stack>
  );
}

export { DemoStyleScope, DemoStyleSelect, usePinnedLook };
