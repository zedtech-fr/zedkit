"use client";

import { Button, Stack, Text } from "@zedtech/zedkit-ui";
import { HOME_PERSUASION_TEXT_CLASS } from "@/ui/home/home-rhythm";

export function HomeGetStartedPathTabs({
  path,
  onPath,
}: {
  path: "npm" | "registry";
  onPath: (path: "npm" | "registry") => void;
}) {
  return (
    <Stack direction="horizontal" gap={2} className="flex-wrap" role="tablist" aria-label="Install path">
      <Button
        type="button"
        role="tab"
        aria-selected={path === "npm"}
        variant={path === "npm" ? "secondary" : "ghost"}
        size="sm"
        className="min-h-11"
        onClick={() => onPath("npm")}
      >
        npm
      </Button>
      <Button
        type="button"
        role="tab"
        aria-selected={path === "registry"}
        variant={path === "registry" ? "secondary" : "ghost"}
        size="sm"
        className="min-h-11"
        onClick={() => onPath("registry")}
      >
        Copy source
      </Button>
    </Stack>
  );
}

export function HomeGetStartedStyledResult() {
  return (
    <Stack
      gap={2}
      className="min-w-0 items-start justify-center rounded-md border border-border bg-background p-6"
      data-home-get-started-result=""
    >
      <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
        Styled result
      </Text>
      <Button type="button" tabIndex={-1}>
        Save
      </Button>
    </Stack>
  );
}
