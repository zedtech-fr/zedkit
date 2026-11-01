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
import { IDENTITY_EDITOR_HREF } from "@/lib/site-links.mjs";
import { HOME_CARD_CONTENT_GAP, HOME_CARD_TITLE_CLASS, HOME_METADATA_TEXT_CLASS, HOME_PERSUASION_TEXT_CLASS } from "@/ui/home/home-rhythm";
import { homeCopy } from "@/ui/home/i18n/home-copy";
import type { HomeUseCaseId } from "@/ui/home/i18n/home-use-cases-copy";

type UseCaseId = HomeUseCaseId;
type UseCase = (typeof homeCopy.useCases.cases)[number];

const USE_CASES = homeCopy.useCases.cases;
const DEFAULT_USE_CASE: UseCase = USE_CASES[0]!;
const scenes = homeCopy.useCases.scenes;
const secondScenes = homeCopy.useCases.secondScenes;
const useCasesSection = homeCopy.useCases.section;

/**
 * Renders a subtree in another identity than the page, through the kit's
 * `data-identity-scope` attribute contract (identities.css): tokens, fonts and
 * radii come from `identity`, `<html>` is never touched.
 */
function SceneScope({ identity, ...props }: ComponentProps<"div"> & { identity: string }) {
  return <div data-identity-scope="" data-identity={identity} {...props} />;
}

const SCENE_CLASS = "min-w-0 overflow-hidden rounded-xl border bg-background p-card-padding";
const SCENE_BADGE_CLASS = "w-fit";
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
    case "shop": {
      const c = scenes.shop;
      return (
        <Stack gap={HOME_CARD_CONTENT_GAP}>
          <Badge className={SCENE_BADGE_CLASS}>{c.badge}</Badge>
          <Text className={SCENE_TITLE_CLASS}>{c.title}</Text>
          <Text variant="muted">{c.body}</Text>
          <Text className="font-(family-name:--zk-font-display) text-xl font-semibold">{c.price}</Text>
          <Stack direction="horizontal" gap={2} className="flex-wrap">
            <Button size="sm">{c.addToBasket}</Button>
            <Button size="sm" variant="outline">
              {c.sizeGuide}
            </Button>
          </Stack>
          <Text variant="muted" className={HOME_METADATA_TEXT_CLASS}>
            {c.returns}
          </Text>
        </Stack>
      );
    }
    case "editorial": {
      const c = scenes.editorial;
      return (
        <Stack gap={HOME_CARD_CONTENT_GAP}>
          <Badge className={SCENE_BADGE_CLASS}>{c.badge}</Badge>
          <Text className={SCENE_TITLE_CLASS}>{c.title}</Text>
          <Text variant="muted" className={HOME_METADATA_TEXT_CLASS}>
            {c.byline}
          </Text>
          <Text>{c.body}</Text>
          <Stack direction="horizontal">
            <Button size="sm" variant="outline">
              {c.read}
            </Button>
          </Stack>
        </Stack>
      );
    }
    case "launch": {
      const c = scenes.launch;
      return (
        <Stack gap={HOME_CARD_CONTENT_GAP}>
          <Badge className={SCENE_BADGE_CLASS}>{c.badge}</Badge>
          <Text className={SCENE_TITLE_CLASS}>{c.title}</Text>
          <Text variant="muted">{c.body}</Text>
          <Stack direction="horizontal" gap={2} className="flex-wrap">
            <Button size="sm">{c.startFree}</Button>
            <Button size="sm" variant="outline">
              {c.seePricing}
            </Button>
          </Stack>
          <Stack direction="horizontal" gap={6} className="flex-wrap">
            <Stat value={c.fasterSetupValue} label={c.fasterSetupLabel} />
            <Stat value={c.configValue} label={c.configLabel} />
          </Stack>
        </Stack>
      );
    }
    case "monitoring": {
      const c = scenes.monitoring;
      return (
        <Stack gap={HOME_CARD_CONTENT_GAP}>
          <Stack direction="horizontal" gap={2} className="items-center justify-between">
            <Badge className={SCENE_BADGE_CLASS}>{c.liveBadge}</Badge>
            <StatusLabel tone="updating">{c.checkingStatus}</StatusLabel>
          </Stack>
          <Text className={SCENE_TITLE_CLASS}>{c.title}</Text>
          <ProgressBar value={83} label={c.progressLabel} />
          <Text variant="muted" className={HOME_METADATA_TEXT_CLASS}>
            {c.body}
          </Text>
          <Stack direction="horizontal">
            <Button size="sm" variant="outline">
              {c.openLog}
            </Button>
          </Stack>
        </Stack>
      );
    }
    case "mobile": {
      const c = scenes.mobile;
      return (
        <Stack gap={HOME_CARD_CONTENT_GAP}>
          <Badge className={SCENE_BADGE_CLASS}>{c.badge}</Badge>
          <Text className={SCENE_TITLE_CLASS}>{c.title}</Text>
          <Stack gap={2}>
            {c.tasks.map((task, index) => (
              <Stack
                key={task}
                direction="horizontal"
                gap={2}
                className="items-center justify-between rounded-lg border px-3 py-2"
              >
                <Text>{task}</Text>
                <Text variant="muted" className={HOME_METADATA_TEXT_CLASS}>
                  {c.taskTimes[index]}
                </Text>
              </Stack>
            ))}
          </Stack>
          <Stack direction="horizontal">
            <Button size="sm">{c.addTask}</Button>
          </Stack>
        </Stack>
      );
    }
  }
}

/**
 * A second, smaller example next to the main one, drawn in the same
 * identity. On narrow screens the two panels stack in one column.
 */
function SecondScene({ id }: { id: UseCaseId }) {
  switch (id) {
    case "admin": {
      const c = secondScenes.admin;
      return (
        <Stack gap={HOME_CARD_CONTENT_GAP}>
          <Badge className={SCENE_BADGE_CLASS}>{c.badge}</Badge>
          <Text className={SCENE_TITLE_CLASS}>{c.title}</Text>
          <Text variant="muted">{c.body}</Text>
          <StatusLabel tone="saved">{c.saved}</StatusLabel>
          <Stack direction="horizontal" gap={2} className="flex-wrap">
            <Button size="sm">{c.sendInvite}</Button>
            <Button size="sm" variant="outline">
              {c.cancel}
            </Button>
          </Stack>
        </Stack>
      );
    }
    case "editorial": {
      const c = secondScenes.editorial;
      return (
        <Stack gap={HOME_CARD_CONTENT_GAP}>
          <Badge className={SCENE_BADGE_CLASS}>{c.badge}</Badge>
          <Text className={SCENE_TITLE_CLASS}>{c.quote}</Text>
          <Text variant="muted" className={HOME_METADATA_TEXT_CLASS}>
            {c.attribution}
          </Text>
        </Stack>
      );
    }
    case "monitoring": {
      const c = secondScenes.monitoring;
      return (
        <Stack gap={HOME_CARD_CONTENT_GAP}>
          <Badge className={SCENE_BADGE_CLASS}>{c.badge}</Badge>
          {c.regions.map(([region, latency]) => (
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
    }
    case "launch": {
      const c = secondScenes.launch;
      return (
        <Stack gap={HOME_CARD_CONTENT_GAP}>
          <Badge className={SCENE_BADGE_CLASS}>{c.badge}</Badge>
          <Text className={SCENE_TITLE_CLASS}>{c.price}</Text>
          <Text variant="muted">{c.body}</Text>
          <Stack direction="horizontal">
            <Button size="sm">{c.startFree}</Button>
          </Stack>
        </Stack>
      );
    }
    case "shop": {
      const c = secondScenes.shop;
      return (
        <Stack gap={HOME_CARD_CONTENT_GAP}>
          <Badge className={SCENE_BADGE_CLASS}>{c.badge}</Badge>
          {c.items.map(([name, price]) => (
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
    }
    case "mobile": {
      const c = secondScenes.mobile;
      return (
        <Stack gap={HOME_CARD_CONTENT_GAP}>
          <Badge className={SCENE_BADGE_CLASS}>{c.badge}</Badge>
          <Text className={SCENE_TITLE_CLASS}>{c.title}</Text>
          <Text variant="muted">{c.body}</Text>
          <Stack direction="horizontal" gap={2} className="flex-wrap">
            <Button size="sm">{c.join}</Button>
            <Button size="sm" variant="outline">
              {c.snooze}
            </Button>
          </Stack>
        </Stack>
      );
    }
  }
}

function UseCasePreview({ useCase }: { useCase: UseCase }) {
  return (
    <Stack gap={4} className="min-w-0">
      <Stack gap={2} className="min-w-0">
        <Text variant="muted" className={HOME_METADATA_TEXT_CLASS}>
          {useCasesSection.identityPrefix}
          {useCase.identityLabel}
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
        <div className={`${SCENE_CLASS} md:col-span-2`}>
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
      title={useCasesSection.title}
      id="use-cases"
      description={useCasesSection.description}
    >
      <div ref={root} data-home-use-cases className="min-w-0">
        <Stack gap={4} className="min-w-0">
          <Stack direction="horizontal" gap={2} className="flex-wrap" role="tablist" aria-label={useCasesSection.tablistAriaLabel}>
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
                  variant={selected ? "secondary" : "outline"}
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
          <Button asChild variant="link" size="sm" className="w-fit">
            <Link href={IDENTITY_EDITOR_HREF}>{useCasesSection.openDemoEditor}</Link>
          </Button>
        </Stack>
      </div>
      <Stack direction="horizontal" gap={2} className="flex-wrap">
        <Button asChild className="w-fit">
          <Link href={IDENTITY_EDITOR_HREF}>{useCasesSection.tryDemoEditor}</Link>
        </Button>
        <Button asChild variant="outline" className="w-fit">
          <Link href="/docs/start-without-writing-code">{useCasesSection.startWithoutCode}</Link>
        </Button>
      </Stack>
    </Section>
  );
}
