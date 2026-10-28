"use client";

import type { ReactNode } from "react";
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Text,
} from "@zedtech/zedkit-ui";

export function DevtoolsDrawerShell({
  triggerLabel,
  children,
  footer,
}: {
  triggerLabel: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Drawer>
        <DrawerTrigger asChild>
          <Button type="button" size="sm" variant="secondary">
            {triggerLabel}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHandle />
          <DrawerHeader>
            <DrawerTitle>Developer tools</DrawerTitle>
            <DrawerDescription>Local-only controls. Tree-shake this panel out of production builds.</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>{children}</DrawerBody>
          {footer ? <DrawerFooter>{footer}</DrawerFooter> : null}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

export function DevtoolsDrawerFooter() {
  return (
    <Text variant="muted" className="text-sm">
      Not shown when `devtoolsEnabled()` is false.
    </Text>
  );
}
