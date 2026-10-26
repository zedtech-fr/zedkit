import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Heading,
  Section,
  Stack,
  Text,
} from "@zedtech/zedkit-ui";
import type { HomeScenario } from "@/content/home-scenarios";
import {
  HOME_CARD_CONTENT_GAP,
  HOME_CARD_GRID_TWO_COL,
  HOME_SECTION_CONTENT_GAP,
} from "@/ui/home/home-rhythm";

export function HomeScenariosSection({ scenarios }: { scenarios: HomeScenario[] }) {
  return (
    <Section
      title="Start from your situation"
      id="scenarios"
      description="Each card links to a generated doc page (install command, example, and live preview when available)."
    >
      <Stack gap={HOME_SECTION_CONTENT_GAP}>
        <Stack className={HOME_CARD_GRID_TWO_COL}>
          {scenarios.map((scenario) => (
            <Card key={scenario.href} className="min-w-0">
              <CardHeader>
                <CardTitle>{scenario.situation}</CardTitle>
              </CardHeader>
              <CardContent>
                <Stack gap={HOME_CARD_CONTENT_GAP}>
                  <Stack gap={1}>
                    <Heading level={4} as="h3">You want</Heading>
                    <Text variant="muted">{scenario.goal}</Text>
                  </Stack>
                  <Stack gap={1}>
                    <Heading level={4} as="h3">Do this</Heading>
                    <Text variant="muted">{scenario.action}</Text>
                  </Stack>
                  <Button asChild variant="ghost" size="sm" className="w-fit">
                    <Link href={scenario.href} aria-label={`Read the docs: ${scenario.situation}`}>
                      Read the docs
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
