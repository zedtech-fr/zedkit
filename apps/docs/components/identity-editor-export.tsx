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
      title="Contrast below WCAG AA"
      description="Some text or control colours fail 4.5:1 (or 3:1 for accents and borders). Exporting them can make copy unreadable. Fix the warnings above, or export anyway if you accept the risk."
      confirmLabel="Export anyway"
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
          Copy is blocked until you fix contrast warnings or confirm export.
        </Text>
      ) : null}
      <Field>
        <FieldLabel htmlFor="identity-editor-css">CSS</FieldLabel>
        <Textarea id="identity-editor-css" readOnly value={css} className="font-mono" />
      </Field>
      <CopyButton label="Copy CSS" value={css} blocked={blocked} onCopied={() => mark("css")} />
      <Field>
        <FieldLabel htmlFor="identity-editor-json">JSON</FieldLabel>
        <Textarea id="identity-editor-json" readOnly value={json} className="font-mono" />
      </Field>
      <CopyButton label="Copy JSON" value={json} blocked={blocked} onCopied={() => mark("json")} />
      {copied ? <Text role="status">Copied {copied === "css" ? "CSS" : "JSON"}.</Text> : null}
    </Stack>
  );
}

export { IdentityEditorExport };
