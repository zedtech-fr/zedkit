"use client";

import { useState } from "react";
import { Button, Input, Text, useUiMessages } from "@zedtech/zedkit-ui";
import { homeCopyCommandCopy } from "@/ui/home/i18n/home-copy-command-copy";

/**
 * Attached single-line command field with a solid black Copy.
 *
 * Métier:           zedkit publishes npm packages and a docs site, not a hosted app.
 * Client personas:  Integrating developers and coding agents who adopt from home; they want one paste.
 * Customers:        The developer's own users — this page does not sell to them.
 * Customer personas: Rushed on 1440 or 390. Assumed from existing home briefs, not interviews.
 * UI decisions:     Docs-owned Input + site-action Copy, because: the kit shown-once secret
 *                   (icon, outline, optional wrap) must stay that on catalog/setup; the mockup
 *                   control is a site action on a command line. Visible Copy/Copied with caller
 *                   aria-label (Copied while copied), because: smoke needs "Copy prompt" ≠
 *                   "Copy closing prompt", and WCAG 2.5.3 needs the name to match the visible word.
 *                   Single-line overflow inside the input, because: wrapping is today's defect and
 *                   the ticket asks to truncate or scroll on 390.
 */
export function HomeCopyCommandField({
  value,
  "aria-label": ariaLabel,
  copyLabel,
}: {
  value: string;
  "aria-label": string;
  copyLabel: string;
}) {
  const messages = useUiMessages();
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  // shortcut: clipboard copy/fail is SecretField verbatim; extract a shared hook when a third caller appears.
  const copy = (): void => {
    const clipboard = navigator.clipboard;
    if (!clipboard) {
      setCopied(false);
      setCopyFailed(true);
      return;
    }
    clipboard.writeText(value).then(
      () => {
        setCopyFailed(false);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {
        setCopied(false);
        setCopyFailed(true);
      },
    );
  };

  return (
    <div data-home-copy-command="">
      <Input
        readOnly
        value={value}
        spellCheck={false}
        autoComplete="off"
        className="content-shrink font-mono"
        aria-label={ariaLabel}
      />
      <Button
        type="button"
        variant="default"
        data-site-action=""
        className="min-h-target shrink-0"
        aria-label={copied ? homeCopyCommandCopy.copied : copyLabel}
        onClick={copy}
      >
        {copied ? homeCopyCommandCopy.copied : homeCopyCommandCopy.copy}
      </Button>
      <Text as="span" className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {copied ? messages.copied : copyFailed ? messages.copyFailed : ""}
      </Text>
    </div>
  );
}
