// Original work by the same author.
import { pino, type DestinationStream, type Logger as PinoLogger } from "pino";
import type { LogContext, Logger, LogLevel } from "./logger.js";

export interface PinoLoggerOptions {
  name: string;
  level?: LogLevel;
  stream?: DestinationStream;
  /** Synchronous writes (useful in tests). */
  sync?: boolean;
}

function wrap(instance: PinoLogger): Logger {
  const split = (context?: LogContext) => {
    if (!context) return {};
    const { error, ...rest } = context;
    return error === undefined ? rest : { ...rest, err: error };
  };
  return {
    debug: (message, context) => instance.debug(split(context), message),
    info: (message, context) => instance.info(split(context), message),
    warn: (message, context) => instance.warn(split(context), message),
    error: (message, context) => instance.error(split(context), message),
    child: (bindings) => wrap(instance.child(bindings)),
  };
}

/** Wraps a `pino` instance behind the shared {@link Logger} port. */
export function createPinoLogger(options: PinoLoggerOptions): Logger {
  const instance = pino(
    {
      name: options.name,
      level: options.level ?? "info",
      ...(options.sync ? { sync: true } : {}),
    },
    options.stream,
  );
  return wrap(instance);
}
