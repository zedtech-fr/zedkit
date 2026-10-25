import Link from "next/link";
import { Badge, Button, Heading, LivePulse, Stack, Text } from "@zedtech/zedkit-ui";
import { demoRegistry, type DemoKey } from "../components/demos/registry";
import { richCards } from "@/content/rich-cards";

interface RichCard {
  href: string;
  title: string;
  status: string;
  demo: DemoKey;
}

function RichCard({ href, title, status, demo }: RichCard) {
  const entry = demoRegistry[demo];
  return (
    <Stack gap={3} className="rounded-lg border border-border bg-card p-4">
      <Stack direction="horizontal" gap={2} className="justify-between">
        <Link href={href}>
          <strong>{title}</strong>
        </Link>
        <Badge>{status}</Badge>
      </Stack>
      {entry ? <entry.Demo /> : null}
    </Stack>
  );
}

export default function Home() {
  const cards = richCards as RichCard[];
  const buttonHref = cards.find((card) => card.title === "Button")?.href ?? "/docs";
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-16">
      <section className="flex flex-col items-start gap-4">
        <Stack direction="horizontal" gap={3}>
          <Heading level={1}>zedkit</Heading>
          <LivePulse />
        </Stack>
        <Text className="text-lg">
          Open-source building blocks for modern apps. Every page below is generated from the kit
          catalog — badges, install commands, and examples cannot drift.
        </Text>
        <Stack direction="horizontal" gap={2}>
          <Link href="/docs">
            <Button>Browse the docs</Button>
          </Link>
          <Link href={buttonHref}>
            <Button variant="outline">Live Button demo</Button>
          </Link>
        </Stack>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <RichCard key={card.href} href={card.href} title={card.title} status={card.status} demo={card.demo} />
        ))}
      </section>
    </main>
  );
}
