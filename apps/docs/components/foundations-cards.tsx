import { Field, FieldLabel, Input, Surface } from "@zedtech/zedkit-ui";

import { FoundationsBand } from "@/components/foundations-band";
import { foundationsCopy as copy } from "@/components/i18n/foundations-copy";

export function FoundationsCards() {
  return (
    <FoundationsBand id="cards" rule={copy.rules.cards}>
      <Surface variant="solid" elevation={0} padding="card" radius="xl">
        <Field>
          <FieldLabel htmlFor="foundations-workspace">{copy.field.label}</FieldLabel>
          <Input id="foundations-workspace" readOnly value={copy.field.value} />
        </Field>
      </Surface>
    </FoundationsBand>
  );
}
