import { DetailPanel, Stack, Text } from "@zedtech/zedkit-ui";
import { HOME_METADATA_TEXT_CLASS } from "@/ui/home/home-rhythm";

const SAMPLE = [
  { label: "Name", value: "console" },
  { label: "Region", value: "eu" },
] as const;

const IDENTITIES = [
  { id: "tide", label: "Tide" },
  { id: "press", label: "Press" },
  { id: "volt", label: "Volt" },
] as const;

/** Compact static strip: one record rendered in three identities. */
export function HomeIdentitySpecimenStrip() {
  return (
    <Stack gap={2} data-home-identity-specimens="">
      <Text variant="muted" className={HOME_METADATA_TEXT_CLASS}>
        Visual example
      </Text>
      <Stack
        direction="horizontal"
        gap={3}
        className="grid min-w-0 gap-3 sm:grid-cols-3"
      >
        {IDENTITIES.map((identity) => (
          <Stack key={identity.id} gap={1} className="min-w-0">
            <Text className={HOME_METADATA_TEXT_CLASS}>{identity.label}</Text>
            <div
              data-identity-scope=""
              data-identity={identity.id}
              className="min-w-0 rounded-md border border-border bg-background p-2"
            >
              <DetailPanel items={[...SAMPLE]} className="min-w-0 text-sm" />
            </div>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
