"use client";

import { useState } from "react";
import { Badge, Button, Heading, OfflineNote, Stack, Text, useOnlineStatus } from "@zedtech/zedkit-ui";

const DRAFTS = [
  { id: "INV-2041", client: "Harbor Studio", amount: "€1,280.00" },
  { id: "INV-2042", client: "Northwind Bakery", amount: "€346.50" },
];

/** A page-level note above work that is still saved on the device. */
export function OfflineNoteDemo() {
  return (
    <Stack gap={3} className="min-w-0 rounded-lg border border-border bg-background p-4">
      <OfflineNote />
      <Heading level={3}>Invoice drafts</Heading>
      <ul aria-label="Invoice drafts" className="divide-y divide-border rounded-lg border border-border">
        {DRAFTS.map((draft) => (
          <li key={draft.id} className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
            <Stack gap={1} className="min-w-0">
              <Text as="span" className="font-medium">
                {draft.id}
              </Text>
              <Text as="span" variant="muted" className="text-xs">
                {draft.client}
              </Text>
            </Stack>
            <Stack direction="horizontal" gap={3} className="items-center">
              <Text as="span" className="text-sm">
                {draft.amount}
              </Text>
              <Badge variant="secondary">Waiting to sync</Badge>
            </Stack>
          </li>
        ))}
      </ul>
    </Stack>
  );
}

/** Wired to the real hook; the button fires the same window events a lost connection does. */
export function OfflineNoteWiredDemo() {
  const online = useOnlineStatus();
  const [saved, setSaved] = useState(0);
  const simulate = () => window.dispatchEvent(new Event(online ? "offline" : "online"));
  return (
    <Stack gap={3} className="min-w-0 rounded-lg border border-border bg-background p-4">
      {online ? null : <OfflineNote title="No connection">Try again when you are back.</OfflineNote>}
      <Stack gap={1}>
        <Heading level={3}>Delivery note</Heading>
        <Text variant="muted" className="text-sm">
          Order #1043 · Canvas tote bag · {saved === 0 ? "not saved yet" : `saved ${saved} time${saved > 1 ? "s" : ""}`}
        </Text>
      </Stack>
      <Stack direction="horizontal" gap={2} className="flex-wrap">
        <Button disabled={!online} onClick={() => setSaved((count) => count + 1)}>
          Save note
        </Button>
        <Button variant="outline" aria-pressed={!online} onClick={simulate}>
          {online ? "Simulate losing the connection" : "Simulate coming back online"}
        </Button>
      </Stack>
    </Stack>
  );
}

/** Own wording: say what is kept and what the next step is. */
export function OfflineNoteWordingDemo() {
  return (
    <Stack gap={3} className="min-w-0 rounded-lg border border-border bg-background p-4">
      <OfflineNote title="No connection">Your cart is saved on this device. Reconnect to pay.</OfflineNote>
      <Stack gap={1}>
        <Heading level={3}>Your cart</Heading>
        <Text variant="muted" className="text-sm">
          2 items · €58.00
        </Text>
      </Stack>
      <Button disabled className="w-fit">
        Pay now
      </Button>
    </Stack>
  );
}
