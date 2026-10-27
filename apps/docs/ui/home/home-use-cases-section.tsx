"use client";

import { useEffect, useRef, type ComponentProps } from "react";
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
import { HOME_CARD_CONTENT_GAP } from "@/ui/home/home-rhythm";

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

/**
 * Renders a subtree in another identity than the page, through the kit's
 * `data-identity-scope` attribute contract (identities.css): tokens, fonts and
 * radii come from `identity`, `<html>` is never touched.
 */
function SceneScope({ identity, ...props }: ComponentProps<"div"> & { identity: string }) {
  return <div data-identity-scope="" data-identity={identity} {...props} />;
}

const SCENE_CLASS = "min-w-0 overflow-hidden rounded-xl border bg-background p-card-padding";
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
 * Second home section: the same kit in each of its six identities, one
 * block per identity, shown as the page scrolls. Every block has the
 * identity name and a line of text, and a scene drawn with kit components
 * inside an identity scope, so the page identity is never touched. Scenes
 * are inert previews hidden from assistive tech; the text next to each says
 * the same thing. The entrance is a soft scroll-linked fade (globals.css),
 * absent under `prefers-reduced-motion` and where scroll timelines are not
 * supported; nothing is hidden and nothing moves the layout.
 */
export function HomeUseCasesSection() {
  const root = useRef<HTMLDivElement>(null);

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
      title="One kit, every kind of product"
      id="use-cases"
      description="Same components, six identities. Scroll to see how each one reads, with content that fits its use."
    >
      <div ref={root} data-home-use-cases className="flex min-w-0 flex-col gap-10 md:gap-16">
        {USE_CASES.map((useCase) => (
          <article
            key={useCase.id}
            data-use-case={useCase.id}
            aria-labelledby={`use-case-${useCase.id}`}
            className="grid min-w-0 items-start gap-4 md:grid-cols-3"
          >
            <Stack gap={2} className="min-w-0 md:sticky md:top-24">
              <Text variant="muted" className="text-xs">
                Identity: {useCase.identityLabel}
              </Text>
              <Heading level={3} id={`use-case-${useCase.id}`}>
                {useCase.title}
              </Heading>
              <Text variant="muted">{useCase.why}</Text>
            </Stack>
            <SceneScope
              identity={useCase.identity}
              aria-hidden="true"
              inert
              data-use-case-scene={useCase.id}
              className={`${SCENE_CLASS} font-sans text-foreground md:col-span-2`}
            >
              <Scene id={useCase.id} />
            </SceneScope>
          </article>
        ))}
      </div>
    </Section>
  );
}
