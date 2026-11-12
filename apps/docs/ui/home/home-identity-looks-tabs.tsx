"use client";

import { TabsList, TabsTrigger, Text } from "@zedtech/zedkit-ui";
import {
  HOME_IDENTITY_FACTS,
  IDENTITY_IDS,
} from "@/ui/home/home-identity-facts";
import { homeIdentityLooksCopy } from "@/ui/home/home-identity-looks-copy";

export function HomeIdentityLooksTabs() {
  return (
    <TabsList
      aria-label={homeIdentityLooksCopy.tabsAriaLabel}
      className="inline-flex h-auto! min-h-target w-fit max-w-full flex-wrap justify-start gap-flush overflow-x-visible border border-border bg-background p-track"
    >
      {IDENTITY_IDS.map((id) => (
        <TabsTrigger
          key={id}
          value={id}
          data-look-tab=""
          className="h-auto! min-h-target px-tab data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none"
        >
          <Text as="span" data-tab-label="">
            {HOME_IDENTITY_FACTS[id].label}
          </Text>
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
