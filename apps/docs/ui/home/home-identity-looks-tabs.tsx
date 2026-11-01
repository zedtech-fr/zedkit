"use client";

import type { ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger } from "@zedtech/zedkit-ui";
import { HOME_IDENTITY_FACTS, IDENTITY_IDS, isIdentityId, type IdentityId } from "@/ui/home/home-identity-facts";
import { HomeIdentityPaletteDots } from "@/ui/home/home-identity-looks-swatches";
import { homeIdentityLooksCopy } from "@/ui/home/home-identity-looks-copy";

const TAB_DOTS = ["background", "primary", "accent"] as const;

export function HomeIdentityLooksTabs({
  value,
  mode,
  onValueChange,
  children,
}: {
  value: IdentityId;
  mode: "light" | "dark";
  onValueChange: (id: IdentityId) => void;
  /** Panel(s): the active tab's `TabsContent`, so each trigger controls a real panel. */
  children: ReactNode;
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => {
        if (isIdentityId(next)) onValueChange(next);
      }}
      className="w-full min-w-0"
    >
      <TabsList
        aria-label={homeIdentityLooksCopy.tabsAriaLabel}
        className="h-auto min-h-11 w-full min-w-0 snap-x snap-mandatory justify-start overflow-x-auto"
      >
        {IDENTITY_IDS.map((id) => (
          <TabsTrigger
            key={id}
            value={id}
            className="min-h-11 shrink-0 snap-start gap-2 px-3"
          >
            <HomeIdentityPaletteDots identity={id} mode={mode} tokens={TAB_DOTS} />
            {HOME_IDENTITY_FACTS[id].label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}
