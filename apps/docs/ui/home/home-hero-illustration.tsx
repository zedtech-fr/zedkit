"use client";

import { useState } from "react";
import { Badge, Button, Stack, StatusDot, Surface, Text } from "@zedtech/zedkit-ui";
import { HOME_METADATA_TEXT_CLASS } from "@/ui/home/home-rhythm";
import { homeCopy } from "@/ui/home/i18n/home-copy";
import type { HeroKitId } from "@/ui/home/i18n/home-hero-copy";
import { useMotionOk } from "@/ui/home/use-motion-ok";

const copy = homeCopy.heroIllustration;

const COMBINED_STEPS = [
  { beat: "plan", label: copy.stepPlan, text: copy.combinedPlan, issue: false },
  { beat: "build", label: copy.stepBuild, text: copy.combinedBuild, issue: false },
  { beat: "check", label: copy.stepCheck, text: copy.combinedCheck, issue: true },
  { beat: "fix", label: copy.stepFix, text: copy.combinedFix, issue: false },
  { beat: "done", label: copy.stepDone, text: copy.combinedDone, issue: false },
] as const;

const AI_STEPS = [
  { beat: "plan", label: copy.stepPlan, text: copy.aiPlan, issue: false },
  { beat: "build", label: copy.stepBuild, text: copy.aiBuild, issue: false },
  { beat: "check", label: copy.stepCheck, text: copy.aiCheck, issue: true },
  { beat: "fix", label: copy.stepFix, text: copy.aiFix, issue: false },
  { beat: "done", label: copy.stepDone, text: copy.aiDone, issue: false },
] as const;

function RunRows({ steps }: { steps: typeof COMBINED_STEPS | typeof AI_STEPS }) {
  return (
    <ol className="trim-margin flex list-none flex-col">
      {steps.map((step) => (
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
  kit,
  motionOk,
  paused,
  onToggle,
}: {
  kit: "ai" | "combined";
  motionOk: boolean;
  paused: boolean;
  onToggle: () => void;
}) {
  const title = kit === "combined" ? copy.emptyStateTitle : copy.dueDatesTitle;
  const steps = kit === "combined" ? COMBINED_STEPS : AI_STEPS;
  const control = paused ? copy.play : copy.pause;

  return (
    <Surface variant="glass" elevation={3} radius="xl" padding="card" className="relative flex flex-col gap-stack-md">
      <Stack direction="horizontal" gap="sm" className="justify-between">
        <Text className="font-semibold">{title}</Text>
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
      <RunRows steps={steps} />
      <Text variant="muted" typeRole="caption" className={HOME_METADATA_TEXT_CLASS}>
        {copy.caption}
      </Text>
    </Surface>
  );
}

function SettingsCard() {
  return (
    <Surface variant="glass" elevation={3} radius="xl" padding="card" className="relative flex flex-col gap-stack-md">
      <Stack direction="horizontal" gap="sm" className="items-start justify-between">
        <Stack gap="tight">
          <Text className="font-semibold">{copy.settingsTitle}</Text>
          <Text variant="muted" typeRole="caption">
            {copy.settingsDescription}
          </Text>
        </Stack>
        <Stack direction="horizontal" gap="sm">
          <StatusDot tone="success" pulse={false} />
          <Text typeRole="caption">
            {copy.settingsActive}
          </Text>
        </Stack>
      </Stack>
      <Stack gap="sm">
        <Stack gap="tight">
          <Text typeRole="caption" className="font-medium">
            {copy.settingsWorkspace}
          </Text>
          <Text>{copy.settingsWorkspaceValue}</Text>
        </Stack>
        <Stack gap="tight">
          <Text typeRole="caption" className="font-medium">
            {copy.settingsRegion}
          </Text>
          <Text>{copy.settingsRegionValue}</Text>
        </Stack>
      </Stack>
    </Surface>
  );
}

/**
 * Site-owned high-value glass illustration. Not a live console, not an identity form.
 * Pause only freezes CSS step motion; nothing is fetched.
 */
export function HomeHeroIllustration({ kit }: { kit: HeroKitId }) {
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
      <span aria-hidden="true" data-hero-run-blob="1" className="pointer-events-none" />
      <span aria-hidden="true" data-hero-run-drift="" className="pointer-events-none" />
      <span aria-hidden="true" data-hero-run-blob="2" className="pointer-events-none" />
      {kit === "ui" ? (
        <SettingsCard />
      ) : (
        <RunCard kit={kit} motionOk={motionOk} paused={paused} onToggle={() => setPaused((value) => !value)} />
      )}
    </div>
  );
}
