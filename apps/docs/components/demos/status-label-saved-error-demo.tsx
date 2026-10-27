"use client";

import { useState } from "react";
import { Button, Stack, StatusLabel, Text } from "@zedtech/zedkit-ui";

export function StatusLabelSavedErrorDemo() {
  const [invoiceSaved, setInvoiceSaved] = useState(false);
  return (
    <Stack gap={3} className="min-w-0">
      <Stack gap={1}>
        <Text className="font-medium">Project notes</Text>
        <StatusLabel tone="saved">All changes saved</StatusLabel>
      </Stack>
      <Stack gap={1}>
        <Text className="font-medium">Invoice draft</Text>
        {invoiceSaved ? (
          <StatusLabel tone="saved">All changes saved</StatusLabel>
        ) : (
          <Stack direction="horizontal" gap={3} className="items-center">
            <StatusLabel tone="error">Could not save</StatusLabel>
            <Button size="sm" variant="outline" onClick={() => setInvoiceSaved(true)}>
              Try again
            </Button>
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
