"use client";

import { Button, Stack } from "@zedtech/zedkit-ui";

import { identityDockCopy as dockCopy } from "@/components/i18n/identity-dock-copy";
import { identityEditorCopy } from "@/components/i18n/identity-editor-copy";

/** Dock footer CTAs, replacing the AI text input: apply in one click, reset, or close to preview on the page. */
function IdentityDockActionBar(props: {
  appliedSite: boolean;
  onApplySite: () => void;
  onRemoveFromSite: () => void;
  onReset: () => void;
  onPreview: () => void;
}) {
  const toolbar = identityEditorCopy.toolbar;
  return (
    <Stack gap="sm" className="shrink-0 border-t border-border bg-background surface-pad-compact" data-dock-action-bar="">
      <Stack direction="horizontal" gap="sm" className="flex-wrap">
        <Button type="button" onClick={props.onApplySite}>
          {toolbar.applySite}
        </Button>
        <Button type="button" variant="outline" onClick={props.onReset}>
          {toolbar.reset}
        </Button>
        <Button type="button" variant="outline" onClick={props.onPreview} title={dockCopy.previewHint}>
          {dockCopy.preview}
        </Button>
        {props.appliedSite ? (
          <Button type="button" variant="outline" onClick={props.onRemoveFromSite}>
            {identityEditorCopy.library.removeFromSite}
          </Button>
        ) : null}
      </Stack>
    </Stack>
  );
}

export { IdentityDockActionBar };
