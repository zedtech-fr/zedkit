"use client";

import { useState } from "react";
import { Badge, Button, DetailPanel, RouteModal, Stack, Text } from "@zedtech/zedkit-ui";

export function RouteModalDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Stack gap={3} className="min-w-0 items-start">
      <Text variant="muted">Clicking a row in a list opens its detail over the list; the address bar changes too.</Text>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Open route modal
      </Button>
      {open ? (
        <RouteModal
          title="Order #1042"
          description="Same view as the full-page route /orders/1042, mounted from an intercept."
          onClose={() => setOpen(false)}
        >
          <Stack gap={3}>
            <DetailPanel
              items={[
                { label: "Customer", value: "Camille Rousseau" },
                { label: "Total", value: "€101.50" },
                { label: "Status", value: <Badge variant="warning">Awaiting shipment</Badge> },
              ]}
            />
            <Text variant="muted">Reloading this address, or sharing it, opens the full page instead.</Text>
          </Stack>
        </RouteModal>
      ) : null}
    </Stack>
  );
}
