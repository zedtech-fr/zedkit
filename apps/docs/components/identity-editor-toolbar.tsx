"use client";

import type { ReactNode } from "react";
import {
  Button,
  ConfirmDialog,
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
    <Field className="w-full sm:w-48 sm:shrink-0">
      <FieldLabel htmlFor="identity-editor-look">{identityEditorCopy.toolbar.look}</FieldLabel>
      <select
        id="identity-editor-look"
        className="h-control-height w-full rounded-md border border-input bg-background px-3 text-control text-foreground focus-ring-control"
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

function ToolbarGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack direction="horizontal" gap={2} role="group" aria-label={label} className="flex-wrap items-end">
      {children}
    </Stack>
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
  const copy = identityEditorCopy.toolbar;
  return (
    <Stack gap={4} data-slot="identity-editor-toolbar">
      <ToolbarGroup label={copy.groups.look}>
        <LookSelect identity={identity} looks={looks} onIdentity={onIdentity} />
        <Field className="w-full min-w-36 sm:w-56">
          <FieldLabel htmlFor="identity-editor-name">{copy.name}</FieldLabel>
          <Input id="identity-editor-name" value={name} onChange={(event) => onName(event.target.value)} />
        </Field>
        <Button type="button" onClick={onSave} disabled={name.trim() === ""}>
          {copy.saveLook}
        </Button>
        <Button type="button" variant="outline" onClick={onRename} disabled={!namedSelected || name.trim() === ""}>
          {copy.rename}
        </Button>
        <ConfirmDialog
          trigger={
            <Button type="button" variant="outline" disabled={!namedSelected} className="text-destructive">
              {copy.delete}
            </Button>
          }
          title={copy.deleteTitle}
          description={copy.deleteDescription}
          confirmLabel={copy.deleteConfirm}
          onConfirm={onDelete}
        />
      </ToolbarGroup>
      <Stack direction="horizontal" gap={6} className="flex-wrap items-end">
        <ToolbarGroup label={copy.groups.edit}>
          <Button type="button" variant="outline" aria-pressed={darkPreview} onClick={onDark}>
            {copy.previewDark}
          </Button>
          <Button type="button" variant="outline" disabled={!canUndo} onClick={onUndo}>
            {copy.undo}
          </Button>
          <Button type="button" variant="outline" onClick={onReset}>
            {copy.reset}
          </Button>
        </ToolbarGroup>
        <ToolbarGroup label={copy.groups.site}>
          <Button type="button" variant="outline" onClick={onApplySite}>
            {copy.applySite}
          </Button>
        </ToolbarGroup>
      </Stack>
    </Stack>
  );
}

export { IdentityEditorToolbar };
