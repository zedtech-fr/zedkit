import { tryCatch } from "@zedtech/zedkit-core";

const MS_PER_SECOND = 1_000;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;

function instantMs(value: number | Date): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  return Number.NaN;
}

function durationMs(input: number | { start: number | Date; end: number | Date }): number {
  if (typeof input === "number") return input;
  if (input !== null && typeof input === "object") {
    return instantMs(input.end) - instantMs(input.start);
  }
  return Number.NaN;
}

function resolveLocale(locale: string): string {
  const supported = tryCatch(() => Intl.NumberFormat.supportedLocalesOf([locale])[0]);
  return supported.ok && supported.value ? supported.value : "en";
}

function formatDigits(value: number, locale: string, pad: boolean): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
    useGrouping: false,
    ...(pad ? { minimumIntegerDigits: 2 } : {}),
  }).format(value);
}

/** Compact elapsed time: `6m 17s` under an hour, `1h 02m` from an hour up. Digits follow `locale`; unit letters stay Latin. */
export function formatDuration(
  input: number | { start: number | Date; end: number | Date },
  locale = "en",
): string {
  const tag = resolveLocale(locale);
  const ms = durationMs(input);
  const totalSeconds = Number.isFinite(ms) && ms > 0 ? Math.floor(ms / MS_PER_SECOND) : 0;
  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
  if (hours >= 1) {
    const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
    return `${formatDigits(hours, tag, false)}h ${formatDigits(minutes, tag, true)}m`;
  }
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return `${formatDigits(minutes, tag, false)}m ${formatDigits(seconds, tag, true)}s`;
}
