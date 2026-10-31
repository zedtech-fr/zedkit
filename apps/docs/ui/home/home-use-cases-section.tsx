"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Heading,
  ProgressBar,
  Section,
  Stack,
  StatusLabel,
  Text,
  identities,
} from "@zedtech/zedkit-ui";
import { HomeAdminScene } from "@/ui/home/home-admin-scene";
import { HOME_CARD_CONTENT_GAP, HOME_CARD_TITLE_CLASS, HOME_METADATA_TEXT_CLASS, HOME_PERSUASION_TEXT_CLASS } from "@/ui/home/home-rhythm";

type UseCaseId = "admin" | "shop" | "editorial" | "launch" | "monitoring" | "mobile";

type UseCase = {
  id: UseCaseId;
  title: string;
  identity: string;
  identityLabel: string;
  why: string;
};

const USE_CASES: readonly UseCase[] = [
  {
    id: "admin",
    title: "An admin dashboard",
    identity: "mist",
    identityLabel: "Mist",
    why: "Tables, forms and status for people who work in it all day: calm colours, soft edges, nothing shouting.",
  },
  {
    id: "editorial",
    title: "A blog or magazine",
    identity: "press",
    identityLabel: "Press",
    why: "Reading first: ink on paper, fine rules and a serif that stays comfortable for long articles.",
  },
  {
    id: "monitoring",
    title: "A live status board",
    identity: "tide",
    identityLabel: "Tide",
    why: "Bold, rounded and lively: state changes are easy to spot across a room.",
  },
  {
    id: "launch",
    title: "A product landing page",
    identity: "volt",
    identityLabel: "Volt",
    why: "One electric accent on a dark, dense layout: the call to action is the only thing that glows.",
  },
  {
    id: "shop",
    title: "A shop or brand site",
    identity: "maison",
    identityLabel: "Maison",
    why: "Product first: ivory background, serif titles and generous space let photography and price carry the page.",
  },
  {
    id: "mobile",
    title: "A companion app",
    identity: "glass",
    identityLabel: "Glass",
    why: "Frosted layers over soft colour: light, touch-sized and at home on a phone.",
  },
];

const DEFAULT_USE_CASE: UseCase = USE_CASES[0]!;

/**
 * Renders a subtree in another identity than the page, through the kit's
 * `data-identity-scope` attribute contract (identities.css): tokens, fonts and
 * radii come from `identity`, `<html>` is never touched.
 */
function SceneScope({ identity, ...props }: ComponentProps<"div"> & { identity: string }) {
  return <div data-identity-scope="" data-identity={identity} {...props} />;
}

const SCENE_CLASS = "min-w-0 overflow-hidden rounded-xl border bg-background p-card-padding";
const SECOND_SCENE_CLASS = `${SCENE_CLASS} max-md:hidden`;
const SCENE_TITLE_CLASS = "font-(family-name:--zk-font-display) text-2xl leading-tight font-semibold text-balance";

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Stack gap={1}>
      <Text className="font-(family-name:--zk-font-display) text-xl font-semibold">{value}</Text>
      <Text variant="muted" className={HOME_METADATA_TEXT_CLASS}>
        {label}
      </Text>
    </Stack>
  );
}

function Scene({ id }: { id: UseCaseId }) {
  switch (id) {
    case "admin":
      return <HomeAdminScene />;
    case "shop":
      return (
        <Stack gap={HOME_CARD_CONTENT_GAP}>
          <Badge>New season</Badge>
          <Text className={SCENE_TITLE_CLASS}>The washed linen shirt</Text>
          <Text variant="muted">Loose cut, mother-of-pearl buttons, made in small batches in Portugal.</Text>
          <Text className="font-(family-name:--zk-font-display) text-xl font-semibold">€ 89</Text>
          <Stack direction="horizontal" gap={2} className="flex-wrap">
            <Button size="sm">Add to basket</Button>
            <Button size="sm" variant="outline">
              Size guide
            </Button>
          </Stack>
          <Text variant="muted" className={HOME_METADATA_TEXT_CLASS}>
            Free returns within 30 days.
          </Text>
        </Stack>
      );
    case "editorial":
      return (
        <Stack gap={HOME_CARD_CONTENT_GAP}>
          <Badge>Essay</Badge>
          <Text className={SCENE_TITLE_CLASS}>The quiet return of the long read</Text>
          <Text variant="muted" className={HOME_METADATA_TEXT_CLASS}>
            By Ines Marlow · 8 min read
          </Text>
          <Text>
            After a decade of feeds, readers are asking for fewer, slower pieces: a page that holds still, a column
            that is easy on the eyes, and an ending worth reaching.
          </Text>
          <Stack direction="horizontal">
            <Button size="sm" variant="outline">
              Read the essay
            </Button>
          </Stack>
        </Stack>
      );
    case "launch":
      return (
        <Stack gap={HOME_CARD_CONTENT_GAP}>
          <Badge>Version 2</Badge>
          <Text className={SCENE_TITLE_CLASS}>Ship your dashboard in an afternoon</Text>
          <Text variant="muted">Typed components, one config file, nothing to rewrite later.</Text>
          <Stack direction="horizontal" gap={2} className="flex-wrap">
            <Button size="sm">Start free</Button>
            <Button size="sm" variant="outline">
              See pricing
            </Button>
          </Stack>
          <Stack direction="horizontal" gap={6} className="flex-wrap">
            <Stat value="3x" label="Faster setup" />
            <Stat value="0" label="Config to start" />
          </Stack>
        </Stack>
      );
    case "monitoring":
      return (
        <Stack gap={HOME_CARD_CONTENT_GAP}>
          <Stack direction="horizontal" gap={2} className="items-center justify-between">
            <Badge>Live</Badge>
            <StatusLabel tone="updating">Checking 4 regions</StatusLabel>
          </Stack>
          <Text className={SCENE_TITLE_CLASS}>Checkout is healthy</Text>
          <ProgressBar value={83} label="Error budget left this month" />
          <Text variant="muted" className={HOME_METADATA_TEXT_CLASS}>
            83% of the monthly error budget left. Last incident closed 6 days ago.
          </Text>
          <Stack direction="horizontal">
            <Button size="sm" variant="outline">
              Open the incident log
            </Button>
          </Stack>
        </Stack>
      );
    case "mobile":
      return (
        <Stack gap={HOME_CARD_CONTENT_GAP}>
          <Badge>Today</Badge>
          <Text className={SCENE_TITLE_CLASS}>Good morning, 3 tasks</Text>
          <Stack gap={2}>
            {["Review the invoice", "Call the supplier", "Pack the samples"].map((task, index) => (
              <Stack
                key={task}
                direction="horizontal"
                gap={2}
                className="items-center justify-between rounded-lg border px-3 py-2"
              >
                <Text>{task}</Text>
                <Text variant="muted" className={HOME_METADATA_TEXT_CLASS}>
                  {index === 0 ? "9:30" : index === 1 ? "11:00" : "Later"}
                </Text>
              </Stack>
            ))}
          </Stack>
          <Stack direction="horizontal">
            <Button size="sm">Add a task</Button>
          </Stack>
        </Stack>
      );
  }
}

/**
 * A second, smaller example next to the main one, drawn in the same
 * identity. Shown from the tablet width up; on a phone the stage keeps one
 * example so nothing is cut.
 */
function SecondScene({ id }: { id: UseCaseId }) {
  switch (id) {
    case "admin":
      return (
        <Stack gap={HOME_CARD_CONTENT_GAP}>
          <Badge>Team</Badge>
          <Text className={SCENE_TITLE_CLASS}>Invite a teammate</Text>
          <Text variant="muted">They get read access to orders until you change their role.</Text>
          <StatusLabel tone="saved">Draft saved</StatusLabel>
          <Stack direction="horizontal" gap={2} className="flex-wrap">
            <Button size="sm">Send invite</Button>
            <Button size="sm" variant="outline">
              Cancel
            </Button>
          </Stack>
        </Stack>
      );
    case "editorial":
      return (
        <Stack gap={HOME_CARD_CONTENT_GAP}>
          <Badge>Pull quote</Badge>
          <Text className={SCENE_TITLE_CLASS}>“A page that holds still is a page that gets finished.”</Text>
          <Text variant="muted" className={HOME_METADATA_TEXT_CLASS}>
            Ines Marlow, on slow reading
          </Text>
        </Stack>
      );
    case "monitoring":
      return (
        <Stack gap={HOME_CARD_CONTENT_GAP}>
          <Badge>Regions</Badge>
          {[
            ["Paris", "38 ms"],
            ["Frankfurt", "44 ms"],
            ["Dublin", "51 ms"],
            ["Madrid", "47 ms"],
          ].map(([region, latency]) => (
            <Stack
              key={region}
              direction="horizontal"
              gap={2}
              className="items-center justify-between rounded-lg border px-3 py-2"
            >
              <Text>{region}</Text>
              <Text variant="muted" className={HOME_METADATA_TEXT_CLASS}>
                {latency}
              </Text>
            </Stack>
          ))}
        </Stack>
      );
    case "launch":
      return (
        <Stack gap={HOME_CARD_CONTENT_GAP}>
          <Badge>Pro</Badge>
          <Text className={SCENE_TITLE_CLASS}>€ 19 a month</Text>
          <Text variant="muted">Unlimited projects, priority support, cancel any time.</Text>
          <Stack direction="horizontal">
            <Button size="sm">Start free</Button>
          </Stack>
        </Stack>
      );
    case "shop":
      return (
        <Stack gap={HOME_CARD_CONTENT_GAP}>
          <Badge>You may also like</Badge>
          {[
            ["Waxed canvas tote", "€ 64"],
            ["Stoneware mug", "€ 22"],
            ["Wool throw", "€ 120"],
          ].map(([name, price]) => (
            <Stack
              key={name}
              direction="horizontal"
              gap={2}
              className="items-center justify-between rounded-lg border px-3 py-2"
            >
              <Text>{name}</Text>
              <Text variant="muted" className={HOME_METADATA_TEXT_CLASS}>
                {price}
              </Text>
            </Stack>
          ))}
        </Stack>
      );
    case "mobile":
      return (
        <Stack gap={HOME_CARD_CONTENT_GAP}>
          <Badge>Next up</Badge>
          <Text className={SCENE_TITLE_CLASS}>Supplier call at 11:00</Text>
          <Text variant="muted">Samples are packed. Ask about the delivery date.</Text>
          <Stack direction="horizontal" gap={2} className="flex-wrap">
            <Button size="sm">Join</Button>
            <Button size="sm" variant="outline">
              Snooze
            </Button>
          </Stack>
        </Stack>
      );
  }
}

function UseCasePreview({ useCase }: { useCase: UseCase }) {
  return (
    <Stack gap={4} className="min-w-0">
      <Stack gap={2} className="min-w-0">
        <Text variant="muted" className={HOME_METADATA_TEXT_CLASS}>
          Identity: {useCase.identityLabel}
        </Text>
        <Heading level={3} id={`use-case-${useCase.id}`} className={HOME_CARD_TITLE_CLASS}>
          {useCase.title}
        </Heading>
        <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
          {useCase.why}
        </Text>
      </Stack>
      <SceneScope
        identity={useCase.identity}
        aria-hidden="true"
        inert
        data-use-case-scene={useCase.id}
        className="grid min-w-0 gap-4 font-sans text-foreground md:grid-cols-5"
      >
        <div className={`${SCENE_CLASS} md:col-span-3`}>
          <Scene id={useCase.id} />
        </div>
        <div className={`${SECOND_SCENE_CLASS} md:col-span-2`}>
          <SecondScene id={useCase.id} />
        </div>
      </SceneScope>
    </Stack>
  );
}

/**
 * Second home section: the same kit in each of its six identities. Pick a
 * scene explicitly instead of a long pinned scroll gallery; examples stay in
 * scoped identities so the page chrome is never touched.
 */
export function HomeUseCasesSection() {
  const root = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<UseCaseId>("admin");
  const active: UseCase = USE_CASES.find((entry) => entry.id === activeId) ?? DEFAULT_USE_CASE;

  /** Fetch every identity's fonts shortly before the section is reached, so no scene swaps type once visible. */
  useEffect(() => {
    const node = root.current;
    if (!node || typeof document === "undefined" || !document.fonts) return;
    const warm = () => {
      for (const identity of identities) {
        for (const family of identity.fonts ?? []) {
          document.fonts.load(`1em "${family}"`).catch(() => undefined);
        }
      }
    };
    if (typeof IntersectionObserver === "undefined") {
      warm();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          warm();
          observer.disconnect();
        }
      },
      { rootMargin: "900px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Section
      bleed
      spacing="lg"
      containerWidth="wide"
      title="One kit, every kind of product"
      id="use-cases"
      description="Same components, six identities. Pick one to preview how it reads, with content that fits its use."
    >
      <div ref={root} data-home-use-cases className="min-w-0">
        <Stack gap={4} className="min-w-0">
          <Stack direction="horizontal" gap={2} className="flex-wrap" role="tablist" aria-label="Identity previews">
            {USE_CASES.map((useCase) => {
              const selected = activeId === useCase.id;
              return (
                <Button
                  key={useCase.id}
                  type="button"
                  role="tab"
                  id={`use-case-tab-${useCase.id}`}
                  aria-selected={selected}
                  aria-controls={`use-case-panel-${useCase.id}`}
                  variant={selected ? "default" : "outline"}
                  size="sm"
                  className="min-h-11 shrink-0"
                  onClick={() => setActiveId(useCase.id)}
                >
                  {useCase.identityLabel}
                </Button>
              );
            })}
          </Stack>
          <div
            role="tabpanel"
            id={`use-case-panel-${active.id}`}
            aria-labelledby={`use-case-tab-${active.id}`}
          >
            <UseCasePreview key={active.id} useCase={active} />
          </div>
          <Button asChild variant="ghost" className="h-11 w-fit px-0 text-primary underline-offset-4 hover:underline">
            <Link href="/docs/ui/design-your-identity">See all six identities</Link>
          </Button>
        </Stack>
      </div>
      <Stack direction="horizontal" gap={2} className="flex-wrap max-md:hidden">
        <Button asChild className="w-fit">
          <Link href="/docs/ui/design-your-identity">Design your identity</Link>
        </Button>
        <Button asChild variant="outline" className="w-fit">
          <Link href="/docs/start-without-writing-code">Start without writing code</Link>
        </Button>
      </Stack>
    </Section>
  );
}
