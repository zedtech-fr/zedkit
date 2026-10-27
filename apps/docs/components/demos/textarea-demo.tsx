"use client";

import * as React from "react";
import { Label, Stack, Text, Textarea } from "@zedtech/zedkit-ui";

const LIMIT = 280;

export function TextareaDemo() {
  const [note, setNote] = React.useState("Please leave the parcel with the concierge, flat 4B.");
  return (
    <Stack gap={2} className="min-w-0">
      <Label htmlFor="demo-note">Delivery note</Label>
      <Textarea
        id="demo-note"
        value={note}
        maxLength={LIMIT}
        placeholder="Anything the courier should know?"
        onChange={(event) => setNote(event.target.value)}
      />
      <Text variant="muted" className="text-xs" aria-live="polite">
        {note.length} / {LIMIT} characters
      </Text>
    </Stack>
  );
}
