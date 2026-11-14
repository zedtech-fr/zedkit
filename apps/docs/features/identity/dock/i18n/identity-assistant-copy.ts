/** English copy the identity dock and suggest-client tests still read. Keys only; no markup. */

const minutes = (seconds: number) => Math.max(1, Math.ceil(seconds / 60));
const MINUTE_MS = 60_000;

/** Round up to the next displayed minute so the clock is never earlier than Retry-After. */
function ceilToMinute(at: Date): Date {
  const ms = at.getTime();
  const extra = ms % MINUTE_MS;
  return extra === 0 ? at : new Date(ms + (MINUTE_MS - extra));
}

function clock(at: Date): string {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" })
    .format(at)
    .replace(/[\u00A0\u202F]/g, " ");
}

function calendarDay(at: Date): number {
  return Date.UTC(at.getFullYear(), at.getMonth(), at.getDate());
}

/** "in 5 minutes", "after 2:30 PM" today, "tomorrow after 9:00 AM", or an explicit date further out. */
export function retryText(seconds: number | undefined, now: Date = new Date()): string {
  if (!seconds) return "Try again a little later.";
  if (seconds < 3_600) return `Try again in ${minutes(seconds)} ${minutes(seconds) === 1 ? "minute" : "minutes"}.`;
  const at = ceilToMinute(new Date(now.getTime() + seconds * 1000));
  const time = clock(at);
  const dayDelta = (calendarDay(at) - calendarDay(now)) / 86_400_000;
  if (dayDelta <= 0) return `Try again after ${time}.`;
  if (dayDelta === 1) return `Try again tomorrow after ${time}.`;
  const date = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" })
    .format(at)
    .replace(/[\u00A0\u202F]/g, " ");
  return `Try again after ${date}, ${time}.`;
}

export const identityAssistantCopy = {
  detailedEditorLink: "Open the detailed editor",
  views: {
    customize: "Customize this look",
    customizeHint: "Adjust the fields below; the page and its specimens follow.",
  },
  failure: {
    quota: (seconds?: number) => `The assistant limit has been reached. ${retryText(seconds)}`,
    rate: (seconds?: number) => `That was a lot of requests in a short time. ${retryText(seconds)}`,
    busy: "The assistant is busy with another request. Try again in a few seconds.",
    duplicate: "That request was already sent. Wait for its answer.",
    tooLarge: "That request is too long. Shorten it and try again.",
    emptyBrief: "Write a few words about your product first.",
    tooLong: (max: number) => `Keep it under ${max} characters.`,
    tooManyReferences: "Use at most 3 links.",
    invalidOutput: "The assistant's answer could not be used, so nothing changed. Try again or rephrase.",
    upstream: "The assistant is temporarily unavailable, so nothing changed. Try again in a moment.",
    timeout: "The assistant took too long, so nothing changed. Try again, with a shorter request if you can.",
    network: "The assistant could not be reached. Check your connection and try again.",
    invalidInput: "That request could not be sent. Check the text and the links.",
  },
} as const;

export function referenceReason(reason: string | undefined): string {
  const words: Record<string, string> = {
    protocol: "only http and https links are read, and https never back to http",
    credentials: "links with a login are not read",
    port: "only the standard port is read",
    "ip-literal": "links to an address are not read",
    hostname: "this kind of address is not read",
    "invalid-url": "this is not a valid link",
    "blocked-address": "this address is not allowed",
    "content-type": "it is not a web page",
    empty: "the page has no text to read",
    redirects: "it redirects too many times",
    timeout: "it took too long to answer",
    "not-found": "the address was not found",
    unreachable: "it could not be reached",
  };
  if (reason && /^status-\d{3}$/.test(reason)) return `the page answered with ${reason.slice(7)}`;
  return (reason && Object.hasOwn(words, reason) && words[reason]) || "it could not be read";
}
