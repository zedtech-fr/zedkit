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
import { HomeScenarioTitle } from "@/components/home-scenario-title";
import type { HomeScenario } from "@/content/home-scenarios";
import {
  HOME_CARD_CONTENT_GAP,
  HOME_CARD_GRID_THREE_COL,
  HOME_METADATA_TEXT_CLASS,
  HOME_PERSUASION_TEXT_CLASS,
  HOME_SECTION_CONTENT_GAP,
} from "@/ui/home/home-rhythm";

export function HomeScenariosSection({ scenarios }: { scenarios: HomeScenario[] }) {
  return (
    <Section
      bleed
      tone="muted"
      spacing="lg"
      containerWidth="wide"
      title="Start from your situation"
      id="scenarios"
      description="Each card opens a doc page with the install command, an example, and a live preview when available."
    >
      <Stack gap={HOME_SECTION_CONTENT_GAP}>
        <Stack className={HOME_CARD_GRID_THREE_COL}>
          {scenarios.map((scenario) => (
            <Card key={scenario.href} className="flex h-full min-w-0 flex-col">
              <CardHeader className="pb-2">
                <CardTitle>
                  <HomeScenarioTitle href={scenario.href} situation={scenario.situation} />
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <Stack gap={HOME_CARD_CONTENT_GAP} className="flex flex-1 flex-col">
                  <Stack gap={4}>
                    <Stack gap={1}>
                      <Text as="span" className={HOME_METADATA_TEXT_CLASS}>
                        You want
                      </Text>
                      <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
                        {scenario.goal}
                      </Text>
                    </Stack>
                    <Stack gap={1}>
                      <Text as="span" className={HOME_METADATA_TEXT_CLASS}>
                        Do this
                      </Text>
                      <Text className={HOME_PERSUASION_TEXT_CLASS}>{scenario.action}</Text>
                    </Stack>
                  </Stack>
                  <Button asChild variant="outline" className="mt-6 w-fit">
                    <Link href={scenario.href}>
                      <DocsActionLabel>{scenario.linkLabel}</DocsActionLabel>
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
