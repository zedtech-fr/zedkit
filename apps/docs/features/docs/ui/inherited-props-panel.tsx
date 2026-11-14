import Link from "next/link";
import type { ReactNode } from "react";
import { Stack, Text } from "@zedtech/zedkit-ui";
import { inheritedPropsCopy } from "../i18n/inherited-props-copy";

const MDN_HTML_ATTRS = "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes";

export function InheritedPropsPanel({
  children,
  referenceHref = MDN_HTML_ATTRS,
  summary = inheritedPropsCopy.summary,
}: {
  children?: ReactNode;
  referenceHref?: string;
  summary?: string;
}) {
  return (
    <details data-inherited-props="" className="group rounded-md border">
      <summary data-props-summary="" className="cursor-pointer list-none px-control-inline py-control-block-lg text-dense font-medium text-foreground focus-ring-control [&::-webkit-details-marker]:hidden">
        <Text as="span" className="text-muted-foreground group-open:hidden">
          {inheritedPropsCopy.show(summary)}
        </Text>
        <Text as="span" className="hidden group-open:inline">
          {inheritedPropsCopy.hide(summary)}
        </Text>
      </summary>
      <Stack gap="sm" data-under-rule="" className="border-t px-control-inline pb-block">
        <Text variant="muted" className="text-caption">
          {inheritedPropsCopy.referenceLead}
          <Link href={referenceHref} className="text-primary link-offset hover:underline">
            {inheritedPropsCopy.referenceLink}
          </Link>
          {inheritedPropsCopy.referenceTail}
        </Text>
        {children ?? null}
      </Stack>
    </details>
  );
}
