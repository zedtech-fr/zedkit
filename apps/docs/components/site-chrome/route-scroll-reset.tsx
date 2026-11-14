"use client";

import { InPageAnchorScroll, ScrollReset } from "@zedtech/zedkit-ui";
import { usePathname } from "next/navigation";

/** Land at the top of each new page (or its #anchor); back/forward keeps its position. InPageAnchorScroll scrolls same-document fragment clicks, including a repeat of the current hash. */
export function RouteScrollReset() {
  const pathname = usePathname();
  return (
    <>
      <ScrollReset routeKey={pathname} />
      <InPageAnchorScroll />
    </>
  );
}
