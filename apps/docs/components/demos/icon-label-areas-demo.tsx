"use client";

import { Bot, LayoutDashboard, Server, TrendingUp } from "lucide-react";
import { IconLabel, Stack, Text } from "@zedtech/zedkit-ui";

const AREAS = [
  { label: "Build a UI", icon: LayoutDashboard },
  { label: "Core & server", icon: Server },
  { label: "Improve SEO", icon: TrendingUp },
  { label: "Set up coding agents", icon: Bot },
] as const;

/** Home areas: each catalog family keeps its name; the icon is only a cue. */
export function IconLabelAreasDemo() {
  return (
    <Stack gap={3} className="min-w-0">
      <Text variant="muted">Four areas. The icon is decorative; the name stays.</Text>
      <Stack gap={2}>
        {AREAS.map((area) => (
          <IconLabel key={area.label} icon={area.icon}>
            {area.label}
          </IconLabel>
        ))}
      </Stack>
    </Stack>
  );
}
