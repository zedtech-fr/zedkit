"use client";

import { BrickWall } from "lucide-react";
import { IconLabel, Text } from "@zedtech/zedkit-ui";

export function RegistryBrickName({ name }: { name: string }) {
  return (
    <IconLabel icon={BrickWall} data-registry-brick="">
      <code>{name}</code>
    </IconLabel>
  );
}

export function RegistryBrickList({ names }: { names: readonly string[] }) {
  return (
    <Text
      as="span"
      data-registry-bricks=""
      className="inline-flex max-w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-1"
    >
      {names.map((name) => (
        <RegistryBrickName key={name} name={name} />
      ))}
    </Text>
  );
}
