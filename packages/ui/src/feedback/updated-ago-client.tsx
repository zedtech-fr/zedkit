"use client";

import { useLayoutEffect, useState } from "react";

import { useUiMessages } from "../ui-provider.js";
import { formatUpdatedAgo } from "./updated-ago-format.js";

export function UpdatedAgoClient({
  then,
  prefix,
}: {
  then: number;
  prefix?: string;
}) {
  const messages = useUiMessages();
  const [now, setNow] = useState<number | null>(null);
  useLayoutEffect(() => {
    setNow(Date.now());
  }, []);
  const label = prefix ?? messages.updated;
  // Chromium may insert NBSP in medium dates; match Node so hydrate does not #418.
  const stamp =
    now === null
      ? new Intl.DateTimeFormat(messages.locale, { dateStyle: "medium", timeZone: "UTC" })
          .format(then)
          .replace(/[\u00A0\u202F]/g, " ")
      : formatUpdatedAgo(now, then, messages.locale, messages.justNow);
  return `${label} ${stamp}`;
}
