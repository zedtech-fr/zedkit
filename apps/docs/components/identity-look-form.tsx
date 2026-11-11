"use client";

import { type ReactNode } from "react";
import {
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Stack,
  Tabs,
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
  formatCssLengthRem,
  hexToHslTriplet,
  hslTripletToHex,
  parseCssLengthRem,
} from "@/lib/identity-simple-value";

const SIMPLE_COLORS = ["background", "foreground", "primary", "accent"] as const;

function ColorInput({
  tokenKey,
  value,
  onPatch,
}: {
  tokenKey: (typeof SIMPLE_COLORS)[number];
  value: string;
  onPatch: (key: string, value: string, palette?: "light" | "dark") => void;
}) {
  const id = `identity-editor-simple-${tokenKey}`;
  const hex = hslTripletToHex(value) ?? "#000000";
  return (
    <Field className="content-shrink">
      <FieldLabel htmlFor={id}>{identityEditorCopy.simple[tokenKey]}</FieldLabel>
      <input
        id={id}
        type="color"
        value={hex}
        className="h-control-height min-h-target w-full min-w-target cursor-pointer rounded-md border border-input bg-transparent focus-ring-control"
        onChange={(event) => {
          const hsl = hexToHslTriplet(event.target.value);
          if (hsl) onPatch(tokenKey, hsl, "light");
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
  onPatch,
}: {
  tokenKey: "radius" | "spacing";
  label: string;
  value: string;
  min: number;
  max: number;
  zeroAsPx?: boolean;
  onPatch: (key: string, value: string, palette?: "light" | "dark") => void;
}) {
  const id = `identity-editor-simple-${tokenKey}`;
  const parsed = parseCssLengthRem(value);
  const shown = parsed === undefined ? min : Math.min(max, Math.max(min, parsed));
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
  onPatch,
}: {
  tokens: IdentityTokens;
  onPatch: (key: string, value: string, palette?: "light" | "dark") => void;
}) {
  const copy = identityEditorCopy.simple;
  return (
    <Stack gap="md" className="text-dense">
      <FieldSet>
        <FieldLegend>{copy.palette}</FieldLegend>
        <Stack className="grid content-shrink gap-stack-lg sm:grid-pair">
          {SIMPLE_COLORS.map((key) => (
            <ColorInput key={key} tokenKey={key} value={tokens.light[key]} onPatch={onPatch} />
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
          onPatch={onPatch}
        />
        <RangeInput
          tokenKey="spacing"
          label={copy.spacing}
          value={tokens.spacing}
          min={SPACING_MIN}
          max={SPACING_MAX}
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
  afterSimple,
  afterShape,
}: {
  tokens: IdentityTokens;
  scheme: "light" | "dark";
  defaultMode: "simple" | "expert";
  onPatch: (key: string, value: string, palette?: "light" | "dark") => void;
  afterSimple?: ReactNode;
  afterShape?: ReactNode;
}) {
  const copy = identityEditorCopy.modes;
  return (
    <Stack gap="md">
      <Tabs defaultValue={defaultMode}>
        <TabsList>
          <TabsTrigger value="simple">{copy.simple}</TabsTrigger>
          <TabsTrigger value="expert">{copy.expert}</TabsTrigger>
        </TabsList>
        <TabsContent value="simple">
          <SimpleFields tokens={tokens} onPatch={onPatch} />
        </TabsContent>
        <TabsContent value="expert">
          <EditorFields tokens={tokens} scheme={scheme} onPatch={onPatch} afterShape={afterShape} />
        </TabsContent>
      </Tabs>
      {afterSimple}
    </Stack>
  );
}

export { IdentityLookForm };
