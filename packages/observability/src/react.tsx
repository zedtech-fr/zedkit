"use client";

// Original work by the same author.
import { createContext, useContext, useMemo } from "react";
import { createConsoleLogger, type Logger } from "./logger.js";
import type { ObservabilityContextValue, ObservabilityProviderProps } from "./react.types.js";
import { createNoopTracker, type EventMap, type Tracker } from "./tracker.js";

const defaultLogger = createConsoleLogger();
const defaultTracker = createNoopTracker();

const ObservabilityContext = createContext<ObservabilityContextValue>({
  logger: defaultLogger,
  tracker: defaultTracker,
});

export function ObservabilityProvider(props: ObservabilityProviderProps) {
  const value = useMemo(
    () => ({
      logger: props.logger ?? defaultLogger,
      tracker: props.tracker ?? defaultTracker,
    }),
    [props.logger, props.tracker],
  );
  return <ObservabilityContext.Provider value={value}>{props.children}</ObservabilityContext.Provider>;
}

export function useLogger(): Logger {
  return useContext(ObservabilityContext).logger;
}

export function useTracker<TEvents extends EventMap = EventMap>(): Tracker<TEvents> {
  return useContext(ObservabilityContext).tracker as Tracker<TEvents>;
}
