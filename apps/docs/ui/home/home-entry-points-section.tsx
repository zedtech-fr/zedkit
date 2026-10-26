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
import type { HomeEntryPoint } from "@/content/home-entry-points";
import {
  HOME_CARD_CONTENT_GAP,
  HOME_CARD_GRID_TWO_COL,
  HOME_SECTION_CONTENT_GAP,
} from "@/ui/home/home-rhythm";

export function HomeEntryPointsSection({ entryPoints }: { entryPoints: HomeEntryPoint[] }) {
  return (
    <Section
      title="Choose an area"
      id="entry-points"
      description="Four package families in the catalog — counts come from the generated index, not hand-maintained numbers."
    >
      <Stack gap={HOME_SECTION_CONTENT_GAP}>
        <Stack className={HOME_CARD_GRID_TWO_COL}>
          {entryPoints.map((entry) => (
            <Card key={entry.href} className="flex h-full min-w-0 flex-col">
              <CardHeader>
                <CardTitle className="text-lg">{entry.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <Stack gap={HOME_CARD_CONTENT_GAP} className="flex flex-1 flex-col">
                  <Text variant="muted">{entry.summary}</Text>
                  <Text variant="muted">{entry.needCount} documented needs in the catalog</Text>
                  <Button asChild variant="outline" className="mt-auto min-h-tap w-fit">
                    <Link href={entry.href}>{entry.linkLabel}</Link>
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
