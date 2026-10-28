// Original work by the same author.
import type { EventMap, Tracker } from "./tracker.js";

/** Minimal surface of a browser analytics client (for example `posthog-js`). */
export interface ProductAnalyticsClient {
  identify(distinctId: string, properties?: Record<string, unknown>): void;
  capture(event: string, properties?: Record<string, unknown>): void;
  reset(): void;
}

/** Forwards typed events to a product-analytics SDK at the composition root. */
export function createProductAnalyticsTracker<TEvents extends EventMap = EventMap>(
  client: ProductAnalyticsClient,
): Tracker<TEvents> {
  return {
    identify: (userId, traits) => client.identify(userId, traits),
    capture: (event, properties) => client.capture(event, properties),
    reset: () => client.reset(),
  };
}
