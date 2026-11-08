"use client";

import { Button, Stack, Text } from "@zedtech/zedkit-ui";

import { identityBriefCopy } from "@/components/i18n/identity-brief-copy";
import { linksInText, removeLink } from "@/lib/identity-links-in-text";

const copy = identityBriefCopy;

/** Host and path: two links on one host stay told apart. */
const urlLabel = (url: string) => (URL.canParse(url) ? `${new URL(url).host}${new URL(url).pathname === "/" ? "" : new URL(url).pathname}` : url);

/**
 * The links found in the brief, so the visitor sees what will be read and can drop one. There is nothing to fill in:
 * a link is read because it is in the text, and removing it here removes it from the text.
 */
export function DetectedLinks({ text, onText, fieldId, disabled = false }: { text: string; onText: (next: string) => void; fieldId: string; disabled?: boolean }) {
  const { urls, skipped } = linksInText(text);
  if (urls.length === 0 && skipped.length === 0) return null;
  const tooMany = skipped.some((item) => item.why === "too-many");
  return (
    <Stack gap={2} data-assistant-links="">
      {urls.length > 0 ? (
        <>
          <Text as="span" typeRole="body" className="font-medium text-foreground">
            {copy.links.found}
          </Text>
          <ul aria-label={copy.links.list} className="trim-margin flex list-none flex-wrap gap-stack-sm flush">
            {urls.map((url) => (
              <li key={url} data-assistant-link-chip="" className="muted-wash flex max-w-full content-shrink items-center gap-stack-tight rounded-full border border-border py-badge-block pr-chip-end pl-chip">
                <Text as="span" aria-hidden="true" className="size-pip shrink-0 rounded-full bg-primary" />
                <Text as="span" data-assistant-link-label="" typeRole="body" className="content-shrink truncate" title={url}>
                  {urlLabel(url)}
                </Text>
                <Button type="button" variant="ghost" size="sm" className="min-w-target rounded-full" disabled={disabled} aria-label={copy.links.remove(urlLabel(url))} onClick={() => {
                    onText(removeLink(text, url));
                    document.getElementById(fieldId)?.focus();
                  }}>
                  ×
                </Button>
              </li>
            ))}
          </ul>
          <Text variant="muted" typeRole="body">
            {copy.links.note}
          </Text>
        </>
      ) : null}
      {tooMany ? <Text variant="muted" typeRole="body">{copy.links.tooMany}</Text> : null}
    </Stack>
  );
}
