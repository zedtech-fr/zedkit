// Original work by the same author.
import type { ReactNode } from "react";
import type { Logger } from "./logger.js";
import type { Tracker } from "./tracker.js";

export interface ObservabilityContextValue {
  logger: Logger;
  tracker: Tracker;
}

export interface ObservabilityProviderProps {
  logger?: Logger;
  tracker?: Tracker;
  children: ReactNode;
}
