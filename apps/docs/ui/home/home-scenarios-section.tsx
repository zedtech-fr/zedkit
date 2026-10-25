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

export function HomeScenariosSection({ scenarios }: { scenarios: HomeScenario[] }) {
  return (
    <Section title="Start from your situation" id="scenarios">
      <Stack gap={4}>
        <Text variant="muted">
          Each card links to a generated doc page (install command, example, and live preview when
          available).
        </Text>
        <Stack className="grid gap-4 md:grid-cols-2">
          {scenarios.map((scenario) => (
            <Card key={scenario.href}>
              <CardHeader>
                <CardTitle>{scenario.situation}</CardTitle>
              </CardHeader>
              <CardContent>
                <Stack gap={3}>
                  <Stack gap={1}>
                    <Heading level={3} className="text-sm font-medium">
                      You want
                    </Heading>
                    <Text className="text-sm">{scenario.goal}</Text>
                  </Stack>
                  <Stack gap={1}>
                    <Heading level={3} className="text-sm font-medium">
                      Do this
                    </Heading>
                    <Text className="text-sm">{scenario.action}</Text>
                  </Stack>
                  <Link href={scenario.href}>
                    <Button variant="secondary" size="sm">Open the doc page</Button>
                  </Link>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Section>
  );
}
