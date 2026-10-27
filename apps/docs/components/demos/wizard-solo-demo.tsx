"use client";

import { useState } from "react";
import { OptionCard, Stack, Text } from "@zedtech/zedkit-ui";

export function WizardSoloDemo() {
  const [digest, setDigest] = useState(true);
  return (
    <Stack gap={2} className="min-w-0">
      <OptionCard
        title="Weekly digest"
        description="Every Monday: new projects, open tasks and what is due this week."
        checked={digest}
        onChange={() => setDigest(!digest)}
      />
      <Text variant="muted" className="text-xs" aria-live="polite">
        {digest ? "You will receive the digest." : "No digest."}
      </Text>
    </Stack>
  );
}
