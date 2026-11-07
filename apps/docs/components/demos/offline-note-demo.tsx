"use client";

import { useState } from "react";
import { Badge, Button, Heading, OfflineNote, Stack, Text, useOnlineStatus } from "@zedtech/zedkit-ui";
import { offlineNoteCopy } from "@/components/demos/i18n/offline-note-copy";

const DRAFTS = [offlineNoteCopy.drafts.harbor, offlineNoteCopy.drafts.northwind];

/** A page-level note above work that is still saved on the device. */
export function OfflineNoteDemo() {
  return (
    <Stack gap={3} className="content-shrink rounded-lg border border-border bg-background surface-pad-md">
      <OfflineNote />
      <Heading level={3}>{offlineNoteCopy.drafts.title}</Heading>
      <ul aria-label={offlineNoteCopy.drafts.label} className="divide-y divide-border rounded-lg border border-border">
        {DRAFTS.map((draft) => (
          <li key={draft.id} className="flex content-shrink flex-wrap items-center justify-between gap-x-4 gap-y-1 surface-pad-inline surface-pad-block">
            <Stack gap={1} className="content-shrink">
              <Text as="span" className="font-medium">
                {draft.id}
              </Text>
              <Text as="span" variant="muted" className="text-xs">
                {draft.client}
              </Text>
            </Stack>
            <Stack direction="horizontal" gap={3} className="items-center">
              <Text as="span" className="text-sm">
                {draft.amount}
              </Text>
              <Badge variant="secondary">{offlineNoteCopy.drafts.waiting}</Badge>
            </Stack>
          </li>
        ))}
      </ul>
    </Stack>
  );
}

/** Wired to the real hook; the button fires the same window events a lost connection does. */
export function OfflineNoteWiredDemo() {
  const online = useOnlineStatus();
  const [saved, setSaved] = useState(0);
  const simulate = () => window.dispatchEvent(new Event(online ? "offline" : "online"));
  return (
    <Stack gap={3} className="content-shrink rounded-lg border border-border bg-background surface-pad-md">
      {online ? null : <OfflineNote title={offlineNoteCopy.wired.title}>{offlineNoteCopy.wired.body}</OfflineNote>}
      <Stack gap={1}>
        <Heading level={3}>{offlineNoteCopy.wired.heading}</Heading>
        <Text variant="muted" className="text-sm">
          {offlineNoteCopy.wired.summary(saved)}
        </Text>
      </Stack>
      <Stack direction="horizontal" gap={2} className="flex-wrap">
        <Button disabled={!online} onClick={() => setSaved((count) => count + 1)}>
          {offlineNoteCopy.wired.save}
        </Button>
        <Button variant="outline" aria-pressed={!online} onClick={simulate}>
          {online ? offlineNoteCopy.wired.simulateOffline : offlineNoteCopy.wired.simulateOnline}
        </Button>
      </Stack>
    </Stack>
  );
}

/** Own wording: say what is kept and what the next step is. */
export function OfflineNoteWordingDemo() {
  return (
    <Stack gap={3} className="content-shrink rounded-lg border border-border bg-background surface-pad-md">
      <OfflineNote title={offlineNoteCopy.wording.title}>{offlineNoteCopy.wording.body}</OfflineNote>
      <Stack gap={1}>
        <Heading level={3}>{offlineNoteCopy.wording.heading}</Heading>
        <Text variant="muted" className="text-sm">
          {offlineNoteCopy.wording.summary}
        </Text>
      </Stack>
      <Button disabled className="w-fit">
        {offlineNoteCopy.wording.pay}
      </Button>
    </Stack>
  );
}
