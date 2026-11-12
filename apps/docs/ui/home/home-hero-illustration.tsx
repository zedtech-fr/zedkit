"use client";

import { useState } from "react";
import { Badge, Button, Stack, Surface, Text } from "@zedtech/zedkit-ui";
import { HOME_METADATA_TEXT_CLASS, HOME_PARALLAX_SCROLL_PROPS } from "@/ui/home/home-rhythm";
import { homeHeroCopy } from "@/ui/home/i18n/home-hero-copy";
import { useMotionOk } from "@/ui/home/use-motion-ok";

const copy = homeHeroCopy.heroIllustration;

const COMBINED_STEPS = [
  { beat: "plan", label: copy.stepPlan, text: copy.combinedPlan, issue: false },
  { beat: "build", label: copy.stepBuild, text: copy.combinedBuild, issue: false },
  { beat: "check", label: copy.stepCheck, text: copy.combinedCheck, issue: true },
  { beat: "fix", label: copy.stepFix, text: copy.combinedFix, issue: false },
  { beat: "done", label: copy.stepDone, text: copy.combinedDone, issue: false },
] as const;

function RunRows() {
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

function RunCard({
  motionOk,
  paused,
  onToggle,
}: {
  motionOk: boolean;
  paused: boolean;
  onToggle: () => void;
}) {
  const control = paused ? copy.play : copy.pause;

  return (
    <Surface variant="glass" elevation={3} radius="xl" padding="card" className="relative flex flex-col gap-stack-md">
      <Stack direction="horizontal" gap="sm" className="justify-between">
        <Text className="font-semibold">{copy.emptyStateTitle}</Text>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={motionOk ? "min-h-target w-fit" : "pointer-events-none invisible min-h-target w-fit"}
          tabIndex={motionOk ? undefined : -1}
          aria-hidden={motionOk ? undefined : true}
          aria-label={paused ? copy.playMotion : copy.pauseMotion}
          aria-pressed={paused}
          onClick={motionOk ? onToggle : undefined}
        >
          {control}
        </Button>
      </Stack>
      <RunRows />
      <Text variant="muted" typeRole="caption" className={HOME_METADATA_TEXT_CLASS}>
        {copy.caption}
      </Text>
    </Surface>
  );
}

/**
 * Site-owned high-value glass illustration. Not a live console, not an identity form.
 * Pause only freezes CSS step motion; nothing is fetched.
 */
export function HomeHeroIllustration() {
  const motionOk = useMotionOk();
  const [paused, setPaused] = useState(false);

  return (
    <div
      role="group"
      aria-label={copy.caption}
      data-home-hero-preview=""
      data-hero-run-stage=""
      data-paused={motionOk && paused ? "" : undefined}
      className="relative content-shrink overflow-clip"
    >
      <div
        {...HOME_PARALLAX_SCROLL_PROPS}
        aria-hidden="true"
        className="pointer-events-none absolute pin-fill"
      >
        <span data-hero-run-blob="1" />
        <span data-hero-run-drift="" />
        <span data-hero-run-blob="2" />
      </div>
      <RunCard motionOk={motionOk} paused={paused} onToggle={() => setPaused((value) => !value)} />
    </div>
  );
}
