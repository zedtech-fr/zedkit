"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button, Stack, Text } from "@zedtech/zedkit-ui";
import { adoptionCopy } from "@/components/i18n/adoption-copy";
import { aiSetupCopy } from "@/features/docs/i18n/ai-setup-copy";
import {
  AI_SETUP_DOCS_PATH,
  AI_SETUP_LLMS_URL,
  AI_SETUP_MINI_PROMPT,
} from "@/lib/ai-setup-onboarding.generated";

type CopyState = "idle" | "copied" | "failed";

function CopyPromptButton({ text }: { text: string }) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function settle(next: CopyState) {
    setState(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2000);
  }

  function copy() {
    const clipboard = typeof navigator === "undefined" ? undefined : navigator.clipboard;
    if (!clipboard) return settle("failed");
    clipboard.writeText(text).then(
      () => settle("copied"),
      () => settle("failed"),
    );
  }

  const label = adoptionCopy.copyLabel(aiSetupCopy.prompt.copyWhat);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="shrink-0 focus-visible:-outline-offset-(--ring-width)"
        aria-label={label}
        onClick={copy}
      >
        {state === "copied" ? <Check className="size-icon" aria-hidden /> : <Copy className="size-icon" aria-hidden />}
      </Button>
      <Text as="span" role="status" className="sr-only">
        {state === "copied" ? adoptionCopy.copied : state === "failed" ? adoptionCopy.copyFailed : ""}
      </Text>
    </>
  );
}

/** One-line setup prompt + copy control; used on the AI setup guide. */
export function AiSetupPrompt() {
  return (
    <Stack
      gap="sm"
      data-setup-prompt=""
      className={
        // not-prose is a fumadocs escape hatch, not a Tailwind utility.
        // eslint-disable-next-line better-tailwindcss/no-unknown-classes
        "not-prose rounded-lg border border-border muted-wash surface-pad-md"
      }
    >
      <Text as="p" variant="muted" className="trim-margin">
        {aiSetupCopy.prompt.pasteBefore}{" "}
        <a href={AI_SETUP_LLMS_URL} className="underline">
          {AI_SETUP_LLMS_URL}
        </a>
        {aiSetupCopy.prompt.pasteAfter}
      </Text>
      <Stack direction="horizontal" gap="sm" className="content-shrink items-start justify-between">
        <pre className="content-shrink flex-1 overflow-x-auto rounded-md bg-background px-control-inline surface-pad-block-sm font-mono text-dense break-words whitespace-pre-wrap">
          {AI_SETUP_MINI_PROMPT}
        </pre>
        <CopyPromptButton text={AI_SETUP_MINI_PROMPT} />
      </Stack>
      <Text as="p" variant="muted" className="trim-margin">
        {aiSetupCopy.prompt.walkthroughLead}{" "}
        <a href={AI_SETUP_DOCS_PATH} className="underline">
          {AI_SETUP_DOCS_PATH}
        </a>
      </Text>
    </Stack>
  );
}
