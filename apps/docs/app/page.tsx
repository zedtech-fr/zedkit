import Link from "next/link";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { Badge, Button, LivePulse } from "@zedtech/zedkit-ui";
import * as demos from "../components/demos";
import { catalogStats, featuredPackage, gallery, type GalleryCard } from "@/content/gallery";

type DemoName = keyof typeof demos;

function isDemoName(value: string | null): value is DemoName {
  return value !== null && value in demos;
}

function GalleryEntry({ card }: { card: GalleryCard }) {
  const Demo = isDemoName(card.demo) ? demos[card.demo] : null;
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <span className="flex items-center justify-between gap-2">
        <Link href={card.href}>
          <strong>{card.title}</strong>
        </Link>
        <Badge>{card.status}</Badge>
      </span>
      {Demo ? <Demo /> : <p className="text-sm text-muted-foreground">{card.detail}</p>}
    </div>
  );
}

export default function Home() {
  const install = {
    pnpm: `pnpm add ${featuredPackage}`,
    npm: `npm install ${featuredPackage}`,
    yarn: `yarn add ${featuredPackage}`,
  };
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-16">
      <section className="flex flex-col items-start gap-4">
        <span className="flex items-center gap-3">
          <h1 className="text-4xl font-bold">zedkit</h1>
          <LivePulse />
        </span>
        <p className="text-lg text-muted-foreground">
          Open-source building blocks for modern apps. {catalogStats.needs} needs across{" "}
          {catalogStats.packages} packages — every page below is generated from the kit catalog,
          so badges, install commands, and examples cannot drift.
        </p>
        <Tabs items={["pnpm", "npm", "yarn"]} className="w-full">
          <Tab value="pnpm">
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">{install.pnpm}</pre>
          </Tab>
          <Tab value="npm">
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">{install.npm}</pre>
          </Tab>
          <Tab value="yarn">
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">{install.yarn}</pre>
          </Tab>
        </Tabs>
        <p className="text-sm text-muted-foreground">
          Start with the UI kit — every doc page shows its own install command.
        </p>
        <span className="flex gap-2">
          <Link href="/docs">
            <Button>Browse the docs</Button>
          </Link>
          <Link href="#components">
            <Button variant="outline">Browse components</Button>
          </Link>
        </span>
      </section>
      <section id="components" className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">Components</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {gallery.map((card) => (
            <GalleryEntry key={card.href} card={card} />
          ))}
        </div>
      </section>
    </main>
  );
}
