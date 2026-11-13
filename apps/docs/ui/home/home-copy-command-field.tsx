"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Text, useUiMessages } from "@zedtech/zedkit-ui";
import { homeCopyCommandCopy } from "@/ui/home/i18n/home-copy-command-copy";

function selectAll(node: HTMLElement): void {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(node);
  selection.removeAllRanges();
  selection.addRange(range);
}

// shortcut: SecretField plus a copied-timer reset; extract a shared hook when a third caller appears.
function useCopiedClipboard(value: string) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(copiedTimer.current), []);
  const copy = (): void => {
    setCopyFailed(false);
    const clipboard = navigator.clipboard;
    if (!clipboard) {
      setCopied(false);
      setCopyFailed(true);
      return;
    }
    clipboard.writeText(value).then(
      () => {
        setCopied(true);
        clearTimeout(copiedTimer.current);
        copiedTimer.current = setTimeout(() => setCopied(false), 2000);
      },
      () => {
        setCopied(false);
        setCopyFailed(true);
      },
    );
  };
  return { copied, copyFailed, copy };
}

/**
 * Attached wrapping command field with a solid black Copy.
 *
 * Métier:           zedkit publishes npm packages and a docs site, not a hosted app.
 * Client personas:  Integrating developers and coding agents who adopt from home; they want one paste.
 * Customers:        The developer's own users — this page does not sell to them.
 * Customer personas: Rushed on 1440 or 390. Assumed from existing home briefs, not interviews.
 * UI decisions:     Docs-owned wrapping kit Text + site-action Copy, because: the kit shown-once secret
 *                   (icon, outline, optional wrap) must stay that on catalog/setup; the mockup
 *                   control is a site action on a command line. Visible Copy/Copied with caller
 *                   aria-label (Copied while copied), because: smoke needs "Copy prompt" ≠
 *                   "Copy closing prompt", and WCAG 2.5.3 needs the name to match the visible word.
 *                   Name/describe the field `role=group`, because a generic Text span cannot be
 *                   named (WCAG 4.1.2). Value span is tabIndex=0 and selects on focus, because:
 *                   clipboard-denied keyboard users need a native copy path (WCAG 2.1.1).
 *                   Wrapping value + attached site-action Copy, because: the mockup wraps and
 *                   visitors must read the sentence they paste.
 */
export function HomeCopyCommandField({
  value,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  copyLabel,
}: {
  value: string;
  "aria-label": string;
  "aria-describedby"?: string;
  copyLabel: string;
}) {
  const messages = useUiMessages();
  const { copied, copyFailed, copy } = useCopiedClipboard(value);
  return (
    <div
      data-home-copy-command=""
      role="group"
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    >
      <Text
        as="span"
        data-home-copy-command-value=""
        tabIndex={0}
        className="content-shrink px-field-pad py-control-block font-mono wrap-anywhere whitespace-pre-wrap focus-ring-control"
        onFocus={(event) => selectAll(event.currentTarget)}
      >
        {value}
      </Text>
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
