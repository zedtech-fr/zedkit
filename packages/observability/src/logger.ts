// Original work by the same author.

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = Record<string, unknown> & { error?: unknown };

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  child(bindings: LogContext): Logger;
}

export const noopLogger: Logger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  child: () => noopLogger,
};

const CONSOLE_METHOD_BY_LEVEL: Record<LogLevel, "debug" | "info" | "warn" | "error"> = {
  debug: "debug",
  info: "info",
  warn: "warn",
  error: "error",
};

export function createConsoleLogger(bindings: LogContext = {}): Logger {
  const sink = globalThis.console;
  const emit = (level: LogLevel, message: string, context?: LogContext) => {
    const payload = { ...bindings, ...context };
    const args = Object.keys(payload).length > 0 ? [message, payload] : [message];
    sink[CONSOLE_METHOD_BY_LEVEL[level]](...args);
  };
  return {
    debug: (m, c) => emit("debug", m, c),
    info: (m, c) => emit("info", m, c),
    warn: (m, c) => emit("warn", m, c),
    error: (m, c) => emit("error", m, c),
    child: (extra) => createConsoleLogger({ ...bindings, ...extra }),
  };
}

export interface CapturedLog {
  level: LogLevel;
  message: string;
  context: LogContext;
}

export function createMemoryLogger(): { logger: Logger; entries: CapturedLog[] } {
  const entries: CapturedLog[] = [];
  const make = (bindings: LogContext): Logger => ({
    debug: (m, c) => entries.push({ level: "debug", message: m, context: { ...bindings, ...c } }),
    info: (m, c) => entries.push({ level: "info", message: m, context: { ...bindings, ...c } }),
    warn: (m, c) => entries.push({ level: "warn", message: m, context: { ...bindings, ...c } }),
    error: (m, c) => entries.push({ level: "error", message: m, context: { ...bindings, ...c } }),
    child: (extra) => make({ ...bindings, ...extra }),
  });
  return { logger: make({}), entries };
}
