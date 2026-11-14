"use client";

import { useId } from "react";
import {
  Field,
  FieldLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Text,
  identities,
  isPresetId,
  useIdentity,
} from "@zedtech/zedkit-ui";

import { identityDockCopy as copy } from "@/features/identity/dock/i18n/identity-dock-copy";
import { DEFAULT_IDENTITY } from "@/lib/default-identity";

const CUSTOM_PLACEHOLDER = "__custom__";

/**
 * The kit looks as ready-made starting points ("don't start from zero"):
 * one compact select plus a one-line description. Picking a preset applies it
 * to the page at once; customize below then starts from that look. When the
 * site is on a fine-tuned recipe, the select shows a fine-tuned placeholder
 * until a stock look is picked again.
 */
function IdentityDockStartingPoints(props: { onPick: (id: string) => void }) {
  const controlId = useId();
  const current = useIdentity(DEFAULT_IDENTITY);
  const selectValue = isPresetId(current) ? current : CUSTOM_PLACEHOLDER;
  const active = identities.find((option) => option.id === current);

  return (
    <Stack gap="sm" data-dock-starting-points="" className="shrink-0 bg-background">
      <Stack gap="tight">
        <Text typeRole="label" className="font-medium text-foreground">
          {copy.startingPointsTitle}
        </Text>
        <Text variant="muted" typeRole="label">
          {copy.startingPointsHint}
        </Text>
      </Stack>
      <Field>
        <FieldLabel htmlFor={controlId}>{copy.startingPointsLabel}</FieldLabel>
        <Select
          value={selectValue}
          onValueChange={(value) => {
            if (value !== CUSTOM_PLACEHOLDER) props.onPick(value);
          }}
        >
          <SelectTrigger id={controlId} data-dock-starting-look="" className="min-h-overlay-touch-target w-full" aria-label={copy.startingPointsLabel}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {selectValue === CUSTOM_PLACEHOLDER ? (
              <SelectItem value={CUSTOM_PLACEHOLDER} disabled>
                {copy.startingPointsCustom}
              </SelectItem>
            ) : null}
            {identities.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
                {option.id === DEFAULT_IDENTITY ? ` ${copy.defaultNote}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Text variant="muted" typeRole="label">
        {active?.description ?? copy.startingPointsCustomHint}
      </Text>
    </Stack>
  );
}

export { IdentityDockStartingPoints };