"use client";

import { useSyncExternalStore } from "react";
import {
  Badge,
  Button,
  IDENTITY_CHANGE_EVENT,
  identities,
  isPresetId,
  Stack,
  Text,
} from "@zedtech/zedkit-ui";

import { customIdentityBarCopy } from "@/features/identity/dock/i18n/custom-identity-bar-copy";
import { resetDocsSiteLook } from "@/features/identity/ui/docs-site-look";
import { docsSiteLookDiffersFromDefaults, readDocsSiteIdentityId } from "@/features/identity/ui/site-identity-storage";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(IDENTITY_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(IDENTITY_CHANGE_EVENT, onStoreChange);
  };
}

function readDiffers(): boolean {
  return docsSiteLookDiffersFromDefaults();
}

function CustomIdentityBar() {
  const differs = useSyncExternalStore(subscribe, readDiffers, () => false);
  const storedId = useSyncExternalStore(subscribe, readDocsSiteIdentityId, () => null);
  if (!differs) return null;
  const preset = storedId && isPresetId(storedId) ? identities.find((item) => item.id === storedId) : undefined;
  const badge = preset ? customIdentityBarCopy.presetActive(preset.label) : customIdentityBarCopy.badge;
  return (
    <Stack
      data-slot="custom-identity-bar"
      direction="horizontal"
      gap="sm"
      role="status"
      className="items-center border-b border-border muted-wash surface-pad-inline surface-pad-block-sm"
    >
      <Badge variant="secondary">{badge}</Badge>
      <Text className="text-muted-foreground">{customIdentityBarCopy.status}</Text>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="ms-auto shrink-0"
        onClick={() => resetDocsSiteLook()}
      >
        {customIdentityBarCopy.reset}
      </Button>
    </Stack>
  );
}

export { CustomIdentityBar };
