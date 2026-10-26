"use client";

import { useCallback, useRef, useState } from "react";
import {
  Badge,
  Button,
  Heading,
  IdentityScope,
  ProgressBar,
  Section,
  Stack,
  StatusLabel,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  identities,
} from "@zedtech/zedkit-ui";
import { HomeAdminScene } from "@/ui/home/home-admin-scene";
import { HOME_CARD_CONTENT_GAP, HOME_SECTION_CONTENT_GAP, HOME_SECTION_REVEAL_CLASS } from "@/ui/home/home-rhythm";

type UseCaseId = "admin" | "shop" | "editorial" | "launch" | "monitoring" | "mobile";

type UseCase = {
  id: UseCaseId;
  tab: string;
  title: string;
  identity: string;
  identityLabel: string;
  why: string;
};

const USE_CASES: readonly UseCase[] = [
  {
    id: "admin",
    tab: "Admin",
    title: "An admin dashboard",
    identity: "mist",
    identityLabel: "Mist",
    why: "Tables, forms and status for people who work in it all day: calm colours, soft edges, nothing shouting.",
  },
  {
    id: "shop",
    tab: "Shop",
    title: "A shop or brand site",
    identity: "maison",
    identityLabel: "Maison",
    why: "Product first: ivory background, serif titles and generous space let photography and price carry the page.",
  },
  {
    id: "editorial",
    tab: "Editorial",
    title: "A blog or magazine",
    identity: "press",
    identityLabel: "Press",
    why: "Reading first: ink on paper, fine rules and a serif that stays comfortable for long articles.",
  },
  {
    id: "launch",
    tab: "Launch page",
    title: "A product landing page",
    identity: "volt",
    identityLabel: "Volt",
    why: "One electric accent on a dark, dense layout: the call to action is the only thing that glows.",
  },
  {
    id: "monitoring",
    tab: "Monitoring",
    title: "A live status board",
    identity: "tide",
    identityLabel: "Tide",
    why: "Bold, rounded and lively: state changes are easy to spot across a room.",
  },
  {
    id: "mobile",
    tab: "Mobile app",
    title: "A companion app",
    identity: "glass",
    identityLabel: "Glass",
    why: "Frosted layers over soft colour: light, touch-sized and at home on a phone.",
  },
];

const SCENE_CLASS = `min-w-0 overflow-hidden rounded-xl border bg-background p-card-padding ${HOME_SECTION_REVEAL_CLASS}`;
const SCENE_TITLE_CLASS = "font-(family-name:--zk-font-display) text-2xl leading-tight font-semibold text-balance";

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Stack gap={1}>
      <Text className="font-(family-name:--zk-font-display) text-xl font-semibold">{value}</Text>
      <Text variant="muted" className="text-xs">
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
          <Text variant="muted" className="text-xs">
            Free returns within 30 days.
          </Text>
        </Stack>
      );
    case "editorial":
      return (
        <Stack gap={HOME_CARD_CONTENT_GAP}>
          <Badge>Essay</Badge>
          <Text className={SCENE_TITLE_CLASS}>The quiet return of the long read</Text>
          <Text variant="muted" className="text-xs">
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
          <Text variant="muted" className="text-xs">
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
                <Text variant="muted" className="text-xs">
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
 * Second home section: the same kit, a different identity and different
 * content per use case. The visitor picks the case (tabs, arrow keys);
 * nothing plays by itself. Scenes are previews drawn with kit components
 * inside an `IdentityScope`, so they never touch the page's identity; they
 * are inert and hidden from assistive tech, and a caption says the same
 * thing in text. The soft fade is static under `prefers-reduced-motion`.
 */
export function HomeUseCasesSection() {
  const [value, setValue] = useState<UseCaseId>("admin");
  const warmed = useRef(false);

  /** Fetch every identity's fonts on first touch so a switch never swaps type mid-fade. */
  const warmFonts = useCallback(() => {
    if (warmed.current || typeof document === "undefined" || !document.fonts) return;
    warmed.current = true;
    for (const identity of identities) {
      for (const family of identity.fonts ?? []) {
        document.fonts.load(`1em "${family}"`).catch(() => undefined);
      }
    }
  }, []);

  return (
    <Section
      title="One kit, every kind of product"
      id="use-cases"
      description="Same components, a different identity and different content for each use case. Pick one to see how it reads."
    >
      <Tabs value={value} onValueChange={(next) => setValue(next as UseCaseId)} data-home-use-cases className="min-w-0">
        <Stack gap={HOME_SECTION_CONTENT_GAP} className="min-w-0">
          <TabsList
            aria-label="Use cases"
            onPointerEnter={warmFonts}
            onFocusCapture={warmFonts}
            onTouchStart={warmFonts}
            className="w-0 min-w-full justify-start md:w-fit md:min-w-0"
          >
            {USE_CASES.map((useCase) => (
              <TabsTrigger key={useCase.id} value={useCase.id}>
                {useCase.tab}
              </TabsTrigger>
            ))}
          </TabsList>
          {USE_CASES.map((useCase) => (
            <TabsContent key={useCase.id} value={useCase.id} className="mt-0">
              <Stack className="grid min-w-0 items-start gap-4 md:grid-cols-3">
                <Stack gap={2} className="min-w-0">
                  <Heading level={3}>{useCase.title}</Heading>
                  <Text variant="muted" className="text-xs">
                    Identity: {useCase.identityLabel}
                  </Text>
                  <Text variant="muted">{useCase.why}</Text>
                </Stack>
                <IdentityScope
                  identity={useCase.identity}
                  aria-hidden="true"
                  inert
                  data-use-case-scene={useCase.id}
                  className={`${SCENE_CLASS} md:col-span-2`}
                >
                  <Scene id={useCase.id} />
                </IdentityScope>
              </Stack>
            </TabsContent>
          ))}
        </Stack>
      </Tabs>
    </Section>
  );
}
