"use client";

import { Button, Field, FieldLabel, identities, isPresetId, Stack, type IdentityId } from "@zedtech/zedkit-ui";

function IdentityEditorToolbar({
  identity,
  darkPreview,
  canUndo,
  onIdentity,
  onDark,
  onUndo,
  onReset,
  onApplySite,
}: {
  identity: IdentityId;
  darkPreview: boolean;
  canUndo: boolean;
  onIdentity: (id: IdentityId) => void;
  onDark: () => void;
  onUndo: () => void;
  onReset: () => void;
  onApplySite: () => void;
}) {
  return (
    <Stack direction="horizontal" gap={2}>
      <Field>
        <FieldLabel htmlFor="identity-editor-look">Look</FieldLabel>
        <select
          id="identity-editor-look"
          className="h-control-height rounded-md border border-input bg-background px-3 text-control text-foreground focus-ring-control"
          value={identity}
          onChange={(event) => {
            const id = event.target.value;
            if (isPresetId(id)) onIdentity(id);
          }}
        >
          {identities.map((look) => (
            <option key={look.id} value={look.id}>
              {look.label}
            </option>
          ))}
        </select>
      </Field>
      <Button type="button" variant="outline" aria-pressed={darkPreview} onClick={onDark}>
        Dark
      </Button>
      <Button type="button" variant="outline" disabled={!canUndo} onClick={onUndo}>
        Undo
      </Button>
      <Button type="button" variant="outline" onClick={onReset}>
        Reset
      </Button>
      <Button type="button" onClick={onApplySite}>
        Apply to the whole site
      </Button>
    </Stack>
  );
}

export { IdentityEditorToolbar };
