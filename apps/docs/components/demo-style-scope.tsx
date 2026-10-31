"use client";

import { useId, useState, type ReactNode } from "react";
import { identities, Stack, useIdentity } from "@zedtech/zedkit-ui";

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

function DemoStyleSelect({ look, pinned, onPin }: { look: string; pinned: boolean; onPin: (id: string) => void }) {
  const selectId = useId();
  return (
    <Stack direction="horizontal" gap={2} className="items-center">
      <label htmlFor={selectId} className="text-sm text-muted-foreground">
        Style of this demo
      </label>
      {/* Uncontrolled: a controlled select here reports the previous value on change. */}
      <select
        key={pinned ? look : `site-${look}`}
        id={selectId}
        defaultValue={look}
        onChange={(event) => onPin(event.target.value)}
        className="h-control-height-sm rounded-md border border-input bg-background px-3 text-control text-foreground focus-ring-control"
      >
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
  return (
    <Stack gap={2} className="min-w-0">
      <DemoStyleSelect look={demo.look} pinned={demo.pinned} onPin={demo.pin} />
      <Stack className="min-w-0" {...demo.scopeAttrs}>
        {children}
      </Stack>
    </Stack>
  );
}

export { DemoStyleScope, DemoStyleSelect, usePinnedLook };
