// Original work by the same author.

export type EventMap = Record<string, Record<string, unknown>>;

export interface Tracker<TEvents extends EventMap = EventMap> {
  identify(userId: string, traits?: Record<string, unknown>): void;
  capture<TName extends keyof TEvents & string>(event: TName, properties: TEvents[TName]): void;
  reset(): void;
}

export function createNoopTracker<TEvents extends EventMap = EventMap>(): Tracker<TEvents> {
  return { identify: () => undefined, capture: () => undefined, reset: () => undefined };
}

export function createConsoleTracker<TEvents extends EventMap = EventMap>(): Tracker<TEvents> {
  const sink = globalThis.console;
  return {
    identify: (userId, traits) => sink.info("[tracker] identify", userId, traits ?? {}),
    capture: (event, properties) => sink.info("[tracker] capture", event, properties),
    reset: () => sink.info("[tracker] reset"),
  };
}

export function createMemoryTracker<TEvents extends EventMap = EventMap>(): {
  tracker: Tracker<TEvents>;
  captured: Array<{ event: string; properties: Record<string, unknown> }>;
  identified: Array<{ userId: string; traits?: Record<string, unknown> }>;
} {
  const captured: Array<{ event: string; properties: Record<string, unknown> }> = [];
  const identified: Array<{ userId: string; traits?: Record<string, unknown> }> = [];
  return {
    captured,
    identified,
    tracker: {
      identify: (userId, traits) => {
        if (traits === undefined) identified.push({ userId });
        else identified.push({ userId, traits });
      },
      capture: (event, properties) => void captured.push({ event, properties }),
      reset: () => {
        captured.length = 0;
        identified.length = 0;
      },
    },
  };
}
