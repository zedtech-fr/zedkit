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
      className="relative min-w-0 rounded-md border border-border/80 bg-muted/20"
    >
      <div
        tabIndex={0}
        role="region"
        className={`${HOME_SMALL_TEXT_CLASS} overflow-x-auto p-3 pr-12 font-mono leading-relaxed whitespace-nowrap`}
        aria-label={ariaLabel}
      >
        <pre className="m-0 font-[inherit] leading-[inherit] whitespace-nowrap text-[inherit]">{value}</pre>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2"
        aria-label={copyLabel}
        onClick={copy}
      >
        {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      </Button>
    </div>
  );
}
