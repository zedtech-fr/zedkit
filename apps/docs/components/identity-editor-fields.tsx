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

import { LIGHT_KEYS, SCALAR_KEYS } from "@/lib/identity-editor-search";

const DRAFT_ID = "draft";
const DRAFT_SELECTOR = `[data-identity-scope][data-identity="${DRAFT_ID}"]`;

const SCALAR_LABELS: Record<(typeof SCALAR_KEYS)[number], string> = {
  spacing: "Spacing",
  borderWidth: "Border width",
  radius: "Radius",
  bodyLeading: "Line height",
  headingLeading: "Heading line height",
  headingTracking: "Letter spacing",
  labelTracking: "Label spacing",
  shadowSm: "Shadow",
  shadowMd: "Large shadow",
};

const LIGHT_LABELS: Record<(typeof LIGHT_KEYS)[number], string> = {
  background: "Background",
  foreground: "Foreground",
  primary: "Primary",
  primaryForeground: "Primary text",
  accent: "Accent",
  border: "Border",
  mutedForeground: "Muted text",
};

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
          label={SCALAR_LABELS[key]}
          value={tokens[key]}
          onChange={(value) => onPatch(key, value)}
        />
      ))}
      {LIGHT_KEYS.map((key) => (
        <TokenField
          key={key}
          id={`identity-editor-${key}`}
          label={LIGHT_LABELS[key]}
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
      <Heading level={3}>Draft look</Heading>
      <Text variant="muted">Spacing, type and colour follow the fields.</Text>
      <Button size="sm">Save</Button>
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
              {warning.scheme} {label} {warning.ratio}:1 (need {warning.min}:1)
            </Badge>
            <Button type="button" size="sm" variant="outline" onClick={() => onFix(warning)}>
              {`Fix ${warning.scheme} ${label}`}
            </Button>
          </Stack>
        );
      })}
    </Stack>
  );
}

export { ContrastChips, DRAFT_SELECTOR, DraftCard, EditorFields };
