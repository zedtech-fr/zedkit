"use client";

import { type ReactNode } from "react";
import {
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Text,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";

import { identityEditorCopy } from "@/components/i18n/identity-editor-copy";
import { DEPTH_OPTIONS, FONT_PAIRS, depthId, fontPairId, parsePx } from "@/lib/identity-classic-options";
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

const COLOR_GROUPS = [
  ["surface", ["background", "foreground", "mutedForeground"]],
  ["brand", ["primary", "primaryForeground", "accent"]],
  ["lines", ["border"]],
] as const;

type ColorKey = (typeof COLOR_GROUPS)[number][1][number];
type Patch = (key: string, value: string, palette?: "light" | "dark") => void;
/** Several tokens as one edit: two `Patch` calls in a row would each start from the same stale draft. */
export type PatchMany = (entries: readonly (readonly [string, string])[]) => void;

/** The whole row is one label: the name, the hex and the swatch read as one control. */
function ColorInput({
  tokenKey,
  value,
  scheme,
  idPrefix,
  onPatch,
}: {
  tokenKey: ColorKey;
  value: string;
  scheme: "light" | "dark";
  idPrefix: string;
  onPatch: Patch;
}) {
  const id = `${idPrefix}-simple-${tokenKey}`;
  const hex = colorInputHex(value);
  return (
    <label
      htmlFor={id}
      className="flex min-h-target cursor-pointer items-center gap-stack-sm rounded-md bg-muted px-field-pad focus-within:ring-2 focus-within:ring-ring hover:bg-accent/10"
    >
      <input
        id={id}
        type="color"
        value={hex}
        className="size-control-height shrink-0 cursor-pointer appearance-none rounded-full border-0 bg-transparent flush ring-1 ring-border focus-ring-control [&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:flush"
        onChange={(event) => {
          const hsl = hexToHslTriplet(event.target.value);
          if (hsl) onPatch(tokenKey, hsl, scheme);
        }}
      />
      <Text typeRole="label" className="flex-1 font-medium text-foreground">
        {identityEditorCopy.simple[tokenKey]}
      </Text>
      <Text variant="muted" typeRole="label" className="font-mono uppercase">
        {hex}
      </Text>
    </label>
  );
}

function RangeInput({
  id,
  label,
  value,
  min,
  max,
  step,
  format,
  onValue,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onValue: (value: number) => void;
}) {
  return (
    <Field className="content-shrink">
      <Stack direction="horizontal" gap="sm" className="justify-between">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <Text variant="muted" typeRole="label" className="font-mono">
          {format(value)}
        </Text>
      </Stack>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={format(value)}
        className="min-h-target w-full cursor-pointer accent-primary focus-ring-control"
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isFinite(next)) onValue(next);
        }}
      />
    </Field>
  );
}

function ChoiceSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: readonly { value: string; label: string; disabled?: boolean }[];
  onChange: (value: string) => void;
}) {
  return (
    <Field className="content-shrink">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function SimpleGroup({ legend, hint, children }: { legend: string; hint?: string; children: ReactNode }) {
  return (
    <FieldSet className="content-shrink">
      <FieldLegend className="font-semibold text-foreground">{legend}</FieldLegend>
      {hint ? (
        <Text variant="muted" typeRole="label">
          {hint}
        </Text>
      ) : null}
      <Stack className="grid content-shrink gap-stack-lg sm:grid-pair">{children}</Stack>
    </FieldSet>
  );
}

type SimpleProps = {
  tokens: IdentityTokens;
  scheme: "light" | "dark";
  idPrefix: string;
  onPatch: Patch;
  onPatchMany: PatchMany;
};

function ColourSection({ tokens, scheme, idPrefix, onPatch }: Pick<SimpleProps, "tokens" | "scheme" | "idPrefix" | "onPatch">) {
  const copy = identityEditorCopy.simple;
  return (
    <SimpleGroup legend={copy.palette} hint={copy.paletteHint}>
      <Stack gap="md" className="sm:col-span-full">
        {COLOR_GROUPS.map(([group, keys]) => (
          <Stack key={group} gap="sm" role="group" aria-label={copy.groups[group]}>
            <Text typeRole="label" variant="muted">
              {copy.groups[group]}
            </Text>
            <Stack className="grid content-shrink gap-stack-sm sm:grid-pair">
              {keys.map((key) => (
                <ColorInput key={key} tokenKey={key} value={tokens[scheme][key]} scheme={scheme} idPrefix={idPrefix} onPatch={onPatch} />
              ))}
            </Stack>
          </Stack>
        ))}
      </Stack>
    </SimpleGroup>
  );
}

function ShapeSection({ tokens, idPrefix, onPatch }: Pick<SimpleProps, "tokens" | "idPrefix" | "onPatch">) {
  const copy = identityEditorCopy.simple;
  const rem = (key: "radius" | "spacing", min: number, max: number, zeroAsPx: boolean) => {
    const format = (n: number) => formatCssLengthRem(n, zeroAsPx ? { zeroAsPx: true } : {});
    return {
      id: `${idPrefix}-simple-${key}`,
      label: copy[key],
      value: clampedCssLengthRem(tokens[key], min, max),
      min,
      max,
      step: 0.01,
      format,
      onValue: (n: number) => onPatch(key, format(n)),
    };
  };
  return (
    <SimpleGroup legend={copy.groups.shape}>
      <RangeInput {...rem("radius", RADIUS_MIN, RADIUS_MAX, true)} />
      <RangeInput {...rem("spacing", SPACING_MIN, SPACING_MAX, false)} />
      <RangeInput
        id={`${idPrefix}-simple-borderWidth`}
        label={copy.borderWidth}
        value={parsePx(tokens.borderWidth, 0, 3)}
        min={0}
        max={3}
        step={0.25}
        format={(n) => `${n}px`}
        onValue={(n) => onPatch("borderWidth", `${n}px`)}
      />
    </SimpleGroup>
  );
}

function TypeSection({ tokens, idPrefix, onPatch, onPatchMany }: Pick<SimpleProps, "tokens" | "idPrefix" | "onPatch" | "onPatchMany">) {
  const copy = identityEditorCopy.simple;
  const current = fontPairId(tokens);
  return (
    <SimpleGroup legend={copy.groups.type}>
      <ChoiceSelect
        id={`${idPrefix}-simple-fontPair`}
        label={copy.fontPair}
        value={current}
        options={[
          ...FONT_PAIRS.map((pair) => ({ value: pair.id, label: pair.label })),
          ...(current === "custom" ? [{ value: "custom", label: copy.fontCustom, disabled: true }] : []),
        ]}
        onChange={(id) => {
          const pair = FONT_PAIRS.find((item) => item.id === id);
          if (pair) {
            onPatchMany([
              ["fontSans", pair.fontSans],
              ["fontDisplay", pair.fontDisplay],
            ]);
          }
        }}
      />
      <RangeInput
        id={`${idPrefix}-simple-bodyLeading`}
        label={copy.bodyLeading}
        value={Math.min(1.9, Math.max(1.2, Number(tokens.bodyLeading) || 1.55))}
        min={1.2}
        max={1.9}
        step={0.05}
        format={(n) => n.toFixed(2)}
        onValue={(n) => onPatch("bodyLeading", String(Math.round(n * 100) / 100))}
      />
    </SimpleGroup>
  );
}

function DepthSection({ tokens, idPrefix, onPatchMany }: Pick<SimpleProps, "tokens" | "idPrefix" | "onPatchMany">) {
  const copy = identityEditorCopy.simple;
  const current = depthId(tokens);
  return (
    <SimpleGroup legend={copy.groups.depth}>
      <ChoiceSelect
        id={`${idPrefix}-simple-depth`}
        label={copy.depth}
        value={current}
        options={[
          ...DEPTH_OPTIONS.map((option) => ({ value: option.id, label: copy.depthOptions[option.id] })),
          ...(current === "custom" ? [{ value: "custom", label: copy.depthCustom, disabled: true }] : []),
        ]}
        onChange={(id) => {
          const option = DEPTH_OPTIONS.find((item) => item.id === id);
          if (option) {
            onPatchMany([
              ["shadowSm", option.shadowSm],
              ["shadowMd", option.shadowMd],
            ]);
          }
        }}
      />
    </SimpleGroup>
  );
}

function SimpleFields(props: SimpleProps) {
  return (
    <Stack gap="md" className="text-dense">
      <ColourSection {...props} />
      <ShapeSection {...props} />
      <TypeSection {...props} />
      <DepthSection {...props} />
    </Stack>
  );
}

export { SimpleFields };
