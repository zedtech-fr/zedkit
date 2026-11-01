import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Section, Stack, Text } from "@zedtech/zedkit-ui";
import { DocsActionLabel } from "@/components/docs-action-label";
import {
  HOME_CARD_CONTENT_GAP,
  HOME_CARD_GRID_FOUR_COL,
  HOME_CARD_TITLE_CLASS,
  HOME_PERSUASION_TEXT_CLASS,
} from "@/ui/home/home-rhythm";
import { homeCopy } from "@/ui/home/i18n/home-copy";

export function HomeProofs({
  packages,
  needs,
  uiComponents,
  livePreviews,
  themeHref,
  version,
  releasesHref,
}: {
  packages: number;
  needs: number;
  uiComponents: number;
  livePreviews: number;
  themeHref: string;
  version: string;
  releasesHref: string;
}) {
  const versionBlock = homeCopy.proofs.versionReleases(version);
  const uiBlock = homeCopy.proofs.uiCatalog(uiComponents, livePreviews);
  const packagesBlock = homeCopy.proofs.packagesNeeds(packages, needs);
  const items = [
    {
      title: versionBlock.title,
      body: versionBlock.body,
      href: releasesHref,
      linkLabel: versionBlock.linkLabel,
      external: true,
    },
    {
      title: uiBlock.title,
      body: uiBlock.body,
    },
    {
      title: packagesBlock.title,
      body: packagesBlock.body,
    },
    {
      title: homeCopy.proofs.theme.title,
      body: homeCopy.proofs.theme.body,
      href: themeHref,
      linkLabel: homeCopy.proofs.theme.linkLabel,
    },
    {
      title: homeCopy.proofs.a11y.title,
      body: homeCopy.proofs.a11y.body,
      href: "https://github.com/zedtech-fr/zedkit/tree/main/packages/ui/tests/unit/a11y.test.tsx",
      linkLabel: homeCopy.proofs.a11y.linkLabel,
      external: true,
    },
  ];
  return (
    <Section
      bleed
      spacing="lg"
      containerWidth="wide"
      title={homeCopy.proofs.section.title}
      id="proofs"
      className="max-md:hidden"
    >
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
