"use client";

import { useState } from "react";
import { PromptInput, Stack, Text } from "@zedtech/zedkit-ui";
import { promptInputCopy } from "@/components/demos/i18n/prompt-input-copy";

export function PromptInputDemo() {
  const [text, setText] = useState("");
  const [sent, setSent] = useState("");

  return (
    <Stack gap="sm">
      <PromptInput
        sendLabel={promptInputCopy.sendLabel}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onSubmit={() => {
          setSent(text.trim());
          setText("");
        }}
        placeholder={promptInputCopy.simple.placeholder}
        aria-label={promptInputCopy.messageAriaLabel}
      />
      <Text variant="muted" aria-live="polite">
        {sent ? promptInputCopy.simple.sentLine(sent) : promptInputCopy.simple.idleHint}
      </Text>
    </Stack>
  );
}

export function PromptInputCompleteDemo() {
  const [text, setText] = useState<string>(promptInputCopy.complete.draft);
  const [pending, setPending] = useState(false);

  return (
    <Stack gap="sm">
      <PromptInput
        id="prompt-input-complete"
        sendLabel={promptInputCopy.sendLabel}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onSubmit={() => setPending(true)}
        busy={pending}
        onCancel={() => setPending(false)}
        cancelLabel={promptInputCopy.complete.cancelLabel}
        rows={1}
        maxLength={2000}
        aria-label={promptInputCopy.messageAriaLabel}
      />
      <Text variant="muted" aria-live="polite">
        {pending ? promptInputCopy.complete.waiting : promptInputCopy.complete.idleHint}
      </Text>
    </Stack>
  );
}
