import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Section, Stack, Text } from "@zedtech/zedkit-ui";
import { DocsActionLabel } from "@/components/docs-action-label";
import {
  HOME_CARD_CONTENT_GAP,
  HOME_CARD_GRID_FOUR_COL,
  HOME_CARD_TITLE_CLASS,
  HOME_PERSUASION_TEXT_CLASS,
} from "@/ui/home/home-rhythm";

export function HomeProofs({
  packages,
  needs,
  uiComponents,
  livePreviews,
  themeHref,
  version,
  releasesHref,
  latestChange,
}: {
  packages: number;
  needs: number;
  uiComponents: number;
  livePreviews: number;
  themeHref: string;
  version: string;
  releasesHref: string;
  latestChange: string;
}) {
  const items = [
    {
      title: `Latest in v${version}`,
      body: latestChange,
      href: releasesHref,
      linkLabel: `v${version} (releases)`,
      external: true,
    },
    {
      title: `${uiComponents} UI catalog entries`,
      body: `${livePreviews} include a live preview you can try on the page.`,
    },
    {
      title: `${packages} packages, ${needs} needs`,
      body: "Counts are kept in sync with the catalog, so they match the published packages.",
    },
    {
      title: "Light and dark theme",
      body: "Light and dark tokens are built in — try the toggle in the header.",
      href: themeHref,
      linkLabel: "Theme setup page",
    },
    {
      title: "Accessibility checks",
      body: "Rendered components are checked automatically for accessibility issues.",
      href: "https://github.com/zedtech-fr/zedkit/tree/main/packages/ui/tests/unit/a11y.test.tsx",
      linkLabel: "axe test suite",
      external: true,
    },
  ];
  return (
    <Section bleed spacing="lg" containerWidth="wide" title="What you can verify" id="proofs" className="max-md:hidden">
      <Stack className={HOME_CARD_GRID_FOUR_COL}>
        {items.map((item) => (
          <Card key={item.title} className="min-w-0">
            <CardHeader>
              <CardTitle className={HOME_CARD_TITLE_CLASS}>{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <Stack gap={HOME_CARD_CONTENT_GAP}>
                <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
                  {item.body}
                </Text>
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
