"use client";

import { IconLabel } from "@zedtech/zedkit-ui";

import { areaFromDocHref, areaIconFor } from "@/lib/domain-icons";

export function HomeScenarioTitle({ href, situation }: { href: string; situation: string }) {
  return <IconLabel icon={areaIconFor(areaFromDocHref(href))}>{situation}</IconLabel>;
}
