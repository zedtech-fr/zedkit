"use client";

import { useMotionPreference } from "@zedtech/zedkit-ui";

/** True once the visitor allows motion. False on the server and before hydration, so the static page is the baseline. */
export function useMotionOk(): boolean {
  return useMotionPreference() === "no-preference";
}
