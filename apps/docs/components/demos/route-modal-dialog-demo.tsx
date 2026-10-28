"use client";

import { useState } from "react";
import { Badge, Button, DetailPanel, RouteModal, Stack, Text } from "@zedtech/zedkit-ui";

export function RouteModalDialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Stack gap={3} className="min-w-0 items-start">
      <Text variant="muted">Same intercept, centered instead of a side drawer.</Text>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Open as dialog
      </Button>
      {open ? (
        <RouteModal
          title="Invoice #1042"
          description="Centered over the list. Escape or Close goes back."
          variant="dialog"
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
            <Text variant="muted">A long list scrolls inside the panel, not the page behind it.</Text>
          </Stack>
        </RouteModal>
      ) : null}
    </Stack>
  );
}
