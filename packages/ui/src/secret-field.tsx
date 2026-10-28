"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "./button.js";
import { Input } from "./input.js";
import { useUiMessages } from "./ui-provider.js";

export interface SecretFieldProps {
  /** Element id, so a Label can point at it. */
  id?: string;
  /** The secret text (shown once by the caller, never logged). */
  value: string;
  /** Accessible label for the copy button. */
  copyLabel?: string;
  /**
   * Accessible name for the value input. Required unless an external
   * Label points at `id` — every input must have a label.
   */
  "aria-label"?: string;
}

/**
 * Shown-once secret with a copy button: read-only value, clipboard
 * on click, check feedback for 2s. Falls back to no-op when the
 * clipboard API is unavailable (insecure contexts).
 */
function SecretField({ id, value, copyLabel, "aria-label": ariaLabel }: SecretFieldProps) {
  const messages = useUiMessages();
  const [copied, setCopied] = React.useState(false);
  const copy = (): void => {
    const clipboard = navigator.clipboard;
    if (!clipboard) return;
    clipboard.writeText(value).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {},
    );
  };
  return (
    <div data-slot="secret-field" className="flex w-full items-center gap-secret-field-gap">
      <Input id={id} readOnly value={value} className="font-mono" aria-label={ariaLabel} />
      <Button type="button" variant="outline" size="icon" aria-label={copyLabel ?? messages.copyToClipboard} onClick={copy}>
        {copied ? <Check className="size-icon-control" /> : <Copy className="size-icon-control" />}
      </Button>
    </div>
  );
}

export { SecretField };
