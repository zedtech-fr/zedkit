"use client";

import { formatUpdatedAgo } from "./updated-ago-format.js";
import { useUiMessages } from "./ui-provider.js";

export function UpdatedAgoClient({
  then,
  prefix,
  fallback,
}: {
  then: number;
  prefix?: string;
  fallback: string;
}) {
  const messages = useUiMessages();
  if (messages.locale === "en") return fallback;
  return `${prefix ?? messages.updated} ${formatUpdatedAgo(Date.now(), then, messages.locale, messages.justNow)}`;
}
