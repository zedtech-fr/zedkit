import Link from "next/link";
import { Button, Section, Stack, Text } from "@zedtech/zedkit-ui";
import { CatalogActionLabel } from "@/components/docs-action-label";
import {
  HOME_METADATA_TEXT_CLASS,
  HOME_PERSUASION_TEXT_CLASS,
  HOME_SECTION_CONTENT_GAP,
} from "@/ui/home/home-rhythm";

const UI_FAMILIES = [
  {
    label: "Actions",
    blurb: "Buttons, badges, and icon actions.",
    href: "/catalog?area=ui&q=button",
    examples: [
      { label: "Button", href: "/docs/ui/trigger-actions-with-buttons" },
      { label: "Badge", href: "/catalog?area=ui&q=badge" },
      { label: "Icon button", href: "/catalog?area=ui&q=icon" },
      { label: "Confirm dialog", href: "/catalog?area=ui&q=confirm" },
    ],
  },
  {
    label: "Forms",
    blurb: "Inputs, selects, labels, and validated forms.",
    href: "/catalog?area=ui&q=form",
    examples: [
      { label: "Input", href: "/catalog?area=ui&q=input" },
      { label: "Select", href: "/catalog?area=ui&q=select" },
      { label: "Form", href: "/catalog?area=ui&q=form" },
      { label: "Checkbox", href: "/catalog?area=ui&q=checkbox" },
    ],
  },
  {
    label: "Overlays",
    blurb: "Dialogs, drawers, popovers, and menus.",
    href: "/catalog?area=ui&q=dialog",
    examples: [
      { label: "Dialog", href: "/catalog?area=ui&q=dialog" },
      { label: "Drawer", href: "/catalog?area=ui&q=drawer" },
      { label: "Popover", href: "/catalog?area=ui&q=popover" },
      { label: "Dropdown menu", href: "/catalog?area=ui&q=dropdown" },
    ],
  },
  {
    label: "Data",
    blurb: "Tables, detail panels, and list states.",
    href: "/docs/ui/show-a-sortable-filterable-paginated-data-table",
    examples: [
      { label: "Data table", href: "/docs/ui/show-a-sortable-filterable-paginated-data-table" },
      { label: "Detail panel", href: "/catalog?area=ui&q=detail" },
      { label: "Empty state", href: "/catalog?area=ui&q=empty" },
      { label: "Pagination", href: "/catalog?area=ui&q=pagination" },
    ],
  },
] as const;

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
      title="Find a component"
      description={`${componentCount} UI entries in the catalog. Pick a family, then open a live doc page.`}
    >
      <Stack gap={HOME_SECTION_CONTENT_GAP} data-home-component-families="">
        <Stack className="min-w-0 divide-y divide-border border-y border-border">
          {UI_FAMILIES.map((family) => (
            <Stack key={family.label} gap={2} className="py-4">
              <Stack
                direction="horizontal"
                gap={3}
                className="flex-wrap items-baseline justify-between gap-y-2"
              >
                <Stack gap={1} className="min-w-0 flex-1">
                  <Link
                    href={family.href}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {family.label}
                  </Link>
                  <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
                    {family.blurb}
                  </Text>
                </Stack>
                <Text className={HOME_METADATA_TEXT_CLASS}>→</Text>
              </Stack>
              <FamilyExampleLinks examples={family.examples} />
            </Stack>
          ))}
        </Stack>
        <Button asChild variant="outline" className="w-fit">
          <Link href="/catalog?area=ui">
            <CatalogActionLabel>Browse all UI in the catalog</CatalogActionLabel>
          </Link>
        </Button>
      </Stack>
    </Section>
  );
}
