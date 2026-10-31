"use client";

import { useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { Button, Stack, Text } from "@zedtech/zedkit-ui";

const MDN_HTML_ATTRS = "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes";

export function InheritedPropsPanel({
  children,
  referenceHref = MDN_HTML_ATTRS,
  summary = "inherited HTML attributes",
}: {
  children?: ReactNode;
  referenceHref?: string;
  summary?: string;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <Stack gap={2}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-fit"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? `Hide ${summary}` : `Show ${summary}`}
      </Button>
      {open ? (
        <Stack gap={2} id={panelId}>
          <Text variant="muted" className="text-xs">
            Standard attributes from the underlying element. See{" "}
            <Link href={referenceHref} className="text-primary underline-offset-4 hover:underline">
              MDN
            </Link>
            .
          </Text>
          {children ?? null}
        </Stack>
      ) : (
        <Text variant="muted" className="text-xs">
          Native element attributes (for example <code className="text-xs">disabled</code>,{" "}
          <code className="text-xs">type</code>, <code className="text-xs">onClick</code>) inherit from the host
          element.
        </Text>
      )}
    </Stack>
  );
}
