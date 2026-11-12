import { Heading, Stack, Text } from "@zedtech/zedkit-ui";

import { foundationsTypeRows, type FoundationsTypeRow } from "../foundations-swatches";
import { foundationsCopy as copy } from "../i18n/foundations-copy";
import { FoundationsBand } from "./foundations-band";

const HEADING_TREATMENTS = ["display", "section", "band"] as const;
type HeadingTreatment = (typeof HEADING_TREATMENTS)[number];

function isHeadingTreatment(treatment: FoundationsTypeRow["treatment"]): treatment is HeadingTreatment {
  return (HEADING_TREATMENTS as readonly string[]).includes(treatment);
}

function TypeSpecimen({ row }: { row: FoundationsTypeRow }) {
  const sample = copy.typeRows[row.id].sample;
  if (row.treatment === "quote") {
    return <Text data-type-quote="">{sample}</Text>;
  }
  if (row.treatment === "mono") {
    return (
      <Text typeRole="small" className="font-mono">
        {sample}
      </Text>
    );
  }
  if (isHeadingTreatment(row.treatment)) {
    return (
      <Heading as="div" typeRole={row.treatment}>
        {sample}
      </Heading>
    );
  }
  return <Text typeRole={row.treatment}>{sample}</Text>;
}

export function FoundationsType() {
  return (
    <FoundationsBand id="type">
      <Stack className="border-b border-border">
        {foundationsTypeRows.map((row) => (
          <Stack
            key={row.id}
            direction="horizontal"
            gap="md"
            data-foundations-type-row={row.id}
            className="flex-wrap items-baseline border-t border-border py-control-block-lg"
          >
            <Text typeRole="small" variant="muted" data-type-spec="">
              {copy.typeRows[row.id].spec}
            </Text>
            <TypeSpecimen row={row} />
          </Stack>
        ))}
      </Stack>
    </FoundationsBand>
  );
}
