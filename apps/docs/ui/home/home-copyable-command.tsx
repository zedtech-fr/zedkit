"use client";

/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- Command scroll regions need keyboard focus. */

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@zedtech/zedkit-ui";
import { HOME_SMALL_TEXT_CLASS } from "@/ui/home/home-rhythm";

export function HomeCopyableCommand({
  value,
  ariaLabel,
  copyLabel,
}: {
  value: string;
  ariaLabel: string;
  copyLabel: string;
}) {
  const [copied, setCopied] = useState(false);
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
    <div
      data-install-command=""
      className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-muted/30 py-1 pr-1 pl-3"
    >
      {/* A span, not <pre>/<code>: the identity bridge draws chrome on both. */}
      <div
        tabIndex={0}
        role="region"
        className={`${HOME_SMALL_TEXT_CLASS} min-w-0 flex-1 overflow-x-auto py-2 font-mono leading-none whitespace-nowrap`}
        aria-label={ariaLabel}
      >
        <span>{value}</span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0"
        aria-label={copyLabel}
        onClick={copy}
      >
        {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      </Button>
    </div>
  );
}
