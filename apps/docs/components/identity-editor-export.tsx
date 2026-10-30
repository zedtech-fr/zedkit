"use client";

import { useState } from "react";
import { Button, Field, FieldLabel, Stack, Text, Textarea, tokensToCss, type IdentityTokens } from "@zedtech/zedkit-ui";

function copyText(value: string, onDone: () => void) {
  const clipboard = navigator.clipboard;
  if (!clipboard) return;
  clipboard.writeText(value).then(onDone, () => {});
}

function IdentityEditorExport({ tokens }: { tokens: IdentityTokens }) {
  const css = tokensToCss(tokens, ":root");
  const json = JSON.stringify(tokens, null, 2);
  const [copied, setCopied] = useState<"css" | "json" | null>(null);

  function mark(kind: "css" | "json") {
    setCopied(kind);
  }

  return (
    <Stack gap={3} data-slot="identity-editor-export">
      <Field>
        <FieldLabel htmlFor="identity-editor-css">CSS</FieldLabel>
        <Textarea id="identity-editor-css" readOnly value={css} className="font-mono" />
      </Field>
      <Button type="button" variant="outline" onClick={() => copyText(css, () => mark("css"))}>
        Copy CSS
      </Button>
      <Field>
        <FieldLabel htmlFor="identity-editor-json">JSON</FieldLabel>
        <Textarea id="identity-editor-json" readOnly value={json} className="font-mono" />
      </Field>
      <Button type="button" variant="outline" onClick={() => copyText(json, () => mark("json"))}>
        Copy JSON
      </Button>
      {copied ? <Text role="status">Copied {copied === "css" ? "CSS" : "JSON"}.</Text> : null}
    </Stack>
  );
}

export { IdentityEditorExport };
