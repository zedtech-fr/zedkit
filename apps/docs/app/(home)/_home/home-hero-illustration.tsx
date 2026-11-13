"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Stack, StatusDot, Surface, Text, useMotionPreference } from "@zedtech/zedkit-ui";
import { OffPathLink } from "@/ui/off-path-link";
import {
  fetchActiveHeroRun,
  followRunHref,
  heroRunTitle,
  heroStepLabel,
  liveUpdateMessage,
  nextLivePollMs,
  resolveRunsApiBase,
  type HeroActiveRun,
  type HeroStepStatus,
} from "./home-hero-active-run";
import { HOME_METADATA_TEXT_CLASS, HOME_PARALLAX_SCROLL_PROPS } from "./home-rhythm";
import { homeHeroCopy } from "./i18n/home-hero-copy";
import { HomeLink } from "./sections/home-link";

const copy = homeHeroCopy.heroIllustration;

const COMBINED_STEPS = [
  { beat: "plan", label: copy.stepPlan, text: copy.combinedPlan, issue: false },
  { beat: "build", label: copy.stepBuild, text: copy.combinedBuild, issue: false },
  { beat: "check", label: copy.stepCheck, text: copy.combinedCheck, issue: true },
  { beat: "fix", label: copy.stepFix, text: copy.combinedFix, issue: false },
  { beat: "done", label: copy.stepDone, text: copy.combinedDone, issue: false },
] as const;

const HERO_LINK_CLASS =
  "inline-flex min-h-target w-fit items-center text-dense text-muted-foreground link-offset focus-ring hover:underline";

const STEP_STATUS_COPY: Record<HeroStepStatus, string> = {
  pending: copy.statusPending,
  active: copy.statusActive,
  done: copy.statusDone,
  failed: copy.statusFailed,
  skipped: copy.statusSkipped,
};

const STEP_DOT: Record<HeroStepStatus, { tone: "active" | "idle" | "success" | "danger"; pulse: boolean }> = {
  pending: { tone: "idle", pulse: false },
  skipped: { tone: "idle", pulse: false },
  active: { tone: "active", pulse: true },
  done: { tone: "success", pulse: false },
  failed: { tone: "danger", pulse: false },
};

function PlaceholderRows() {
  return (
    <ol className="trim-margin flex list-none flex-col">
      {COMBINED_STEPS.map((step) => (
        <li key={step.beat} data-hero-run-step="" data-hero-run-beat={step.beat}>
          <Text as="span" className="font-semibold">
            {step.label}
          </Text>
          <div className="inline-flex flex-wrap items-center gap-icon">
            {step.issue ? <Badge variant="soft-info">{copy.issueBadge}</Badge> : null}
            <Text as="span" variant="muted">
              {step.text}
            </Text>
          </div>
        </li>
      ))}
    </ol>
  );
}

function LiveRows({ run }: { run: HeroActiveRun }) {
  return (
    <ol className="trim-margin flex list-none flex-col">
      {run.steps.map((step) => {
        const dot = STEP_DOT[step.status];
        return (
          <li
            key={step.key}
            data-hero-run-step=""
            data-hero-run-beat={step.key}
            data-hero-run-status={step.status}
          >
            <Text as="span" className="font-semibold">
              {heroStepLabel(step.key, copy)}
            </Text>
            <div className="inline-flex content-shrink flex-wrap items-center gap-icon">
              <StatusDot tone={dot.tone} pulse={dot.pulse} />
              <Text as="span" variant="muted" className="line-clamp-1">
                {STEP_STATUS_COPY[step.status]}
                {step.summary === null ? "" : ` · ${step.summary}`}
              </Text>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function PlaceholderLinks() {
  return (
    <Stack direction="horizontal" gap="md" className="min-h-target flex-wrap">
      <HomeLink href="/issues?open=first" className={HERO_LINK_CLASS}>
        {copy.viewPublicRun}
      </HomeLink>
    </Stack>
  );
}

function LiveLinks({ run }: { run: HeroActiveRun }) {
  const follow = followRunHref(run);
  return (
    <Stack direction="horizontal" gap="md" className="min-h-target flex-wrap">
      {follow === null ? null : follow.offPath ? (
        <OffPathLink href={follow.href} className={HERO_LINK_CLASS}>
          {copy.followRun}
        </OffPathLink>
      ) : (
        <HomeLink href={follow.href} className={HERO_LINK_CLASS}>
          {copy.followRun}
        </HomeLink>
      )}
      <HomeLink href="/issues" className={HERO_LINK_CLASS}>
        {copy.allRuns}
      </HomeLink>
    </Stack>
  );
}

function RunCard({
  motionOk,
  paused,
  live,
  onToggle,
}: {
  motionOk: boolean;
  paused: boolean;
  live: HeroActiveRun | null;
  onToggle: () => void;
}) {
  const showPause = motionOk || live !== null;
  const pauseLabel = live === null ? (paused ? copy.playMotion : copy.pauseMotion) : paused ? copy.playLive : copy.pauseLive;
  const control = paused ? copy.play : copy.pause;
  const title = live === null ? copy.emptyStateTitle : heroRunTitle(live, copy);
  const caption = live === null ? copy.caption : paused ? copy.liveCaptionPaused : copy.liveCaption;

  return (
    <Surface variant="glass" elevation={3} radius="xl" padding="card" className="relative flex flex-col gap-stack-md">
      <Stack direction="horizontal" gap="sm" className="justify-between">
        <Text className="line-clamp-2 font-semibold wrap-anywhere">{title}</Text>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={showPause ? "min-h-target w-fit" : "pointer-events-none invisible min-h-target w-fit"}
          tabIndex={showPause ? undefined : -1}
          aria-hidden={showPause ? undefined : true}
          aria-label={pauseLabel}
          aria-pressed={paused}
          onClick={showPause ? onToggle : undefined}
        >
          {control}
        </Button>
      </Stack>
      {live === null ? <PlaceholderRows /> : <LiveRows run={live} />}
      <Text variant="muted" typeRole="caption" className={HOME_METADATA_TEXT_CLASS}>
        {caption}
      </Text>
      {live === null ? <PlaceholderLinks /> : <LiveLinks run={live} />}
    </Surface>
  );
}

function useActiveHeroRun(paused: boolean): HeroActiveRun | null {
  const [live, setLive] = useState<HeroActiveRun | null>(null);

  useEffect(() => {
    const envValue = process.env.NEXT_PUBLIC_ZEDOS_RUNS_API_BASE;
    const base = resolveRunsApiBase({
      ...(envValue === undefined ? {} : { envValue }),
      hostname: window.location.hostname,
    });
    const delay = nextLivePollMs(paused, base);
    if (delay === null) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const schedule = () => {
      if (cancelled || controller.signal.aborted) return;
      timer = setTimeout(tick, delay);
    };

    const tick = () => {
      void fetchActiveHeroRun({
        ...(envValue === undefined ? {} : { envValue }),
        hostname: window.location.hostname,
        signal: controller.signal,
      })
        .then((result) => {
          if (cancelled || controller.signal.aborted) return;
          if (result.ok) setLive(result.value);
        })
        .catch(() => undefined)
        .then(schedule, schedule);
    };

    tick();
    return () => {
      cancelled = true;
      controller.abort();
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [paused]);

  return live;
}

/**
 * Site-owned high-value glass illustration. Client-fetches one active run
 * and falls back to the static placeholder on empty, stale, or fetch failure.
 * Pause freezes CSS step motion and live polling (no fetch while paused).
 */
export function HomeHeroIllustration() {
  const motionOk = useMotionPreference() === "no-preference";
  const [paused, setPaused] = useState(false);
  const live = useActiveHeroRun(paused);

  return (
    <div
      role="group"
      aria-label={copy.stageLabel}
      data-home-hero-preview=""
      data-hero-run-stage=""
      data-hero-run-live={live === null ? undefined : ""}
      data-allow-clip=""
      data-paused={paused ? "" : undefined}
      className="relative content-shrink overflow-clip"
    >
      <p role="status" className="sr-only">
        {live === null ? "" : liveUpdateMessage(live, copy, paused)}
      </p>
      <div
        {...HOME_PARALLAX_SCROLL_PROPS}
        aria-hidden="true"
        className="pointer-events-none absolute pin-fill"
      >
        <span data-hero-run-blob="1" />
        <span data-hero-run-drift="" />
        <span data-hero-run-blob="2" />
      </div>
      <RunCard
        motionOk={motionOk}
        paused={paused}
        live={live}
        onToggle={() => setPaused((value) => !value)}
      />
    </div>
  );
}
