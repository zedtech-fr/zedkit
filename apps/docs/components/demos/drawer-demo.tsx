"use client";

import * as React from "react";
import {
  Badge,
  Button,
  DetailPanel,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerCloseButton,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Input,
  Stack,
  Text,
  Toaster,
  toast,
} from "@zedtech/zedkit-ui";

type DemoDirection = "auto" | "bottom" | "left" | "right" | "top";

const DIRECTIONS: readonly { value: DemoDirection; label: string; hint: string }[] = [
  { value: "auto", label: "Auto", hint: "Right panel on wide screens, bottom sheet on phones (the default)." },
  { value: "bottom", label: "Bottom", hint: "Bottom sheet: the page stays visible above. Swipe down to close." },
  { value: "left", label: "Left", hint: "Side panel, full height, up to 90% of a phone. Swipe left to close." },
  { value: "right", label: "Right", hint: "Side panel, full height, up to 90% of a phone. Swipe right to close." },
  { value: "top", label: "Top", hint: "Top panel: the handle sits at the bottom edge. Swipe up to close." },
];

const ACTIVITY = [
  "Camille moved the task to In review.",
  "Hugo attached the homepage mockups (v3).",
  "Inès commented: the hero image is too heavy on mobile.",
  "Camille changed the due date to 30 October.",
  "Hugo replied: compressed to 180 KB, ready for another look.",
  "Inès approved the copy on the pricing section.",
] as const;

export function DrawerDemo() {
  const [choice, setChoice] = React.useState<DemoDirection>("auto");
  const [open, setOpen] = React.useState(false);
  const current = DIRECTIONS.find((entry) => entry.value === choice);
  const direction = choice === "auto" ? "right" : choice;

  return (
    <>
      <Toaster />
      <Stack gap={3} className="min-w-0 items-start">
        <Stack gap={1} className="min-w-0">
          <Text variant="muted" id="drawer-direction-label" className="text-xs font-medium">
            Direction
          </Text>
          <Stack
            direction="horizontal"
            gap={1}
            className="flex-wrap"
            role="group"
            aria-labelledby="drawer-direction-label"
          >
            {DIRECTIONS.map((entry) => (
              <Button
                key={entry.value}
                type="button"
                size="sm"
                variant={entry.value === choice ? "default" : "outline"}
                aria-pressed={entry.value === choice}
                onClick={() => setChoice(entry.value)}
              >
                {entry.label}
              </Button>
            ))}
          </Stack>
          <Text variant="muted" className="text-xs">
            {current?.hint}
          </Text>
        </Stack>
        <Drawer direction={direction} mobile={choice === "auto" ? "sheet" : "side"} open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline">Open drawer</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHandle />
            <DrawerHeader>
              <Stack direction="horizontal" gap={2} className="items-start justify-between">
                <Stack gap={1} className="min-w-0 flex-1 text-left">
                  <DrawerTitle>Task details</DrawerTitle>
                  <DrawerDescription>Website relaunch · opened from the {choice === "auto" ? "default" : choice} edge.</DrawerDescription>
                </Stack>
                <DrawerCloseButton className="shrink-0" />
              </Stack>
            </DrawerHeader>
            <DrawerBody>
              <Stack gap={3} className="py-3">
                <Text className="font-medium">Review the homepage mockups</Text>
                <DetailPanel
                  items={[
                    { label: "Assignee", value: "Camille Rousseau" },
                    { label: "Due", value: "30 October" },
                    { label: "Status", value: <Badge variant="warning">In review</Badge> },
                  ]}
                />
                <Text variant="muted" className="text-xs font-medium">
                  Activity
                </Text>
                {ACTIVITY.map((line) => (
                  <Text key={line} variant="muted">
                    {line}
                  </Text>
                ))}
                <Input aria-label="Note" placeholder="Add a note for the team" />
              </Stack>
            </DrawerBody>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => toast("Saved")}
                >
                  Save
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </Stack>
    </>
  );
}
