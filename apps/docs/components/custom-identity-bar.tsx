"use client";

import { applyIdentity, Button, CUSTOM_IDENTITY_ID, Stack, Text, useIdentity } from "@zedtech/zedkit-ui";

import { DEFAULT_IDENTITY } from "@/lib/default-identity";

function CustomIdentityBar() {
  const current = useIdentity();
  if (current !== CUSTOM_IDENTITY_ID) return null;
  return (
    <Stack
      data-slot="custom-identity-bar"
      direction="horizontal"
      gap={2}
      role="status"
      className="fixed bottom-4 left-4 z-overlay rounded-md border border-border bg-background px-3 py-2 text-foreground shadow-md"
    >
      <Text>Custom identity active</Text>
      <Button type="button" size="sm" variant="outline" onClick={() => applyIdentity(DEFAULT_IDENTITY)}>
        Reset to default
      </Button>
    </Stack>
  );
}

export { CustomIdentityBar };
