import Link from "next/link";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { Badge, Button, Heading, LivePulse, Section, Stack, Text } from "@zedtech/zedkit-ui";
import { demoRegistry, type DemoKey } from "../components/demos/registry";
import { catalogStats, featuredPackage, gallery, type GalleryCard } from "@/content/gallery";

function isDemoKey(value: string | null): value is DemoKey {
  return value !== null && value in demoRegistry;
}

function GalleryEntry({ card }: { card: GalleryCard }) {
  const entry = isDemoKey(card.demo) ? demoRegistry[card.demo] : null;
  return (
    <Stack gap={3} className="rounded-lg border border-border bg-card p-4">
      <Stack direction="horizontal" gap={2} className="justify-between">
        <Link href={card.href}>
          <Text as="span" className="font-semibold">
            {card.title}
          </Text>
        </Link>
        <Badge>{card.status}</Badge>
      </Stack>
      {entry ? <entry.Demo /> : <Text variant="muted">{card.detail}</Text>}
    </Stack>
  );
}

export default function Home() {
  const install = {
    pnpm: `pnpm add ${featuredPackage}`,
    npm: `npm install ${featuredPackage}`,
    yarn: `yarn add ${featuredPackage}`,
  };
  return (
    <Stack gap={8} className="mx-auto w-full max-w-4xl px-6 py-16">
      <Stack gap={4} className="items-start">
        <Stack direction="horizontal" gap={3}>
          <Heading level={1}>zedkit</Heading>
          <LivePulse />
        </Stack>
        <Text className="text-lg">
          Open-source building blocks for modern apps. {catalogStats.needs} needs across{" "}
          {catalogStats.packages} packages — every page below is generated from the kit catalog,
          so badges, install commands, and examples cannot drift.
        </Text>
        <Tabs items={["pnpm", "npm", "yarn"]} className="w-full">
          <Tab value="pnpm">
            <Stack className="rounded-lg bg-muted p-3">
              <Text className="font-mono text-sm">{install.pnpm}</Text>
            </Stack>
          </Tab>
          <Tab value="npm">
            <Stack className="rounded-lg bg-muted p-3">
              <Text className="font-mono text-sm">{install.npm}</Text>
            </Stack>
          </Tab>
          <Tab value="yarn">
            <Stack className="rounded-lg bg-muted p-3">
              <Text className="font-mono text-sm">{install.yarn}</Text>
            </Stack>
          </Tab>
        </Tabs>
        <Text variant="muted">
          Start with the UI kit — every doc page shows its own install command.
        </Text>
        <Stack direction="horizontal" gap={2}>
          <Link href="/docs">
            <Button>Browse the docs</Button>
          </Link>
          <Link href="#components">
            <Button variant="outline">Browse components</Button>
          </Link>
        </Stack>
      </Stack>
      <Section title="Components" id="components">
        {/* grid via className: Stack supplies the element, grid the layout.
            No base grid-cols-*: our utilities emit after Fumadocs' prebuilt
            md: rules, so a base template would override md:grid-cols-3. */}
        <Stack className="grid gap-4 md:grid-cols-3">
          {gallery.map((card) => (
            <GalleryEntry key={card.href} card={card} />
          ))}
        </Stack>
      </Section>
    </Stack>
  );
}
