"use client";

import { IconLabel } from "@zedtech/zedkit-ui";

import { agentIconFor } from "@/lib/agent-icons";

export function AgentName({ name }: { name: string }) {
  const Icon = agentIconFor(name);
  return (
    <IconLabel icon={Icon}>
      <code>{name}</code>
    </IconLabel>
  );
}
