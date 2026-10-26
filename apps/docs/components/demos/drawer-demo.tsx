"use client";

import {
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@zedtech/zedkit-ui";

export function DrawerDemo() {
  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button variant="outline">Open drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHandle />
        <DrawerHeader>
          <div className="flex items-start justify-between gap-drawer-header-gap">
            <div className="min-w-0 flex-1 text-left">
              <DrawerTitle>Details</DrawerTitle>
              <DrawerDescription>
                Bottom sheet on phones (context stays visible above). Right panel from `sm` up.
              </DrawerDescription>
            </div>
            <DrawerCloseButton className="shrink-0" />
          </div>
        </DrawerHeader>
        <DrawerBody>
          <p className="text-sm text-muted-foreground">
            Scrollable body with overscroll contained. Swipe down on the handle or tap the dimmed area to go back.
          </p>
        </DrawerBody>
        <DrawerFooter>
          <Button variant="secondary" size="sm">Save</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
