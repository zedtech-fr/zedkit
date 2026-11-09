"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Field,
  FieldLabel,
  Heading,
  Input,
  Stack,
  Text,
  cn,
  identityContrastTokenLabel,
  type IdentityContrastWarning,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";

import { identityEditorCopy } from "@/components/i18n/identity-editor-copy";
import { LIGHT_KEYS, SCALAR_KEYS } from "@/lib/identity-editor-search";

const DRAFT_ID = "draft";
const DRAFT_SELECTOR = `[data-identity-scope][data-identity="${DRAFT_ID}"]`;

/** `H S% L%` triplets, the format the colour tokens use. */
const HSL_TRIPLET = /^\d+(?:\.\d+)?\s+\d+(?:\.\d+)?%\s+\d+(?:\.\d+)?%$/;

function TokenField({
  id,
  label,
  value,
  onChange,
  swatch,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  swatch?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const colour = swatch && HSL_TRIPLET.test(draft.trim()) ? `hsl(${draft.trim()})` : null;
  return (
    // shortcut: 7rem clears the docs header; the draft lives in its own column on desktop and is compact on a phone.
    <Field className="content-shrink">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Stack direction="horizontal" gap="sm" className="content-shrink">
        {swatch ? (
          <svg
            aria-hidden="true"
            data-token-swatch=""
            className="size-control-height shrink-0 rounded-md border border-border"
          >
            <rect width="100%" height="100%" fill={colour ?? "none"} />
          </svg>
        ) : null}
        <Input
          id={id}
          value={draft}
          className="content-shrink flex-1"
          data-editor-scroll=""
          onChange={(event) => {
            setDraft(event.target.value);
            onChange(event.target.value);
          }}
        />
      </Stack>
    </Field>
  );
}

function FieldGroup({ legend, className, children }: { legend: string; className?: string; children: ReactNode }) {
  return (
    <fieldset className={cn("trim-margin content-shrink flush", className)}>
      <legend className="mb-field-legend-bottom font-semibold text-foreground">{legend}</legend>
      <Stack className="grid content-shrink gap-stack-lg sm:grid-pair">{children}</Stack>
    </fieldset>
  );
}

const SHAPE_KEYS = ["spacing", "borderWidth", "radius"] as const;
const TYPE_KEYS = ["bodyLeading", "headingLeading", "headingTracking", "labelTracking"] as const;
const DEPTH_KEYS = ["shadowSm", "shadowMd"] as const;

function EditorFields({
  tokens,
  scheme,
  onPatch,
  afterShape,
}: {
  tokens: IdentityTokens;
  scheme: "light" | "dark";
  onPatch: (key: string, value: string) => void;
  /** Rendered right after the first group: what you do once the first adjustment has shown its effect. */
  afterShape?: ReactNode;
}) {
  const pair = tokens[scheme];
  const scalar = (keys: readonly (typeof SCALAR_KEYS)[number][]) =>
    keys.map((key) => (
      <TokenField
        key={key}
        id={`identity-editor-${key}`}
        label={identityEditorCopy.fields.scalar[key]}
        value={tokens[key]}
        onChange={(value) => onPatch(key, value)}
      />
    ));
  return (
    <Stack gap="prose" data-slot="identity-editor-fields">
      <FieldGroup legend={identityEditorCopy.fields.groups.shape}>{scalar(SHAPE_KEYS)}</FieldGroup>
      {afterShape}
      <FieldGroup legend={identityEditorCopy.fields.groups.type}>{scalar(TYPE_KEYS)}</FieldGroup>
      <FieldGroup legend={identityEditorCopy.fields.groups.depth}>{scalar(DEPTH_KEYS)}</FieldGroup>
      <FieldGroup legend={identityEditorCopy.fields.groups.colour(scheme)}>
        {LIGHT_KEYS.map((key) => (
          <TokenField
            key={key}
            id={`identity-editor-${key}`}
            label={identityEditorCopy.fields.light[key]}
            value={pair[key]}
            swatch
            onChange={(value) => onPatch(key, value)}
          />
        ))}
      </FieldGroup>
    </Stack>
  );
}

/** The specimen's content: samples of the look, never commands (the caller makes it `inert`). */
function SpecimenBody() {
  const copy = identityEditorCopy.fields.draft;
  return (
    <>
      <Stack direction="horizontal" gap="sm" className="justify-between">
        <Heading level={2} typeRole="band">
          {identityEditorCopy.fields.draftTitle}
        </Heading>
        <Badge variant="success">{copy.status}</Badge>
      </Stack>
      <Text variant="muted" typeRole="body" className="max-lg:hidden">
        {identityEditorCopy.fields.draftBody}
      </Text>
      <Stack direction="horizontal" gap="sm" data-draft-actions="" className="flex-wrap">
        <Button size="sm">{identityEditorCopy.fields.draftSave}</Button>
        <Button size="sm" variant="secondary">
          {copy.secondary}
        </Button>
        <Button size="sm" variant="outline" className="max-lg:hidden">
          {copy.outline}
        </Button>
        <Button size="sm" variant="outline" className="text-destructive max-lg:hidden">
          {copy.destructive}
        </Button>
      </Stack>
      <Field data-draft-field="">
        <FieldLabel htmlFor="identity-editor-sample">{copy.inputLabel}</FieldLabel>
        <Input id="identity-editor-sample" defaultValue={copy.inputValue} />
      </Field>
      <Stack gap="md" className="hidden lg:flex">
        <dl data-term-row="" className="trim-margin grid gap-x-stack-lg gap-y-stack-sm rounded-lg border border-border surface-pad-compact">
          {copy.rows.map(([term, detail]) => (
            <Fragment key={term}>
              <dt className="text-muted-foreground">{term}</dt>
              <dd className="trim-margin">{detail}</dd>
            </Fragment>
          ))}
        </dl>
        <Alert>
          <AlertTitle>{copy.alertTitle}</AlertTitle>
          <AlertDescription>{copy.alertBody}</AlertDescription>
        </Alert>
      </Stack>
    </>
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
      role="group"
      aria-label={identityEditorCopy.fields.specimenLabel}
      className="content-shrink rounded-xl border border-border bg-background surface-pad-md font-sans text-foreground shadow-md max-lg:gap-stack-sm max-lg:surface-pad-compact lg:sticky lg:top-editor lg:col-start-next lg:row-start-first lg:self-start lg:surface-pad-lg max-lg:[@media(min-height:48rem)]:sticky max-lg:[@media(min-height:48rem)]:top-bar"
      gap="md"
    >
      {/* `inert`: the specimen is for looking at. It must not read as, or act as, an editor command. */}
      <Stack gap="md" inert className="max-lg:gap-stack-sm">
        <SpecimenBody />
      </Stack>
      <Text variant="muted" typeRole="label" className="max-lg:hidden">
        {identityEditorCopy.fields.specimenNote}
      </Text>
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
    <Stack gap="sm" role="status">
      {warnings.map((warning) => {
        const label = identityContrastTokenLabel(warning.token);
        return (
          <Stack key={`${warning.scheme}-${warning.token}`} direction="horizontal" gap="sm">
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
