"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Button,
  Container,
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
} from "@/lib/review-appearance";
import type { ReviewsCopy } from "../i18n/reviews-copy";
import { mergeReviewShareUrl } from "../model/selection";

const looks = identities.filter((item) =>
  (REVIEW_IDENTITIES as readonly string[]).includes(item.id),
);

function writeShareUrl(appearance: ReviewAppearance) {
  const query = serializeReviewAppearance(appearance);
  window.history.replaceState(
    null,
    "",
    mergeReviewShareUrl({
      pathname: window.location.pathname,
      search: query,
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
  copy: ReviewsCopy["appearance"];
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
  copy: ReviewsCopy["appearance"];
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
  copy: ReviewsCopy["appearance"];
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
        aria-pressed={appearance.mode === "dark"}
        onClick={() => onChange({ ...appearance, mode: appearance.mode === "dark" ? "light" : "dark" })}
      >
        {copy.mode}
      </Button>
      <DensitySelect id={densityId} copy={copy} appearance={appearance} onChange={onChange} dense={dense} />
      <Button type="button" variant="outline" onClick={() => onChange(DEFAULT_REVIEW_APPEARANCE)}>
        {copy.reset}
      </Button>
      <Button asChild variant="link">
        <Link href={`${IDENTITY_EDITOR_HREF}?identity=${appearance.identity}`}>{copy.advanced}</Link>
      </Button>
    </Stack>
  );
}

export function ReviewAppearancePanel({
  copy,
  appearance,
  onChange,
  dense,
}: {
  copy: ReviewsCopy["appearance"];
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

export function ReviewAppearanceFrame({ children }: { children: ReactNode }) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  useEffect(() => {
    setSearch(window.location.search);
  }, []);
  const appearance = parseReviewAppearance(search);
  const pin = hasReviewAppearanceQuery(search);
  const tokens = identityPresets[appearance.identity] ?? identityPresets.glass;
  const compact =
    appearance.density === "compact" ? compactPreviewSpacing(tokens.spacing) : undefined;
  useEffect(() => {
    const node = scopeRef.current;
    if (!node) return;
    if (compact) node.style.setProperty("--spacing", compact);
    else node.style.removeProperty("--spacing");
  }, [compact]);

  return (
    <ThemeScope
      ref={scopeRef}
      identity={pin ? appearance.identity : undefined}
      mode={pin ? appearance.mode : undefined}
      className="bg-background text-foreground"
    >
      <Container width="wide" className="py-section-sm">
        <Stack gap="lg">{children}</Stack>
      </Container>
    </ThemeScope>
  );
}

export function ReviewConsoleAppearanceFrame({
  copy,
  children,
}: {
  copy: ReviewsCopy;
  children: (panel: ReactNode) => ReactNode;
}) {
  const { scopeRef, appearance, onChange } = useReviewAppearance();
  const panel = (
    <ReviewAppearancePanel copy={copy.appearance} appearance={appearance} onChange={onChange} dense />
  );

  return (
    <ThemeScope
      ref={scopeRef}
      identity={appearance.identity}
      mode={appearance.mode}
      className="flex h-svh flex-col overflow-hidden bg-background text-foreground"
    >
      {children(panel)}
    </ThemeScope>
  );
}
