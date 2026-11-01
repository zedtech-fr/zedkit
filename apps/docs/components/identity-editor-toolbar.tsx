"use client";

import {
  Button,
  Field,
  FieldLabel,
  Input,
  Stack,
  identities,
  type IdentityOption,
} from "@zedtech/zedkit-ui";
import { identityEditorCopy } from "@/components/i18n/identity-editor-copy";

type IdentityEditorToolbarProps = {
  identity: string;
  looks: readonly IdentityOption[];
  name: string;
  namedSelected: boolean;
  darkPreview: boolean;
  canUndo: boolean;
  onIdentity: (id: string) => void;
  onName: (value: string) => void;
  onSave: () => void;
  onRename: () => void;
  onDelete: () => void;
  onDark: () => void;
  onUndo: () => void;
  onReset: () => void;
  onApplySite: () => void;
};

function LookSelect({
  identity,
  looks,
  onIdentity,
}: {
  identity: string;
  looks: readonly IdentityOption[];
  onIdentity: (id: string) => void;
}) {
  const options = looks.length > 0 ? looks : identities;
  return (
    <Field className="shrink-0">
      <FieldLabel htmlFor="identity-editor-look">{identityEditorCopy.toolbar.look}</FieldLabel>
      <select
        id="identity-editor-look"
        className="h-control-height rounded-md border border-input bg-background px-3 text-control text-foreground focus-ring-control"
        value={identity}
        onChange={(event) => onIdentity(event.target.value)}
      >
        {options.map((look) => (
          <option key={look.id} value={look.id}>
            {look.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function IdentityEditorToolbar({
  identity,
  looks,
  name,
  namedSelected,
  darkPreview,
  canUndo,
  onIdentity,
  onName,
  onSave,
  onRename,
  onDelete,
  onDark,
  onUndo,
  onReset,
  onApplySite,
}: IdentityEditorToolbarProps) {
  return (
    <Stack direction="horizontal" gap={2} className="flex-wrap">
      <LookSelect identity={identity} looks={looks} onIdentity={onIdentity} />
      <Field className="min-w-36">
        <FieldLabel htmlFor="identity-editor-name">{identityEditorCopy.toolbar.name}</FieldLabel>
        <Input id="identity-editor-name" value={name} onChange={(event) => onName(event.target.value)} />
      </Field>
      <Button type="button" variant="outline" onClick={onSave} disabled={name.trim() === ""}>
        {identityEditorCopy.toolbar.saveLook}
      </Button>
      <Button type="button" variant="outline" onClick={onRename} disabled={!namedSelected || name.trim() === ""}>
        {identityEditorCopy.toolbar.rename}
      </Button>
      <Button type="button" variant="outline" onClick={onDelete} disabled={!namedSelected}>
        {identityEditorCopy.toolbar.delete}
      </Button>
      <Button type="button" variant="outline" aria-pressed={darkPreview} onClick={onDark}>
        {identityEditorCopy.toolbar.dark}
      </Button>
      <Button type="button" variant="outline" disabled={!canUndo} onClick={onUndo}>
        {identityEditorCopy.toolbar.undo}
      </Button>
      <Button type="button" variant="outline" onClick={onReset}>
        {identityEditorCopy.toolbar.reset}
      </Button>
      <Button type="button" onClick={onApplySite}>
        {identityEditorCopy.toolbar.applySite}
      </Button>
    </Stack>
  );
}

export { IdentityEditorToolbar };
