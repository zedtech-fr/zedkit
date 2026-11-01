import Link from "next/link";
import type { ReactNode } from "react";
import { Stack, Text } from "@zedtech/zedkit-ui";

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
  return (
    <details className="group rounded-md border border-border/40 open:border-border/60">
      <summary className="min-h-[max(2.75rem,44px)] cursor-pointer list-none px-3 py-2 text-sm font-medium text-foreground focus-ring-control [&::-webkit-details-marker]:hidden">
        <Text as="span" className="text-muted-foreground group-open:hidden">
          Show {summary}
        </Text>
        <Text as="span" className="hidden group-open:inline">
          Hide {summary}
        </Text>
      </summary>
      <Stack gap={2} className="border-t border-border/40 px-3 pt-2 pb-3">
        <Text variant="muted" className="text-xs">
          Standard attributes from the underlying element. See{" "}
          <Link href={referenceHref} className="text-primary underline-offset-4 hover:underline">
            MDN
          </Link>
          .
        </Text>
        {children ?? null}
      </Stack>
    </details>
  );
}
