"use client";

import { Calendar, CircleCheck, FolderOpen, MessageSquare, Package, RotateCcw, Truck, Users } from "lucide-react";
import { Heading, IconLabel, Stack, Text } from "@zedtech/zedkit-ui";

/** Project details: a row of small facts, each with a quiet decorative icon. */
export function IconLabelDemo() {
  return (
    <Stack gap={3} className="min-w-0 rounded-lg border border-border bg-background p-4">
      <Stack gap={1}>
        <Heading level={3}>Spring campaign</Heading>
        <Text variant="muted" className="text-sm">
          Landing page, launch email and three social posts.
        </Text>
      </Stack>
      <Stack direction="horizontal" gap={4} className="flex-wrap text-sm">
        <IconLabel icon={FolderOpen}>Harbor Studio</IconLabel>
        <IconLabel icon={Calendar}>Due Nov 14</IconLabel>
        <IconLabel icon={Users}>4 members</IconLabel>
        <IconLabel icon={MessageSquare}>12 comments</IconLabel>
      </Stack>
    </Stack>
  );
}

const ORDERS = [
  { number: "#1042", item: "Linen shirt, size M", icon: CircleCheck, state: "Delivered Oct 22" },
  { number: "#1043", item: "Canvas tote bag", icon: Truck, state: "Shipped Oct 25" },
  { number: "#1044", item: "Ceramic mug set (4)", icon: Package, state: "Packing" },
  { number: "#1045", item: "Wool scarf, grey", icon: RotateCcw, state: "Return requested" },
];

/** Order list: the state keeps its readable text; the icon only adds a quick visual cue. */
export function IconLabelOrdersDemo() {
  return (
    <ul aria-label="Recent orders" className="divide-y divide-border rounded-lg border border-border bg-background">
      {ORDERS.map((order) => (
        <li key={order.number} className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
          <Stack gap={1} className="min-w-0">
            <Text as="span" className="font-medium">
              {order.number}
            </Text>
            <Text as="span" variant="muted" className="text-xs">
              {order.item}
            </Text>
          </Stack>
          <IconLabel icon={order.icon} className="text-sm">
            {order.state}
          </IconLabel>
        </li>
      ))}
    </ul>
  );
}
