"use client";

import { useId } from "react";
import { OptionCard, Stack, Text, identities, useIdentity, type IdentityOption } from "@zedtech/zedkit-ui";

import { identityDockCopy as copy } from "@/features/identity/dock/i18n/identity-dock-copy";
import { DEFAULT_IDENTITY } from "@/lib/default-identity";

/** A kit look name, with the site default (the Reset target) marked. */
function StartingPointTitle({ option }: { option: IdentityOption }) {
  return (
    <>
      {option.label}
      {option.id === DEFAULT_IDENTITY ? (
        <span className="ml-note font-normal text-muted-foreground">{copy.defaultNote}</span>
      ) : null}
    </>
  );
}

/**
 * The kit looks as ready-made starting points ("don't start from zero"):
 * native radio cards in one group. Picking one applies it to the page at
 * once; the customize form below then starts from the picked look. Nothing
 * is checked while a custom or named look is active.
 */
function IdentityDockStartingPoints(props: { onPick: (id: string) => void }) {
  const name = useId();
  const current = useIdentity(DEFAULT_IDENTITY);
  return (
    <Stack gap="sm" data-dock-starting-points="">
      <Stack gap="tight">
        <Text typeRole="label" className="font-medium text-foreground">
          {copy.startingPointsTitle}
        </Text>
        <Text variant="muted" typeRole="label">
          {copy.startingPointsHint}
        </Text>
      </Stack>
      <Stack gap="sm" role="radiogroup" aria-label={copy.startingPointsLabel}>
        {identities.map((option) => (
          <OptionCard
            key={option.id}
            type="radio"
            name={name}
            title={<StartingPointTitle option={option} />}
            description={option.description}
            checked={current === option.id}
            onChange={() => props.onPick(option.id)}
            className="min-h-overlay-touch-target"
          />
        ))}
      </Stack>
    </Stack>
  );
}

export { IdentityDockStartingPoints };
