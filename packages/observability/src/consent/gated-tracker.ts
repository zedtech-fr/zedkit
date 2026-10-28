// Original work by the same author.
import type { EventMap, Tracker } from "../tracker.js";
import type { ConsentCategory, ConsentStore } from "./store.js";
import { isCategoryGranted } from "./store.js";

/** Drops tracker calls until the store grants the given category. */
export function createConsentGatedTracker<TEvents extends EventMap = EventMap>(
  tracker: Tracker<TEvents>,
  store: ConsentStore,
  category: ConsentCategory,
): Tracker<TEvents> {
  const allowed = () => isCategoryGranted(store.read(), category);
  return {
    identify: (userId, traits) => {
      if (allowed()) tracker.identify(userId, traits);
    },
    capture: (event, properties) => {
      if (allowed()) tracker.capture(event, properties);
    },
    reset: () => {
      if (allowed()) tracker.reset();
    },
  };
}

export type ConsentLoader = () => void | (() => void);

/** Runs `load` once when consent for `category` is granted; optional cleanup on revoke. */
export function runConsentGatedLoader(
  store: ConsentStore,
  category: ConsentCategory,
  load: ConsentLoader,
): () => void {
  let cleanup: (() => void) | undefined;
  let loaded = false;

  const sync = () => {
    const granted = isCategoryGranted(store.read(), category);
    if (granted && !loaded) {
      loaded = true;
      const result = load();
      cleanup = typeof result === "function" ? result : undefined;
      return;
    }
    if (!granted && loaded) {
      loaded = false;
      cleanup?.();
      cleanup = undefined;
    }
  };

  sync();
  return store.subscribe(sync);
}
