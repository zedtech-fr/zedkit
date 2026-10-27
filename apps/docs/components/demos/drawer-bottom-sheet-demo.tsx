"use client";

import * as React from "react";
import {
  Button,
  Checkbox,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Label,
  Stack,
  Text,
} from "@zedtech/zedkit-ui";

const STATUSES = ["Paid", "Awaiting shipment", "Shipped", "Refunded"] as const;

export function DrawerBottomSheetDemo() {
  const [checked, setChecked] = React.useState<readonly string[]>(["Paid"]);
  const toggle = (status: string) =>
    setChecked((current) => (current.includes(status) ? current.filter((entry) => entry !== status) : [...current, status]));
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Filters</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHandle />
        <DrawerHeader>
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerDescription>Narrow the orders list by status.</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <Stack gap={3} className="py-3">
            {STATUSES.map((status) => (
              <Stack key={status} direction="horizontal" gap={2} className="items-center">
                <Checkbox id={`filter-${status}`} checked={checked.includes(status)} onCheckedChange={() => toggle(status)} />
                <Label htmlFor={`filter-${status}`}>{status}</Label>
              </Stack>
            ))}
            <Text variant="muted">{checked.length === 0 ? "All orders are shown." : `${checked.length} status selected.`}</Text>
          </Stack>
        </DrawerBody>
        <DrawerFooter>
          <Button variant="outline" size="sm" onClick={() => setChecked([])}>
            Reset
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
