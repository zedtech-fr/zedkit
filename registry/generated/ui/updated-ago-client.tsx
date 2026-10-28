"use client";

import { formatUpdatedAgo } from "@/components/ui/updated-ago-format";
import { useUiMessages } from "@/components/ui/ui-provider";

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
