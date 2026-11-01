import Link from "next/link";
import { Button, Section, Stack, Text } from "@zedtech/zedkit-ui";
import { CatalogActionLabel } from "@/components/docs-action-label";
import {
  HOME_METADATA_TEXT_CLASS,
  HOME_PERSUASION_TEXT_CLASS,
  HOME_SECTION_CONTENT_GAP,
} from "@/ui/home/home-rhythm";
import { homeCopy } from "@/ui/home/i18n/home-copy";

function FamilyExampleLinks({ examples }: { examples: readonly { label: string; href: string }[] }) {
  return (
    <Stack direction="horizontal" gap={2} className="flex-wrap">
      {examples.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`${HOME_METADATA_TEXT_CLASS} underline-offset-4 hover:underline`}
        >
          {item.label}
        </Link>
      ))}
    </Stack>
  );
}

/** Browse UI by task family — one focal list, not a preview card grid. */
export function HomeComponentFamiliesSection({
  componentCount,
}: {
  componentCount: number;
}) {
  return (
    <Section
      bleed
      spacing="md"
      containerWidth="wide"
      id="components"
      title={homeCopy.componentFamilies.section.title}
      description={homeCopy.componentFamilies.section.description(componentCount)}
    >
      <Stack gap={HOME_SECTION_CONTENT_GAP} data-home-component-families="">
        <Stack className="min-w-0 divide-y divide-border border-y border-border">
          {homeCopy.componentFamilies.families.map((family) => (
            <Stack key={family.label} gap={2} className="py-4">
              <Stack
                direction="horizontal"
                gap={3}
                className="flex-wrap items-baseline justify-between gap-y-2"
              >
                <Stack gap={1} className="min-w-0 flex-1">
                  <Link
                    href={family.examples[0].href}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {family.label}
                  </Link>
                  <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
                    {family.blurb}
                  </Text>
                </Stack>
              </Stack>
              <FamilyExampleLinks examples={family.examples} />
            </Stack>
          ))}
        </Stack>
        <Button asChild variant="outline" className="w-fit">
          <Link href="/catalog?area=ui">
            <CatalogActionLabel>{homeCopy.componentFamilies.section.browseAll}</CatalogActionLabel>
          </Link>
        </Button>
      </Stack>
    </Section>
  );
}
