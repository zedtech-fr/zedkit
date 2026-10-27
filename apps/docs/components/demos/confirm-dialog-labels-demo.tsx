"use client";

import * as React from "react";
import { Badge, Button, ConfirmDialog, Stack, Text } from "@zedtech/zedkit-ui";

export function ConfirmDialogLabelsDemo() {
  const [revoked, setRevoked] = React.useState(false);
  return (
    <Stack gap={3} className="min-w-0 items-start">
      <Stack direction="horizontal" gap={2} className="items-center">
        <Text className="font-medium">Production key, created 12 March</Text>
        <Badge variant={revoked ? "secondary" : "success"}>{revoked ? "Revoked" : "In use"}</Badge>
      </Stack>
      {revoked ? (
        <Button variant="outline" size="sm" onClick={() => setRevoked(false)}>
          Restore the demo
        </Button>
      ) : (
        <ConfirmDialog
          trigger={<Button variant="outline">Revoke</Button>}
          title="Revoke this API key?"
          description="Every integration that uses it stops working immediately."
          confirmLabel="Revoke"
          cancelLabel="Keep access"
          onConfirm={() => setRevoked(true)}
        />
      )}
    </Stack>
  );
}
