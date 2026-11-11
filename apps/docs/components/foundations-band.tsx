import { Stack, Text } from "@zedtech/zedkit-ui";
import type { ReactNode } from "react";

import type { FoundationsBandId } from "@/lib/foundations-swatches";

export function FoundationsBand({
  id,
  rule,
  children,
}: {
  id: FoundationsBandId;
  rule: string;
  children: ReactNode;
}) {
  return (
    <Stack
      gap="lg"
      data-foundations-band={id}
      className={
        // not-prose is a fumadocs escape hatch, not a Tailwind utility.
        // Two columns inside the 68ch article made type rows wrap (VISUAL-CONTRACT recompose).
        // eslint-disable-next-line better-tailwindcss/no-unknown-classes
        "not-prose"
      }
    >
      {children}
      <Text typeRole="prose" variant="muted">
        {rule}
      </Text>
    </Stack>
  );
}
