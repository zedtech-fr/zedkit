"use client";

import { Label, SecretField, Stack } from "@zedtech/zedkit-ui";
import { setupEntryPrompt, type SetupEntryId } from "@/lib/setup-entry-prompts";

export function SetupEntryPrompt({ id }: { id: SetupEntryId }) {
  const entry = setupEntryPrompt(id);
  const fieldId = `setup-entry-${entry.id}`;

  return (
    <Stack
      gap="sm"
      data-setup-entry={entry.id}
      data-setup-entry-role={entry.role}
      data-setup-prompt=""
      className={
        // not-prose is a fumadocs escape hatch, not a Tailwind utility.
        // eslint-disable-next-line better-tailwindcss/no-unknown-classes
        "not-prose"
      }
    >
      <Label htmlFor={fieldId}>{entry.label}</Label>
      <SecretField
        id={fieldId}
        multiline
        value={entry.value}
        copyLabel={entry.copyLabel}
      />
    </Stack>
  );
}
