"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import {
  applyIdentityTokenSheet,
  Button,
  Field,
  FieldLabel,
  Heading,
  identityPresets,
  identities,
  Input,
  isPresetId,
  parseIdentityTokens,
  Stack,
  Text,
  type IdentityId,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";

import {
  LIGHT_KEYS,
  SCALAR_KEYS,
  parseIdentityEditorSearch,
  serializeIdentityEditorSearch,
} from "@/lib/identity-editor-search";

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
  accent: "Accent",
  border: "Border",
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
  useEffect(() => {
    setDraft(value);
  }, [value]);
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        value={draft}
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          onChange(next);
        }}
      />
    </Field>
  );
}

const LIGHT_KEY_SET = new Set<string>(LIGHT_KEYS);

function patchTokens(tokens: IdentityTokens, key: string, value: string): IdentityTokens {
  const next = LIGHT_KEY_SET.has(key)
    ? { ...tokens, light: { ...tokens.light, [key]: value } }
    : { ...tokens, [key]: value };
  const parsed = parseIdentityTokens(next);
  return parsed.success ? parsed.data : tokens;
}

function EditorToolbar({
  identity,
  onIdentity,
  onReset,
}: {
  identity: IdentityId;
  onIdentity: (id: IdentityId) => void;
  onReset: () => void;
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
      <Button type="button" variant="outline" onClick={onReset}>
        Reset
      </Button>
    </Stack>
  );
}

function EditorFields({
  tokens,
  onPatch,
}: {
  tokens: IdentityTokens;
  onPatch: (key: string, value: string) => void;
}) {
  return (
    <Stack gap={3}>
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
          value={tokens.light[key]}
          onChange={(value) => onPatch(key, value)}
        />
      ))}
    </Stack>
  );
}

function DraftCard() {
  return (
    <Stack
      data-identity-scope=""
      data-identity={DRAFT_ID}
      data-slot="identity-editor-preview"
      className="rounded-xl border border-border bg-background p-4 font-sans text-foreground shadow-md"
      gap={3}
    >
      <Heading level={3}>Draft look</Heading>
      <Text variant="muted">Spacing, type and colour follow the fields.</Text>
      <Button size="sm">Save</Button>
    </Stack>
  );
}

function IdentityEditorPanel() {
  const [identity, setIdentity] = useState<IdentityId>("mist");
  const [tokens, setTokens] = useState<IdentityTokens>(identityPresets.mist);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const parsed = parseIdentityEditorSearch(window.location.search);
    setIdentity(parsed.identity);
    setTokens(parsed.tokens);
    setReady(true);
  }, []);

  useLayoutEffect(() => {
    if (!ready) return;
    const sheet = applyIdentityTokenSheet(tokens, DRAFT_SELECTOR);
    const query = serializeIdentityEditorSearch(identity, tokens);
    window.history.replaceState(null, "", `${window.location.pathname}?${query}`);
    return () => {
      sheet.remove();
    };
  }, [identity, ready, tokens]);

  return (
    <Stack gap={6} data-slot="identity-editor">
      <EditorToolbar
        identity={identity}
        onIdentity={(id) => {
          setIdentity(id);
          setTokens(identityPresets[id]);
        }}
        onReset={() => setTokens(identityPresets[identity])}
      />
      <Text>Change spacing first, then watch the card.</Text>
      <EditorFields tokens={tokens} onPatch={(key, value) => setTokens((current) => patchTokens(current, key, value))} />
      <DraftCard />
    </Stack>
  );
}

export { IdentityEditorPanel };
