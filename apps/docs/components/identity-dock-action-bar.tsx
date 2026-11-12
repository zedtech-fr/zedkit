"use client";

import { Button, Stack } from "@zedtech/zedkit-ui";

import { identityEditorCopy } from "@/components/i18n/identity-editor-copy";

/** Dock footer: Reset restores the site default look. Edits already paint the site. */
function IdentityDockActionBar(props: { onReset: () => void }) {
  return (
    <Stack gap="sm" className="shrink-0 border-t border-border bg-background surface-pad-compact" data-dock-action-bar="">
      <Stack direction="horizontal" gap="sm" className="flex-wrap">
        <Button type="button" variant="outline" onClick={props.onReset}>
          {identityEditorCopy.toolbar.reset}
        </Button>
      </Stack>
    </Stack>
  );
}

export { IdentityDockActionBar };
