"use client";

import type { ReactNode } from "react";
import { ScrollGallery, Tabs, TabsList, TabsTrigger } from "@zedtech/zedkit-ui";
import {
  HOME_IDENTITY_FACTS,
  IDENTITY_IDS,
  isIdentityId,
  type IdentityId,
} from "@/ui/home/home-identity-facts";
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
      className="w-full content-shrink"
    >
      <ScrollGallery className="w-full content-shrink">
        <TabsList
          aria-label={homeIdentityLooksCopy.tabsAriaLabel}
          className="inline-flex h-auto! min-h-target w-max max-w-none flex-nowrap justify-start gap-stack-sm bg-muted p-track"
        >
          {IDENTITY_IDS.map((id) => (
            <TabsTrigger
              key={id}
              value={id}
              data-look-tab=""
              className="h-auto! min-h-target w-max max-w-none shrink-0 snap-start flex-row! items-center! px-tab py-select-item-block"
            >
              <HomeIdentityPaletteDots
                identity={id}
                mode={mode}
                tokens={TAB_DOTS}
              />
              <span className="flex flex-col items-start leading-tight">
                <span data-tab-label="">
                  {homeIdentityLooksCopy.products[id]}
                </span>
                <span className="text-caption font-normal text-muted-foreground">
                  {HOME_IDENTITY_FACTS[id].label}
                </span>
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </ScrollGallery>
      {children}
    </Tabs>
  );
}
