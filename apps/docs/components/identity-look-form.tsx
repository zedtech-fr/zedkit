"use client";

import { type ReactNode } from "react";
import {
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Stack,
  Tabs,
  Text,
  TabsContent,
  TabsList,
  TabsTrigger,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";

import { identityEditorCopy } from "@/components/i18n/identity-editor-copy";
import { EditorFields } from "@/components/identity-editor-fields";
import {
  RADIUS_MAX,
  RADIUS_MIN,
  SPACING_MAX,
  SPACING_MIN,
  clampedCssLengthRem,
  colorInputHex,
  formatCssLengthRem,
  hexToHslTriplet,
} from "@/lib/identity-simple-value";

const SIMPLE_COLORS = ["background", "foreground", "primary", "primaryForeground", "accent", "border", "mutedForeground"] as const;

function ColorInput({
  tokenKey,
  value,
  scheme,
  idPrefix,
  onPatch,
}: {
  tokenKey: (typeof SIMPLE_COLORS)[number];
  value: string;
  scheme: "light" | "dark";
  idPrefix: string;
  onPatch: (key: string, value: string, palette?: "light" | "dark") => void;
}) {
  const id = `${idPrefix}-simple-${tokenKey}`;
  const hex = colorInputHex(value);
  return (
    <Field orientation="horizontal" className="content-shrink items-center justify-between">
      <FieldLabel htmlFor={id}>{identityEditorCopy.simple[tokenKey]}</FieldLabel>
      <input
        id={id}
        type="color"
        value={hex}
        className="size-control-height shrink-0 cursor-pointer rounded-md border border-input bg-transparent focus-ring-control"
        onChange={(event) => {
          const hsl = hexToHslTriplet(event.target.value);
          if (hsl) onPatch(tokenKey, hsl, scheme);
        }}
      />
    </Field>
  );
}

function RangeInput({
  tokenKey,
  label,
  value,
  min,
  max,
  zeroAsPx,
  idPrefix,
  onPatch,
}: {
  tokenKey: "radius" | "spacing";
  label: string;
  value: string;
  min: number;
  max: number;
  zeroAsPx?: boolean;
  idPrefix: string;
  onPatch: (key: string, value: string, palette?: "light" | "dark") => void;
}) {
  const id = `${idPrefix}-simple-${tokenKey}`;
  const shown = clampedCssLengthRem(value, min, max);
  return (
    <Field className="content-shrink">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={0.01}
        value={shown}
        aria-valuetext={formatCssLengthRem(shown, zeroAsPx ? { zeroAsPx: true } : {})}
        className="h-control-height min-h-target w-full cursor-pointer rounded-md border border-input bg-transparent focus-ring-control"
        onChange={(event) => {
          const next = Number(event.target.value);
          if (!Number.isFinite(next)) return;
          onPatch(tokenKey, formatCssLengthRem(next, zeroAsPx ? { zeroAsPx: true } : {}));
        }}
      />
    </Field>
  );
}

function SimpleFields({
  tokens,
  scheme,
  idPrefix,
  onPatch,
}: {
  tokens: IdentityTokens;
  scheme: "light" | "dark";
  idPrefix: string;
  onPatch: (key: string, value: string, palette?: "light" | "dark") => void;
}) {
  const copy = identityEditorCopy.simple;
  return (
    <Stack gap="md" className="text-dense">
      <FieldSet>
        <FieldLegend>{copy.palette}</FieldLegend>
        <Text variant="muted" typeRole="label">
          {copy.paletteHint}
        </Text>
        <Stack className="grid content-shrink gap-stack-lg sm:grid-pair">
          {SIMPLE_COLORS.map((key) => (
            <ColorInput
              key={key}
              tokenKey={key}
              value={tokens[scheme][key]}
              scheme={scheme}
              idPrefix={idPrefix}
              onPatch={onPatch}
            />
          ))}
        </Stack>
      </FieldSet>
      <Stack className="grid content-shrink gap-stack-lg sm:grid-pair">
        <RangeInput
          tokenKey="radius"
          label={copy.radius}
          value={tokens.radius}
          min={RADIUS_MIN}
          max={RADIUS_MAX}
          zeroAsPx
          idPrefix={idPrefix}
          onPatch={onPatch}
        />
        <RangeInput
          tokenKey="spacing"
          label={copy.spacing}
          value={tokens.spacing}
          min={SPACING_MIN}
          max={SPACING_MAX}
          idPrefix={idPrefix}
          onPatch={onPatch}
        />
      </Stack>
    </Stack>
  );
}

function IdentityLookForm({
  tokens,
  scheme,
  defaultMode,
  onPatch,
  afterForm,
  afterShape,
  idPrefix = "identity-editor",
  stickyTabs = false,
}: {
  tokens: IdentityTokens;
  scheme: "light" | "dark";
  defaultMode: "simple" | "expert";
  onPatch: (key: string, value: string, palette?: "light" | "dark") => void;
  afterForm?: ReactNode;
  afterShape?: ReactNode;
  /** Field ids are prefixed per host so the dock and the editor page never share an id. */
  idPrefix?: string;
  /** Keep the Classic/Expert tabs pinned while the host scrolls (dock drawer). */
  stickyTabs?: boolean;
}) {
  const copy = identityEditorCopy.modes;
  return (
    <Stack gap="md">
      <Tabs defaultValue={defaultMode}>
        <TabsList aria-label={copy.label} className={stickyTabs ? "sticky pin-top z-header" : undefined}>
          <TabsTrigger value="simple">{copy.simple}</TabsTrigger>
          <TabsTrigger value="expert">{copy.expert}</TabsTrigger>
        </TabsList>
        <TabsContent value="simple">
          <SimpleFields tokens={tokens} scheme={scheme} idPrefix={idPrefix} onPatch={onPatch} />
        </TabsContent>
        <TabsContent value="expert">
          <EditorFields tokens={tokens} scheme={scheme} idPrefix={idPrefix} onPatch={onPatch} afterShape={afterShape} />
        </TabsContent>
      </Tabs>
      {afterForm}
    </Stack>
  );
}

export { IdentityLookForm };
