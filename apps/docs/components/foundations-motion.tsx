import { Stack, Text } from "@zedtech/zedkit-ui";

import { FoundationsBand } from "@/components/foundations-band";
import { foundationsCopy as copy } from "@/components/i18n/foundations-copy";
import { foundationsMotionNames } from "@/lib/foundations-swatches";

export function FoundationsMotion() {
  return (
    <FoundationsBand id="motion" rule={copy.rules.motion}>
      <Stack gap="sm">
        {foundationsMotionNames.map((name) => (
          <Text key={name} typeRole="body">
            {name}
          </Text>
        ))}
      </Stack>
    </FoundationsBand>
  );
}
