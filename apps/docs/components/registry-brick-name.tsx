"use client";

import { BrickWall } from "lucide-react";
import { IconLabel } from "@zedtech/zedkit-ui";

export function RegistryBrickName({ name }: { name: string }) {
  return (
    <IconLabel icon={BrickWall} data-registry-brick="">
      <code>{name}</code>
    </IconLabel>
  );
}
