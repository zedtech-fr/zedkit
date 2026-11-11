"use client";

import { useEffect, useState } from "react";
import { Heading, Text, useMotionPreference, WordRoll } from "@zedtech/zedkit-ui";
import { aiSetupCopy } from "@/components/i18n/ai-setup-copy";

const ROTATE_MS = 2800;
const ROLL_DWELL_MS = 300;

/** Accent the rolling word only; inherit Heading weight/size — no type size on the slot. */
const ROLL_ACCENT =
  "[&_[data-word-roll=in]]:text-primary [&_[data-word-roll=in]]:underline [&_[data-word-roll=in]]:link-offset [&_[data-word-roll=exit]]:text-primary [&_[data-word-roll=exit]]:underline [&_[data-word-roll=exit]]:link-offset";

/**
 * Page H1 for the AI setup guide. SSR and the client paint the same tree
 * (first word + WordRoll) so hydration does not swap a long title for a short
 * one. The interval only starts when motion is allowed. The accessible name
 * is stable: the rotating segment is decorative (`aria-hidden` on the slot).
 */
export function AiSetupPageTitle() {
  const motion = useMotionPreference();
  const motionOk = motion === "no-preference";
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!motionOk) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % aiSetupCopy.title.words.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [motionOk]);

  const word = aiSetupCopy.title.words[index] ?? aiSetupCopy.title.words[0];

  return (
    <>
      <Heading level={1} typeRole="title" className="mb-stack text-balance" aria-label={aiSetupCopy.title.h1Label}>
        {aiSetupCopy.title.prefix}{" "}
        <WordRoll words={aiSetupCopy.title.words} value={word} dwellMs={ROLL_DWELL_MS} className={ROLL_ACCENT} data-setup-word="" aria-hidden />
      </Heading>
      <Text as="p" variant="muted" className="mb-lead text-balance">
        {aiSetupCopy.title.lead}
      </Text>
    </>
  );
}
