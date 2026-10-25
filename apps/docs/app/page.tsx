import Link from "next/link";
import { Badge, Button, LivePulse } from "@zedtech/zedkit-ui";
import * as demos from "../components/demos";
import { richCards } from "@/content/rich-cards";

interface RichCard {
  href: string;
  title: string;
  status: string;
  demo: keyof typeof demos;
}

function RichCard({ href, title, status, demo }: RichCard) {
  const Demo = demos[demo];
  return (
    <Link
      href={href}
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 no-underline"
    >
      <span className="flex items-center justify-between gap-2">
        <strong>{title}</strong>
        <Badge>{status}</Badge>
      </span>
      <Demo />
    </Link>
  );
}

export default function Home() {
  const cards = richCards as (Omit<RichCard, "demo"> & { demo: keyof typeof demos })[];
  const buttonHref = cards.find((card) => card.title === "Button")?.href ?? "/docs";
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-16">
      <section className="flex flex-col items-start gap-4">
        <span className="flex items-center gap-3">
          <h1 className="text-4xl font-bold">zedkit</h1>
          <LivePulse />
        </span>
        <p className="text-lg text-muted-foreground">
          Open-source building blocks for modern apps. Every page below is generated from the kit
          catalog — badges, install commands, and examples cannot drift.
        </p>
        <span className="flex gap-2">
          <Link href="/docs">
            <Button>Browse the docs</Button>
          </Link>
          <Link href={buttonHref}>
            <Button variant="outline">Live Button demo</Button>
          </Link>
        </span>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <RichCard key={card.href} href={card.href} title={card.title} status={card.status} demo={card.demo} />
        ))}
      </section>
    </main>
  );
}
