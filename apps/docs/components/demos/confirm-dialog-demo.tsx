"use client";

import * as React from "react";
import { Badge, Button, ConfirmDialog, Stack, Text } from "@zedtech/zedkit-ui";

export function ConfirmDialogDemo() {
  const [deleted, setDeleted] = React.useState(false);
  return (
    <Stack gap={3} className="min-w-0 items-start">
      <Stack direction="horizontal" gap={2} className="items-center">
        <Text className="font-medium">Website relaunch</Text>
        <Badge variant={deleted ? "secondary" : "success"}>{deleted ? "Deleted" : "Active"}</Badge>
      </Stack>
      {deleted ? (
        <Stack gap={2} className="items-start">
          <Text variant="muted">The project and its 14 tasks were deleted.</Text>
          <Button variant="outline" size="sm" onClick={() => setDeleted(false)}>
            Restore the demo
          </Button>
        </Stack>
      ) : (
        <ConfirmDialog
          trigger={<Button variant="destructive">Delete item</Button>}
          title="Delete “Website relaunch”?"
          description="The project and its 14 tasks are removed for everyone on the team. This cannot be undone."
          confirmLabel="Delete project"
          onConfirm={() => setDeleted(true)}
        />
      )}
    </Stack>
  );
}
