"use client";

import { useState } from "react";
import { Button, RouteModal, Text } from "@zedtech/zedkit-ui";

export function RouteModalDemo() {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Open route modal
      </Button>
    );
  }
  return (
    <RouteModal
      title="Item"
      description="Same view as the full-page route, mounted from an intercept."
      onClose={() => setOpen(false)}
    >
      <Text>Detail body. In an app, wire onClose to closeRoute and a list fallback.</Text>
    </RouteModal>
  );
}
