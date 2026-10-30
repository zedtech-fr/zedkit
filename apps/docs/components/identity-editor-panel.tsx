"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  applyIdentityTokenSheet,
  Badge,
  Button,
  Field,
  FieldLabel,
  Heading,
  identityContrastWarnings,
  identityPresets,
  Input,
  Stack,
  Text,
  type IdentityContrastWarning,
  type IdentityId,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";

import { IdentityEditorExport } from "@/components/identity-editor-export";
import { IdentityEditorSuggest } from "@/components/identity-editor-suggest";
import { IdentityEditorToolbar } from "@/components/identity-editor-toolbar";
import { useDraftTokens } from "@/lib/identity-editor-draft";
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
  useEffect(() => setDraft(value), [value]);
  return (
    <Field>
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
      className="rounded-xl border border-border bg-background p-4 font-sans text-foreground shadow-md"
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
        const label = warning.token === "foreground" ? "text" : warning.token;
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

function IdentityEditorBody({
  identity,
  tokens,
  darkPreview,
  onIdentity,
  onDark,
  onReset,
  onPatch,
  onFix,
  onSuggestApply,
  onUndo,
  onApplySite,
  canUndo,
  appliedSite,
}: {
  identity: IdentityId;
  tokens: IdentityTokens;
  darkPreview: boolean;
  onIdentity: (id: IdentityId) => void;
  onDark: () => void;
  onReset: () => void;
  onPatch: (key: string, value: string) => void;
  onFix: (warning: IdentityContrastWarning) => void;
  onSuggestApply: (next: IdentityTokens, toSite: boolean) => void;
  onUndo: () => void;
  onApplySite: () => void;
  canUndo: boolean;
  appliedSite: boolean;
}) {
  return (
    <Stack gap={6} data-slot="identity-editor">
      <IdentityEditorToolbar
        identity={identity}
        darkPreview={darkPreview}
        canUndo={canUndo}
        onIdentity={onIdentity}
        onDark={onDark}
        onUndo={onUndo}
        onReset={onReset}
        onApplySite={onApplySite}
      />
      <Text>Change spacing first, then watch the card.</Text>
      {appliedSite ? <Text role="status">Applied to the whole site.</Text> : null}
      <ContrastChips warnings={identityContrastWarnings(tokens)} onFix={onFix} />
      <IdentityEditorSuggest tokens={tokens} onApply={onSuggestApply} />
      <EditorFields tokens={tokens} scheme={darkPreview ? "dark" : "light"} onPatch={onPatch} />
      <DraftCard darkPreview={darkPreview} />
      <IdentityEditorExport tokens={tokens} />
    </Stack>
  );
}

function IdentityEditorPanel() {
  const [identity, setIdentity] = useState<IdentityId>("mist");
  const draft = useDraftTokens(identityPresets.mist, identity);
  const [darkPreview, setDarkPreview] = useState(false);
  const [ready, setReady] = useState(false);
  const { setTheme } = useTheme();
  const scheme = darkPreview ? "dark" : "light";
  const { tokens, remember, undo, applySite, appliedSite, past, clearDarkKept, patch, fix, applySuggest } = draft;

  function setDark(next: boolean) {
    setDarkPreview(next);
    setTheme(next ? "dark" : "light");
  }

  useLayoutEffect(() => {
    const parsed = parseIdentityEditorSearch(window.location.search);
    setIdentity(parsed.identity);
    draft.setTokens(parsed.tokens);
    if (parsed.darkPreview) setDark(true);
    setReady(true);
  }, []);

  useLayoutEffect(() => {
    if (!ready) return;
    const sheet = applyIdentityTokenSheet(tokens, DRAFT_SELECTOR);
    const query = serializeIdentityEditorSearch(identity, tokens, darkPreview);
    window.history.replaceState(null, "", `${window.location.pathname}?${query}`);
    return () => {
      sheet.remove();
    };
  }, [darkPreview, identity, ready, tokens]);

  return (
    <IdentityEditorBody
      identity={identity}
      tokens={tokens}
      darkPreview={darkPreview}
      onIdentity={(id) => {
        setIdentity(id);
        clearDarkKept();
        remember(identityPresets[id]);
      }}
      onDark={() => setDark(!darkPreview)}
      onReset={() => {
        clearDarkKept();
        remember(identityPresets[identity]);
      }}
      onPatch={(key, value) => patch(key, value, scheme)}
      onFix={fix}
      onSuggestApply={applySuggest}
      onUndo={undo}
      onApplySite={applySite}
      canUndo={past.length > 0}
      appliedSite={appliedSite}
    />
  );
}

export { IdentityEditorPanel };
