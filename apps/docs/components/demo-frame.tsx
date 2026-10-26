"use client";

import type { ReactNode } from "react";
import { PreviewViewport } from "./preview-viewport";

/** Light/dark/mobile viewport around one registry demo (home and tutorials). */
export function DemoFrame({ children }: { children: ReactNode }) {
  return <PreviewViewport>{children}</PreviewViewport>;
}
