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

export function HomeEntryPointsSection({ entryPoints }: { entryPoints: HomeEntryPoint[] }) {
  return (
    <Section title="Choose an area" id="entry-points">
      <Stack gap={4}>
        <Text variant="muted">
          Four package families in the catalog — counts come from the generated index, not
          hand-maintained numbers.
        </Text>
        <Stack className="grid min-w-0 gap-4 md:grid-cols-2">
          {entryPoints.map((entry) => (
            <Card key={entry.href}>
              <CardHeader>
                <CardTitle>{entry.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Stack gap={3}>
                  <Text className="text-sm">{entry.summary}</Text>
                  <Text variant="muted" className="text-sm">
                    {entry.needCount} documented needs in the catalog
                  </Text>
                  <Button asChild variant="secondary" size="sm" className="max-w-full whitespace-normal">
                    <Link href={entry.href} className="text-center">{entry.linkLabel}</Link>
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
