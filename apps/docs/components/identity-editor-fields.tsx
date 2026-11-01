"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Badge,
  Button,
  Field,
  FieldLabel,
  Heading,
  Input,
  Stack,
  Text,
  identityContrastTokenLabel,
  type IdentityContrastWarning,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";

import { identityEditorCopy } from "@/components/i18n/identity-editor-copy";
import { LIGHT_KEYS, SCALAR_KEYS } from "@/lib/identity-editor-search";

const DRAFT_ID = "draft";
const DRAFT_SELECTOR = `[data-identity-scope][data-identity="${DRAFT_ID}"]`;

function TokenField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    // shortcut: 18rem clears the sticky draft and the docs header, raise it if the card grows.
    <Field className="scroll-mt-72">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          onChange(event.target.value);
        }}
      />
    </Field>
  );
}

function EditorFields({
  tokens,
  scheme,
  onPatch,
}: {
  tokens: IdentityTokens;
  scheme: "light" | "dark";
  onPatch: (key: string, value: string) => void;
}) {
  const pair = tokens[scheme];
  return (
    <Stack gap={5} data-slot="identity-editor-fields">
      {SCALAR_KEYS.map((key) => (
        <TokenField
          key={key}
          id={`identity-editor-${key}`}
          label={identityEditorCopy.fields.scalar[key]}
          value={tokens[key]}
          onChange={(value) => onPatch(key, value)}
        />
      ))}
      {LIGHT_KEYS.map((key) => (
        <TokenField
          key={key}
          id={`identity-editor-${key}`}
          label={identityEditorCopy.fields.light[key]}
          value={pair[key]}
          onChange={(value) => onPatch(key, value)}
        />
      ))}
    </Stack>
  );
}

function DraftCard({ darkPreview }: { darkPreview: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    ref.current?.classList.toggle("dark", darkPreview);
  }, [darkPreview]);
  return (
    <Stack
      ref={ref}
      data-identity-scope=""
      data-identity={DRAFT_ID}
      data-slot="identity-editor-preview"
      className="sticky top-14 z-20 rounded-xl border border-border bg-background p-4 font-sans text-foreground shadow-md"
      gap={3}
    >
      <Heading level={2}>{identityEditorCopy.fields.draftTitle}</Heading>
      <Text variant="muted">{identityEditorCopy.fields.draftBody}</Text>
      <Button size="sm">{identityEditorCopy.fields.draftSave}</Button>
    </Stack>
  );
}

function ContrastChips({
  warnings,
  onFix,
}: {
  warnings: IdentityContrastWarning[];
  onFix: (warning: IdentityContrastWarning) => void;
}) {
  if (warnings.length === 0) return null;
  return (
    <Stack gap={2} role="status">
      {warnings.map((warning) => {
        const label = identityContrastTokenLabel(warning.token);
        return (
          <Stack key={`${warning.scheme}-${warning.token}`} direction="horizontal" gap={2}>
            <Badge variant="warning">
              {identityEditorCopy.fields.contrastBadge(warning.scheme, label, warning.ratio, warning.min)}
            </Badge>
            <Button type="button" size="sm" variant="outline" onClick={() => onFix(warning)}>
              {identityEditorCopy.fields.fix(warning.scheme, label)}
            </Button>
          </Stack>
        );
      })}
    </Stack>
  );
}

export { ContrastChips, DRAFT_SELECTOR, DraftCard, EditorFields };
