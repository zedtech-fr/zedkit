"use client";

import * as React from "react";
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
  Input,
  Stack,
  Text,
} from "@zedtech/zedkit-ui";

type DemoDirection = "auto" | "bottom" | "left" | "right" | "top";

const DIRECTIONS: readonly { value: DemoDirection; label: string; hint: string }[] = [
  { value: "auto", label: "Auto", hint: "Right panel on wide screens, bottom sheet on phones (the default)." },
  { value: "bottom", label: "Bottom", hint: "Bottom sheet: the page stays visible above. Swipe down to close." },
  { value: "left", label: "Left", hint: "Side panel, full height, up to 90% of a phone. Swipe left to close." },
  { value: "right", label: "Right", hint: "Side panel, full height, up to 90% of a phone. Swipe right to close." },
  { value: "top", label: "Top", hint: "Top panel: the handle sits at the bottom edge. Swipe up to close." },
];

const FILLER = [
  "The header and the actions stay in place while this area scrolls.",
  "Scrolling here never moves the page behind the drawer.",
  "Drag the handle, or the panel itself, toward the edge it came from to close it.",
  "Tap the dimmed area, press Escape, or use the close button to go back.",
] as const;

export function DrawerDemo() {
  const [choice, setChoice] = React.useState<DemoDirection>("auto");
  const current = DIRECTIONS.find((entry) => entry.value === choice);
  const direction = choice === "auto" ? "right" : choice;

  return (
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
      <Drawer direction={direction} mobile={choice === "auto" ? "sheet" : "side"}>
        <DrawerTrigger asChild>
          <Button variant="outline">Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHandle />
          <DrawerHeader>
            <Stack direction="horizontal" gap={2} className="items-start justify-between">
              <Stack gap={1} className="min-w-0 flex-1 text-left">
                <DrawerTitle>Details</DrawerTitle>
                <DrawerDescription>Opened from the {choice === "auto" ? "default" : choice} edge.</DrawerDescription>
              </Stack>
              <DrawerCloseButton className="shrink-0" />
            </Stack>
          </DrawerHeader>
          <DrawerBody>
            <Stack gap={3} className="py-3">
              {FILLER.map((line) => (
                <Text key={line} variant="muted">
                  {line}
                </Text>
              ))}
              <Input aria-label="Note" placeholder="Type a note (the field stays in view)" />
              {FILLER.map((line) => (
                <Text key={`more-${line}`} variant="muted">
                  {line}
                </Text>
              ))}
            </Stack>
          </DrawerBody>
          <DrawerFooter>
            <Button variant="secondary" size="sm">
              Save
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Stack>
  );
}
