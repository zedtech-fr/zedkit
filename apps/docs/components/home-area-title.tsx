"use client";

import { IconLabel } from "@zedtech/zedkit-ui";

import { domainIconFor } from "@/lib/domain-icons";

export function HomeAreaTitle({ title }: { title: string }) {
  return <IconLabel icon={domainIconFor(title)}>{title}</IconLabel>;
}
