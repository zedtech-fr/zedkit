"use client";

import { Button, Stack } from "@zedtech/zedkit-ui";
import { homeCopy } from "@/ui/home/i18n/home-copy";

export function HomeGetStartedPathTabs({
  path,
  onPath,
}: {
  path: "npm" | "registry";
  onPath: (path: "npm" | "registry") => void;
}) {
  return (
    <Stack direction="horizontal" gap={2} className="flex-wrap" role="tablist" aria-label={homeCopy.getStarted.adoption.pathTabsAriaLabel}>
      <Button
        type="button"
        role="tab"
        aria-selected={path === "npm"}
        variant={path === "npm" ? "secondary" : "ghost"}
        size="sm"
        className="min-h-11"
        onClick={() => onPath("npm")}
      >
        {homeCopy.getStarted.adoption.pathNpm}
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
        {homeCopy.getStarted.adoption.pathCopySource}
      </Button>
    </Stack>
  );
}
