"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Button,
  Field,
  FieldLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Text,
  ThemeScope,
  identities,
  identityPresets,
} from "@zedtech/zedkit-ui";

import { IDENTITY_EDITOR_HREF } from "@/lib/site-links.mjs";
import {
  DEFAULT_REVIEW_APPEARANCE,
  REVIEW_IDENTITIES,
  compactPreviewSpacing,
  isReviewDensity,
  isReviewIdentity,
  parseReviewAppearance,
  serializeReviewAppearance,
  type ReviewAppearance,
} from "../model/review-appearance";
import { consoleAppearanceCopy, type ConsoleAppearanceCopy } from "../i18n/review-console-copy";
import { writeConsoleShareSearch } from "../model/live-console-href";
import { mergeReviewShareUrl } from "../model/selection";

const looks = identities.filter((item) =>
  (REVIEW_IDENTITIES as readonly string[]).includes(item.id),
);

function writeShareUrl(appearance: ReviewAppearance) {
  window.history.replaceState(
    null,
    "",
    mergeReviewShareUrl({
      pathname: window.location.pathname,
      search: writeConsoleShareSearch({
        appearanceSearch: serializeReviewAppearance(appearance),
        currentSearch: window.location.search,
        pathname: window.location.pathname,
        hash: window.location.hash,
      }),
      hash: window.location.hash,
    }),
  );
}

function IdentitySelect({
  id,
  copy,
  appearance,
  onChange,
  dense,
}: {
  id: string;
  copy: ConsoleAppearanceCopy;
  appearance: ReviewAppearance;
  onChange: (next: ReviewAppearance) => void;
  dense: boolean;
}) {
  return (
    <Field className={dense ? "w-look" : "w-full sm:w-look"}>
      <FieldLabel htmlFor={id}>{copy.identity}</FieldLabel>
      <Select
        value={appearance.identity}
        onValueChange={(identity) => {
          if (isReviewIdentity(identity)) onChange({ ...appearance, identity });
        }}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {looks.map((look) => (
            <SelectItem key={look.id} value={look.id}>
              {look.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function DensitySelect({
  id,
  copy,
  appearance,
  onChange,
  dense,
}: {
  id: string;
  copy: ConsoleAppearanceCopy;
  appearance: ReviewAppearance;
  onChange: (next: ReviewAppearance) => void;
  dense: boolean;
}) {
  return (
    <Field className={dense ? "w-look" : "w-full sm:w-look"}>
      <FieldLabel htmlFor={id}>{copy.density}</FieldLabel>
      <Select
        value={appearance.density}
        onValueChange={(density) => {
          if (isReviewDensity(density)) onChange({ ...appearance, density });
        }}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">{copy.densityDefault}</SelectItem>
          <SelectItem value="compact">{copy.densityCompact}</SelectItem>
        </SelectContent>
      </Select>
    </Field>
  );
}

function LookField({
  copy,
  appearance,
  onChange,
  dense,
}: {
  copy: ConsoleAppearanceCopy;
  appearance: ReviewAppearance;
  onChange: (next: ReviewAppearance) => void;
  dense: boolean;
}) {
  const identityId = useId();
  const densityId = useId();
  return (
    <Stack direction="horizontal" gap="sm" className="flex-wrap items-end">
      <IdentitySelect id={identityId} copy={copy} appearance={appearance} onChange={onChange} dense={dense} />
      <Button
        type="button"
        variant="outline"
        className="min-h-floor"
        aria-pressed={appearance.mode === "dark"}
        onClick={() => onChange({ ...appearance, mode: appearance.mode === "dark" ? "light" : "dark" })}
      >
        {copy.mode}
      </Button>
      <DensitySelect id={densityId} copy={copy} appearance={appearance} onChange={onChange} dense={dense} />
      <Button type="button" variant="outline" className="min-h-floor" onClick={() => onChange(DEFAULT_REVIEW_APPEARANCE)}>
        {copy.reset}
      </Button>
      <Button asChild variant="link">
        <Link href={`${IDENTITY_EDITOR_HREF}?identity=${appearance.identity}`}>{copy.advanced}</Link>
      </Button>
    </Stack>
  );
}

function ReviewConsoleAppearancePanel({
  copy,
  appearance,
  onChange,
  dense,
}: {
  copy: ConsoleAppearanceCopy;
  appearance: ReviewAppearance;
  onChange: (next: ReviewAppearance) => void;
  dense?: boolean;
}) {
  return (
    <Stack gap="sm" role="group" aria-label={copy.legend}>
      {dense ? null : (
        <Text variant="muted" typeRole="label">
          {copy.hint}
        </Text>
      )}
      <LookField copy={copy} appearance={appearance} onChange={onChange} dense={dense === true} />
    </Stack>
  );
}

function useReviewAppearance() {
  const scopeRef = useRef<HTMLDivElement>(null);
  const [appearance, setAppearance] = useState(DEFAULT_REVIEW_APPEARANCE);
  useEffect(() => {
    setAppearance(parseReviewAppearance(window.location.search));
  }, []);
  const compact =
    appearance.density === "compact"
      ? compactPreviewSpacing(identityPresets[appearance.identity].spacing)
      : undefined;
  useEffect(() => {
    const node = scopeRef.current;
    if (!node) return;
    if (compact) node.style.setProperty("--spacing", compact);
    else node.style.removeProperty("--spacing");
  }, [compact]);

  function onChange(next: ReviewAppearance) {
    setAppearance(next);
    writeShareUrl(next);
  }

  return { scopeRef, appearance, onChange };
}

export function ReviewConsoleAppearanceFrame({ children }: { children: (panel: ReactNode) => ReactNode }) {
  const { scopeRef, appearance, onChange } = useReviewAppearance();
  const panel = (
    <ReviewConsoleAppearancePanel
      copy={consoleAppearanceCopy}
      appearance={appearance}
      onChange={onChange}
      dense
    />
  );

  return (
    <ThemeScope
      ref={scopeRef}
      identity={appearance.identity}
      mode={appearance.mode}
      data-review-console=""
      className="flex h-svh pane-shrink flex-col overflow-hidden bg-background text-foreground"
    >
      {children(panel)}
    </ThemeScope>
  );
}
