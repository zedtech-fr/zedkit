"use client";

// Original work by the same author.
import { createContext, useContext } from "react";
import { createConsoleLogger, type Logger } from "./logger.js";
import type { ObservabilityContextValue, ObservabilityProviderProps } from "./react.types.js";
import { createNoopTracker, type EventMap, type Tracker } from "./tracker.js";

const ObservabilityContext = createContext<ObservabilityContextValue>({
  logger: createConsoleLogger(),
  tracker: createNoopTracker(),
});

export function ObservabilityProvider(props: ObservabilityProviderProps) {
  return (
    <ObservabilityContext.Provider
      value={{
        logger: props.logger ?? createConsoleLogger(),
        tracker: props.tracker ?? createNoopTracker(),
      }}
    >
      {props.children}
    </ObservabilityContext.Provider>
  );
}

export function useLogger(): Logger {
  return useContext(ObservabilityContext).logger;
}

export function useTracker<TEvents extends EventMap = EventMap>(): Tracker<TEvents> {
  return useContext(ObservabilityContext).tracker as Tracker<TEvents>;
}
