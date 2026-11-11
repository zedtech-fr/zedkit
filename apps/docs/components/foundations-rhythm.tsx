import { Stack, Surface, Text } from "@zedtech/zedkit-ui";

import { FoundationsBand } from "@/components/foundations-band";
import { foundationsCopy as copy } from "@/components/i18n/foundations-copy";

const RHYTHM_GAPS = ["tight", "sm", "md", "lg", "blocks"] as const;

function RhythmMark() {
  return (
    <Surface
      variant="solid"
      elevation={0}
      radius="sm"
      className="min-h-bar w-full bg-border"
      aria-hidden="true"
    />
  );
}

export function FoundationsRhythm() {
  return (
    <FoundationsBand id="rhythm" rule={copy.rules.rhythm}>
      <Stack gap="lg">
        {RHYTHM_GAPS.map((gap) => (
          <Stack key={gap} gap="sm">
            <Text typeRole="label">{copy.rhythm[gap]}</Text>
            <Stack gap={gap} aria-label={`${copy.rhythm.mark} ${copy.rhythm[gap]}`}>
              <RhythmMark />
              <RhythmMark />
            </Stack>
          </Stack>
        ))}
      </Stack>
    </FoundationsBand>
  );
}
