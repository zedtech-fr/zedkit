"use client";

import type { ReactNode } from "react";

import { devtoolsEnabled } from "./enabled.js";
import { ZedkitDevtoolsPanel, type ZedkitDevtoolsPanelProps } from "./panel.js";

export type ZedkitDevtoolsProps = ZedkitDevtoolsPanelProps & {
  enabled?: boolean;
  force?: boolean;
  children?: ReactNode;
};

export function ZedkitDevtools({ enabled, force, children, ...panel }: ZedkitDevtoolsProps) {
  const show = enabled ?? devtoolsEnabled(force ? { force: true } : {});
  if (!show) return children ?? null;
  return (
    <>
      {children}
      <ZedkitDevtoolsPanel {...panel} />
    </>
  );
}

export { ZedkitDevtoolsPanel, type DevtoolsBuildInfoRow, type DevtoolsLocaleOption, type ZedkitDevtoolsPanelProps } from "./panel.js";
