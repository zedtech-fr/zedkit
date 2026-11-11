import { Heading, Stack, Text } from "@zedtech/zedkit-ui";

import { FoundationsBand } from "@/components/foundations-band";
import { foundationsCopy as copy } from "@/components/i18n/foundations-copy";
import { foundationsTypeRoles, type FoundationsTypeRole } from "@/lib/foundations-swatches";

const HEADING_ROLES = ["display", "section", "band", "cardTitle", "nav"] as const;
type HeadingRole = (typeof HEADING_ROLES)[number];

function isHeadingRole(role: FoundationsTypeRole): role is HeadingRole {
  return (HEADING_ROLES as readonly string[]).includes(role);
}

function TypeSample({ role }: { role: FoundationsTypeRole }) {
  const sample = copy.typeSamples[role];
  if (isHeadingRole(role)) {
    return (
      <Heading as="div" typeRole={role}>
        {sample}
      </Heading>
    );
  }
  return <Text typeRole={role}>{sample}</Text>;
}

export function FoundationsType() {
  return (
    <FoundationsBand id="type" rule={copy.rules.type}>
      <Stack gap="sm" className="border-b border-border">
        {foundationsTypeRoles.map((role) => (
          <Stack key={role} gap="tight" className="border-t border-border py-control-block-lg">
            <Text typeRole="small" variant="muted">
              {copy.typeLabels[role]}
            </Text>
            <TypeSample role={role} />
          </Stack>
        ))}
      </Stack>
    </FoundationsBand>
  );
}
