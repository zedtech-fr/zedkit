"use client";

import { useLayoutEffect, useState } from "react";

import { Button } from "#button.js";
import { Field, FieldLabel } from "#field.js";
import {
  applyIdentityTokenSheet,
  historyOf,
  historyPush,
  historyRedo,
  historyUndo,
  identityPresets,
  identityTokenSchema,
  isPresetId,
  suggestIdentityTokens,
  tokensToCss,
  type IdentityId,
  type IdentityTokens,
  type TokenHistory,
} from "#identity-tokens.js";
import { Input } from "#input.js";
import { Stack } from "#layout.js";
import { Textarea } from "#textarea.js";
import { Heading, Text } from "#typography.js";

const DRAFT_ID = "draft";
const DRAFT_SELECTOR = `[data-identity-scope][data-identity="${DRAFT_ID}"]`;
const PRESET_IDS: IdentityId[] = ["mist", "press", "tide", "volt", "maison", "glass"];

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
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}

function commitPatch(history: TokenHistory, key: keyof IdentityTokens, value: string): TokenHistory {
  const parsed = identityTokenSchema.safeParse({ ...history.present, [key]: value });
  return parsed.success ? historyPush(history, parsed.data) : history;
}

function EditorToolbar({
  presetId,
  history,
  onPreset,
  onUndo,
  onRedo,
  onReset,
}: {
  presetId: IdentityId;
  history: TokenHistory;
  onPreset: (id: IdentityId) => void;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
}) {
  return (
    <Stack direction="horizontal" gap={2}>
      <Field>
        <FieldLabel htmlFor="identity-preset">Preset</FieldLabel>
        <select
          id="identity-preset"
          className="h-control-height rounded-md border border-input bg-background px-3 text-control text-foreground focus-ring-control"
          value={presetId}
          onChange={(event) => {
            const id = event.target.value;
            if (isPresetId(id)) onPreset(id);
          }}
        >
          {PRESET_IDS.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </Field>
      <Button type="button" variant="outline" disabled={history.past.length === 0} onClick={onUndo}>
        Undo
      </Button>
      <Button type="button" variant="outline" disabled={history.future.length === 0} onClick={onRedo}>
        Redo
      </Button>
      <Button type="button" variant="outline" onClick={onReset}>
        Reset
      </Button>
    </Stack>
  );
}

function EditorControls({
  tokens,
  onPatch,
}: {
  tokens: IdentityTokens;
  onPatch: (key: keyof IdentityTokens, value: string) => void;
}) {
  return (
    <Stack gap={3}>
      <TokenField id="identity-spacing" label="Spacing" value={tokens.spacing} onChange={(value) => onPatch("spacing", value)} />
      <TokenField id="identity-border" label="Border width" value={tokens.borderWidth} onChange={(value) => onPatch("borderWidth", value)} />
      <TokenField id="identity-radius" label="Radius" value={tokens.radius} onChange={(value) => onPatch("radius", value)} />
      <TokenField id="identity-leading" label="Line height" value={tokens.bodyLeading} onChange={(value) => onPatch("bodyLeading", value)} />
      <TokenField id="identity-tracking" label="Letter spacing" value={tokens.headingTracking} onChange={(value) => onPatch("headingTracking", value)} />
      <TokenField id="identity-background" label="Background" value={tokens.background} onChange={(value) => onPatch("background", value)} />
      <TokenField id="identity-primary" label="Primary" value={tokens.primary} onChange={(value) => onPatch("primary", value)} />
      <TokenField id="identity-shadow" label="Shadow" value={tokens.shadowSm} onChange={(value) => onPatch("shadowSm", value)} />
      <TokenField id="identity-display" label="Display type" value={tokens.fontDisplay} onChange={(value) => onPatch("fontDisplay", value)} />
    </Stack>
  );
}

function EditorPrompt({
  prompt,
  onPrompt,
  onSuggest,
}: {
  prompt: string;
  onPrompt: (value: string) => void;
  onSuggest: () => void;
}) {
  return (
    <Stack gap={2}>
      <Field>
        <FieldLabel htmlFor="identity-prompt">Describe a look</FieldLabel>
        <Input id="identity-prompt" value={prompt} onChange={(event) => onPrompt(event.target.value)} />
      </Field>
      <Button type="button" onClick={onSuggest}>
        Suggest
      </Button>
    </Stack>
  );
}

function EditorExport({ tokens }: { tokens: IdentityTokens }) {
  return (
    <Stack gap={3}>
      <Field>
        <FieldLabel htmlFor="identity-export-css">CSS</FieldLabel>
        <Textarea id="identity-export-css" readOnly rows={8} value={tokensToCss(tokens, DRAFT_SELECTOR)} />
      </Field>
      <Field>
        <FieldLabel htmlFor="identity-export-json">JSON</FieldLabel>
        <Textarea id="identity-export-json" readOnly rows={8} value={JSON.stringify(tokens, null, 2)} />
      </Field>
    </Stack>
  );
}

function IdentityEditor() {
  const [presetId, setPresetId] = useState<IdentityId>("mist");
  const [prompt, setPrompt] = useState("calm editorial, rounded, warm");
  const [history, setHistory] = useState(() => historyOf(identityPresets.mist));
  const tokens = history.present;

  useLayoutEffect(() => {
    const sheet = applyIdentityTokenSheet(tokens, DRAFT_SELECTOR);
    return () => {
      sheet.remove();
    };
  }, [tokens]);

  return (
    <Stack gap={6} data-slot="identity-editor">
      <EditorToolbar
        presetId={presetId}
        history={history}
        onPreset={(id) => {
          setPresetId(id);
          setHistory((current) => historyPush(current, identityPresets[id]));
        }}
        onUndo={() => setHistory(historyUndo)}
        onRedo={() => setHistory(historyRedo)}
        onReset={() => setHistory(historyOf(identityPresets[presetId]))}
      />
      <EditorControls tokens={tokens} onPatch={(key, value) => setHistory((h) => commitPatch(h, key, value))} />
      <EditorPrompt
        prompt={prompt}
        onPrompt={setPrompt}
        onSuggest={() => setHistory((current) => historyPush(current, suggestIdentityTokens(prompt)))}
      />
      <div
        data-identity-scope=""
        data-identity={DRAFT_ID}
        data-slot="identity-editor-preview"
        className="rounded-xl border border-border bg-background p-4 font-sans text-foreground shadow-md"
      >
        <Heading level={3}>Draft look</Heading>
        <Text variant="muted">Spacing, type and colour follow the controls.</Text>
        <Button size="sm">Save</Button>
      </div>
      <EditorExport tokens={tokens} />
    </Stack>
  );
}

export { DRAFT_SELECTOR, IdentityEditor };
