"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Stack } from "@zedtech/zedkit-ui";
import type { HomeBelowHeroProps } from "@/ui/home/home-below-hero";

const HomeBelowHero = dynamic(
  () => import("@/ui/home/home-below-hero").then((mod) => ({ default: mod.HomeBelowHero })),
  { loading: () => <HomeBelowHeroPlaceholder /> },
);

function HomeBelowHeroPlaceholder() {
  return (
    <Stack aria-busy="true" className="min-h-screen w-full">
      <section id="entry-points" className="sr-only" />
      <section id="scenarios" className="sr-only" />
      <section id="proofs" className="sr-only" />
      <section id="components" className="sr-only" />
    </Stack>
  );
}

/** Loads the below-hero chunk after idle so hero TBT stays lower (#618). */
export function HomeBelowHeroDeferred(props: HomeBelowHeroProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const enable = () => setShow(true);
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(enable, { timeout: 2000 });
      return () => cancelIdleCallback(id);
    }
    const timer = window.setTimeout(enable, 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!show) {
    return <HomeBelowHeroPlaceholder />;
  }

  return <HomeBelowHero {...props} />;
}
