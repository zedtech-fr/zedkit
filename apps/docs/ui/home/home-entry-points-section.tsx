import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Section,
  Stack,
  Text,
} from "@zedtech/zedkit-ui";
import { DocsActionLabel } from "@/components/docs-action-label";
import { HomeAreaTitle } from "@/components/home-area-title";
import type { HomeEntryPoint } from "@/content/home-entry-points";
import {
  HOME_CARD_CONTENT_GAP,
  HOME_CARD_GRID_FOUR_COL,
  HOME_METADATA_TEXT_CLASS,
  HOME_PERSUASION_TEXT_CLASS,
  HOME_SECTION_CONTENT_GAP,
} from "@/ui/home/home-rhythm";

export function HomeEntryPointsSection({ entryPoints }: { entryPoints: HomeEntryPoint[] }) {
  return (
    <Section
      bleed
      spacing="lg"
      containerWidth="wide"
      title="Choose an area"
      id="entry-points"
      description="Four package families in the catalog, with up-to-date counts on each card."
    >
      <Stack gap={HOME_SECTION_CONTENT_GAP}>
        <Stack className={HOME_CARD_GRID_FOUR_COL}>
          {entryPoints.map((entry) => (
            <Card key={entry.href} className="min-w-0">
              <CardHeader>
                <CardTitle>
                  <HomeAreaTitle title={entry.title} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Stack gap={HOME_CARD_CONTENT_GAP}>
                  <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
                    {entry.summary}
                  </Text>
                  <Text className={HOME_METADATA_TEXT_CLASS}>
                    {entry.needCount} documented needs in the catalog
                  </Text>
                  <Button asChild variant="ghost" size="sm" className="w-fit">
                    <Link href={entry.href}>
                      <DocsActionLabel>{entry.linkLabel}</DocsActionLabel>
                    </Link>
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Section>
  );
}
