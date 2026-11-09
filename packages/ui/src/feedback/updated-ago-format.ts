const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatUpdatedAgo(
  now: number,
  then: number,
  locale: string,
  justNow: string,
): string {
  const elapsed = Math.max(now - then, 0);
  if (elapsed < 5 * SECOND) return justNow;
  const unit: Intl.RelativeTimeFormatUnit =
    elapsed < MINUTE ? "second" : elapsed < HOUR ? "minute" : elapsed < DAY ? "hour" : "day";
  const amount =
    elapsed < MINUTE
      ? Math.floor(elapsed / SECOND)
      : elapsed < HOUR
        ? Math.floor(elapsed / MINUTE)
        : elapsed < DAY
          ? Math.floor(elapsed / HOUR)
          : Math.floor(elapsed / DAY);
  // Chromium puts a narrow no-break space in relative time; keep a regular space so copy stays greppable.
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
    .format(-amount, unit)
    .replace(/[\u00A0\u202F]/g, " ");
}
