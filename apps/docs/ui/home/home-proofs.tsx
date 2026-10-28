import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Section, Stack, Text } from "@zedtech/zedkit-ui";
import { DocsActionLabel } from "@/components/docs-action-label";
import {
  HOME_CARD_CONTENT_GAP,
  HOME_CARD_GRID_TWO_COL,
} from "@/ui/home/home-rhythm";

export function HomeProofs({
  packages,
  needs,
  uiComponents,
  livePreviews,
  themeHref,
}: {
  packages: number;
  needs: number;
  uiComponents: number;
  livePreviews: number;
  themeHref: string;
}) {
  const items = [
    {
      title: `${uiComponents} UI catalog entries`,
      body: `${livePreviews} ship a live preview on their doc page (manifest-driven demos).`,
    },
    {
      title: `${packages} packages, ${needs} needs`,
      body: "Counts come from docs/catalog/catalog.json; the docs check fails when pages drift.",
    },
    {
      title: "Light and dark theme",
      body: "Class-based `.dark` tokens; toggle in the header matches the admin kit pattern.",
      href: themeHref,
      linkLabel: "Theme setup page",
    },
    {
      title: "Accessibility checks",
      body: "@zedtech/zedkit-ui runs vitest-axe on rendered components in packages/ui/tests/unit.",
      href: "https://github.com/zedtech-fr/zedkit/tree/main/packages/ui/tests/unit/a11y.test.tsx",
      linkLabel: "axe test suite",
      external: true,
    },
  ];
  return (
    <Section title="What you can verify" id="proofs">
      <Stack className={HOME_CARD_GRID_TWO_COL}>
        {items.map((item) => (
          <Card key={item.title} className="min-w-0">
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <Stack gap={HOME_CARD_CONTENT_GAP}>
                <Text variant="muted">{item.body}</Text>
                {item.href ? (
                  <Button asChild variant="ghost" size="sm" className="w-fit">
                    <Link
                      href={item.href}
                      {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
                    >
                      {item.external ? item.linkLabel : <DocsActionLabel>{item.linkLabel}</DocsActionLabel>}
                    </Link>
                  </Button>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Section>
  );
}
