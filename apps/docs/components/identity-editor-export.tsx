"use client";

import { useState } from "react";
import {
  Button,
  ConfirmDialog,
  Field,
  FieldLabel,
  Stack,
  Text,
  Textarea,
  identityContrastWarnings,
  tokensToCss,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";
import { identityEditorCopy } from "@/components/i18n/identity-editor-copy";

function copyText(value: string, onDone: () => void) {
  const clipboard = navigator.clipboard;
  if (!clipboard) return;
  clipboard.writeText(value).then(onDone, () => {});
}

function CopyButton({
  label,
  value,
  blocked,
  onCopied,
}: {
  label: string;
  value: string;
  blocked: boolean;
  onCopied: () => void;
}) {
  const trigger = (
    <Button type="button" variant="outline">
      {label}
    </Button>
  );
  if (!blocked) {
    return (
      <Button type="button" variant="outline" onClick={() => copyText(value, onCopied)}>
        {label}
      </Button>
    );
  }
  return (
    <ConfirmDialog
      trigger={trigger}
      title={identityEditorCopy.export.contrastTitle}
      description={identityEditorCopy.export.contrastDescription}
      confirmLabel={identityEditorCopy.export.confirmLabel}
      onConfirm={() => copyText(value, onCopied)}
    />
  );
}

function IdentityEditorExport({ tokens }: { tokens: IdentityTokens }) {
  const css = tokensToCss(tokens, ":root");
  const json = JSON.stringify(tokens, null, 2);
  const [copied, setCopied] = useState<"css" | "json" | null>(null);
  const blocked = identityContrastWarnings(tokens).length > 0;

  function mark(kind: "css" | "json") {
    setCopied(kind);
  }

  return (
    <Stack gap={3} data-slot="identity-editor-export">
      {blocked ? (
        <Text role="status" variant="muted">
          {identityEditorCopy.export.blocked}
        </Text>
      ) : null}
      <Field>
        <FieldLabel htmlFor="identity-editor-css">{identityEditorCopy.export.css}</FieldLabel>
        <Textarea id="identity-editor-css" readOnly value={css} className="font-mono" />
      </Field>
      <CopyButton label={identityEditorCopy.export.copyCss} value={css} blocked={blocked} onCopied={() => mark("css")} />
      <Field>
        <FieldLabel htmlFor="identity-editor-json">{identityEditorCopy.export.json}</FieldLabel>
        <Textarea id="identity-editor-json" readOnly value={json} className="font-mono" />
      </Field>
      <CopyButton label={identityEditorCopy.export.copyJson} value={json} blocked={blocked} onCopied={() => mark("json")} />
      {copied ? <Text role="status">{identityEditorCopy.export.copied(copied)}</Text> : null}
    </Stack>
  );
}

export { IdentityEditorExport };
