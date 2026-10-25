"use client";

import { Button, ConfirmDialog } from "@zedtech/zedkit-ui";

export function ConfirmDialogDemo() {
  return (
    <ConfirmDialog
      trigger={<Button variant="destructive">Delete item</Button>}
      title="Delete item?"
      description="This cannot be undone."
      onConfirm={() => {}}
    />
  );
}
