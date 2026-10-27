// Original work by the same author.

/** Injectable time source for deterministic tests and domain code. */
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = { now: () => new Date() };

export const fixedClock = (at: Date): Clock => ({ now: () => new Date(at) });
