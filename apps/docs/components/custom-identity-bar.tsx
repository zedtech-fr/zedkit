"use client";

import { useSyncExternalStore } from "react";
import {
  applyIdentity,
  Button,
  CUSTOM_IDENTITY_ID,
  IDENTITY_CHANGE_EVENT,
  IDENTITY_CUSTOM_STORAGE_KEY,
  isNamedIdentityId,
  Stack,
  Text,
  useIdentity,
} from "@zedtech/zedkit-ui";

import { DEFAULT_IDENTITY } from "@/lib/default-identity";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(IDENTITY_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(IDENTITY_CHANGE_EVENT, onStoreChange);
  };
}

function CustomIdentityBar() {
  const current = useIdentity();
  const hasSheet = useSyncExternalStore(
    subscribe,
    () => Boolean(window.localStorage.getItem(IDENTITY_CUSTOM_STORAGE_KEY)),
    () => false,
  );
  if (isNamedIdentityId(current) || (current !== CUSTOM_IDENTITY_ID && !hasSheet)) return null;
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
