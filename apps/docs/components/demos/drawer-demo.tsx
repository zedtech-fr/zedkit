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
  Stack,
  Text,
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
          <Stack direction="horizontal" gap={2} className="items-start justify-between">
            <Stack gap={1} className="min-w-0 flex-1 text-left">
              <DrawerTitle>Details</DrawerTitle>
              <DrawerDescription>
                Bottom sheet on phones (context stays visible above). Right panel from `sm` up.
              </DrawerDescription>
            </Stack>
            <DrawerCloseButton className="shrink-0" />
          </Stack>
        </DrawerHeader>
        <DrawerBody>
          <Text variant="muted">
            Scrollable body with overscroll contained. Swipe down on the handle or tap the dimmed area to go back.
          </Text>
        </DrawerBody>
        <DrawerFooter>
          <Button variant="secondary" size="sm">Save</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
