// Original work by the same author.

export type ErrorKind = "domain" | "transient" | "permanent";

export class DomainError extends Error {
  readonly kind = "domain" as const;

  constructor(
    readonly code: string,
    message: string,
    readonly details?: unknown,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "DomainError";
  }
}

export class TransientError extends Error {
  readonly kind = "transient" as const;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "TransientError";
  }
}

export class PermanentError extends Error {
  readonly kind = "permanent" as const;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "PermanentError";
  }
}

/** Maps thrown values to a retry/DLQ policy kind. Unknown errors count as transient. */
export function classifyError(error: unknown): ErrorKind {
  if (error instanceof DomainError) return "domain";
  if (error instanceof PermanentError) return "permanent";
  return "transient";
}
