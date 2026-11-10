"use client";

import type * as React from "react";
import { Menu } from "lucide-react";

import { IconButton } from "../actions/icon-button.js";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "../drawer/drawer.js";
import { useUiMessages } from "../ui-provider.js";

export function AppShellDrawer({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const messages = useUiMessages();
  return (
    <Drawer direction="left" mobile="side">
      {children}
      <DrawerContent>
        <DrawerTitle className="sr-only">{messages.mainNavigation}</DrawerTitle>
        {sidebar}
      </DrawerContent>
    </Drawer>
  );
}

export function AppShellMenuTrigger({ trigger }: { trigger?: React.ReactElement | undefined }) {
  const messages = useUiMessages();
  return (
    <DrawerTrigger asChild>
      {trigger ?? (
        <IconButton label={messages.menu} variant="ghost">
          <Menu aria-hidden="true" />
        </IconButton>
      )}
    </DrawerTrigger>
  );
}
