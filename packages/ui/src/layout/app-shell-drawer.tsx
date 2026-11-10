"use client";

/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- DrawerBody is an overflow scrollport (scrollable-region-focusable, #396). */
import { useState, type ReactElement, type ReactNode } from "react";
import { Menu } from "lucide-react";

import { IconButton } from "../actions/icon-button.js";
import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../drawer/drawer.js";
import { useUiMessages } from "../ui-provider.js";

export function AppShellDrawer({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  const messages = useUiMessages();
  const [open, setOpen] = useState(false);
  return (
    <Drawer direction="left" mobile="side" open={open} onOpenChange={setOpen}>
      {children}
      <DrawerContent>
        <DrawerHeader className="flex-row items-center justify-end">
          <DrawerTitle className="sr-only">{messages.mainNavigation}</DrawerTitle>
          <DrawerCloseButton />
        </DrawerHeader>
        <DrawerBody
          tabIndex={0}
          className="focus-ring"
          onClick={(event) => {
            const target = event.target;
            if (target instanceof Element && target.closest("a")) {
              setOpen(false);
            }
          }}
        >
          {sidebar}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

export function AppShellMenuTrigger({ trigger }: { trigger?: ReactElement }) {
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
