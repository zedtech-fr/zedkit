"use client";

import { Badge, Heading, ProgressBar, ScrollScenes, Stack, Text } from "@zedtech/zedkit-ui";

/**
 * Scene visuals are decorative: the caption carries the message, so each
 * visual is hidden from assistive tech and made inert (no tab stops inside).
 */
const VISUAL_CLASS = "min-w-0 rounded-xl border border-border bg-background p-4";

function Caption({ step, title, children }: { step: string; title: string; children: string }) {
  return (
    <Stack gap={2} className="min-w-0">
      <Text variant="muted" className="m-0! text-xs">
        {step}
      </Text>
      <Heading level={3} className="m-0!">{title}</Heading>
      <Text variant="muted" className="m-0!">{children}</Text>
    </Stack>
  );
}

function Visual({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <Stack gap={3} aria-hidden="true" inert data-demo-scene-visual={id} className={VISUAL_CLASS}>
      {children}
    </Stack>
  );
}

function TaskRow({ name, owner, status }: { name: string; owner: string; status: "To do" | "Doing" | "Done" }) {
  return (
    <Stack direction="horizontal" gap={3} className="min-w-0 items-center justify-between border-b border-border pb-2 last:border-b-0 last:pb-0">
      <Stack gap={1} className="min-w-0">
        <Text className="m-0! truncate font-medium">{name}</Text>
        <Text variant="muted" className="m-0! truncate text-xs">
          {owner}
        </Text>
      </Stack>
      <Badge variant={status === "Done" ? "secondary" : "outline"}>{status}</Badge>
    </Stack>
  );
}

/** A three-step product tour for a fictional app, pinned under a 4.5rem header. */
export function ScrollScenesDemo() {
  return (
    <ScrollScenes
      className="[--zk-scenes-top:4.5rem]"
      scenes={[
        {
          id: "plan",
          caption: (
            <Caption step="Step 1 of 3" title="Plan the week">
              Harbor Studio starts with one list: what has to ship, and who owns it.
            </Caption>
          ),
          children: (
            <Visual id="plan">
              <TaskRow name="Landing page copy" owner="Inès" status="To do" />
              <TaskRow name="Pricing table" owner="Malo" status="To do" />
              <TaskRow name="Launch checklist" owner="Inès" status="To do" />
            </Visual>
          ),
        },
        {
          id: "track",
          caption: (
            <Caption step="Step 2 of 3" title="Track the work">
              Progress updates as people tick tasks, so nobody asks for a status report.
            </Caption>
          ),
          children: (
            <Visual id="track">
              <TaskRow name="Landing page copy" owner="Inès" status="Done" />
              <TaskRow name="Pricing table" owner="Malo" status="Doing" />
              <ProgressBar value={55} label="Week 43 progress" />
            </Visual>
          ),
        },
        {
          id: "ship",
          caption: (
            <Caption step="Step 3 of 3" title="Ship with confidence">
              Everything is green, the checklist is done: publish in one click.
            </Caption>
          ),
          children: (
            <Visual id="ship">
              <TaskRow name="Landing page copy" owner="Inès" status="Done" />
              <TaskRow name="Pricing table" owner="Malo" status="Done" />
              <ProgressBar value={100} label="Week 43 progress" />
            </Visual>
          ),
        },
      ]}
    />
  );
}

/** Two scenes with a shorter scroll per scene: before / after on a changelog page. */
export function ScrollScenesBeforeAfterDemo() {
  return (
    <ScrollScenes
      className="[--zk-scenes-step:45svh] [--zk-scenes-top:4.5rem]"
      scenes={[
        {
          id: "before",
          caption: (
            <Caption step="Before" title="One long form">
              Twelve fields on one screen: people left before the end.
            </Caption>
          ),
          children: (
            <Visual id="before">
              <ProgressBar value={18} label="Completed sign-ups" />
              <Text variant="muted" className="m-0!">18% of visitors finished the form.</Text>
            </Visual>
          ),
        },
        {
          id: "after",
          caption: (
            <Caption step="After" title="Three short steps">
              The same questions, split in three steps with a progress bar.
            </Caption>
          ),
          children: (
            <Visual id="after">
              <ProgressBar value={64} label="Completed sign-ups" />
              <Text variant="muted" className="m-0!">64% of visitors finished the steps.</Text>
            </Visual>
          ),
        },
      ]}
    />
  );
}
