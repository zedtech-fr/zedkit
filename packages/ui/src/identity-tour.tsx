"use client";

import * as React from "react";

import { tryCatch } from "@zedtech/zedkit-core";

import { Button } from "./button.js";
import {
  DEFAULT_IDENTITY,
  IDENTITY_CHANGE_EVENT,
  identities as builtInIdentities,
  type IdentityOption,
} from "./identity.js";
import { cn } from "./utils.js";

/** localStorage key set once the tour has started (it never replays). */
const IDENTITY_TOUR_STORAGE_KEY = "zk-identity-tour";

/**
 * Layout tokens held at the settled identity's values while the tour
 * runs, so nothing around the visitor moves: only colors, shapes,
 * shadows and fonts change. Values are the stock ones when the settled
 * identity does not define the token.
 */
const PINNED_LAYOUT_TOKENS: Readonly<Record<string, string>> = {
  "--spacing": "0.25rem",
  "--zk-density": "1",
  "--zk-control-scale": "1",
  "--text-xs": "0.75rem",
  "--text-sm": "0.875rem",
  "--text-base": "1rem",
  "--text-lg": "1.125rem",
  "--text-xl": "1.25rem",
  "--text-2xl": "1.5rem",
  "--text-3xl": "1.875rem",
  "--text-4xl": "2.25rem",
};

/** Time given to fetch fonts before the tour starts anyway. */
const FONT_WAIT_MS = 1500;
/** Time the tokens keep transitioning after the last step. */
const SETTLE_MS = 600;

type IdentityTourOptions = {
  /** Identities to cycle through. Default: the built-in set. */
  identities?: readonly IdentityOption[];
  /** Time each identity stays on screen, in milliseconds. Default 1000. */
  stepMs?: number;
  /** Identity the page settles on when `data-identity` is absent. */
  defaultIdentity?: string;
  /** localStorage key of the "already played" flag. */
  storageKey?: string;
  /** Set to false to never play (for example on a page that is not the entry point). */
  enabled?: boolean;
};

type IdentityTourState = {
  running: boolean;
  /** Zero-based position of the identity on screen. */
  step: number;
  total: number;
  /** Identity on screen, null when idle. */
  current: IdentityOption | null;
  /** Stop now and settle on the identity the visitor would have anyway. */
  skip: () => void;
};

let playedThisPage = false;

function prefersReducedMotion() {
  return (
    typeof window.matchMedia !== "function" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function hasPlayed(key: string) {
  const read = tryCatch(() => window.localStorage.getItem(key));
  // Storage blocked: only the page-level flag can prevent a replay.
  return read.ok ? read.value !== null : playedThisPage;
}

function markPlayed(key: string) {
  playedThisPage = true;
  // Storage blocked: the page-level flag still prevents a replay while the page stays open.
  tryCatch(() => window.localStorage.setItem(key, "1"));
}

/** Resolves once the page has loaded and the browser is idle, so the tour never competes with LCP. */
function afterLoadAndIdle(): Promise<void> {
  return new Promise((resolve) => {
    const idle = () => {
      if (typeof window.requestIdleCallback === "function")
        window.requestIdleCallback(() => resolve(), { timeout: 1500 });
      else window.setTimeout(resolve, 200);
    };
    if (document.readyState === "complete") idle();
    else window.addEventListener("load", idle, { once: true });
  });
}

/** Fetch the fonts of every identity in the tour, bounded by FONT_WAIT_MS, so no step swaps fonts mid-flight. */
function preloadFonts(list: readonly IdentityOption[]): Promise<void> {
  if (!document.fonts || typeof document.fonts.load !== "function")
    return Promise.resolve();
  const loads: Promise<unknown>[] = [];
  for (const item of list) {
    for (const family of item.fonts ?? []) {
      for (const weight of [400, 700])
        loads.push(
          document.fonts.load(`${weight} 1em "${family}"`).catch(() => []),
        );
    }
  }
  const bounded = new Promise<void>((resolve) =>
    window.setTimeout(resolve, FONT_WAIT_MS),
  );
  return Promise.race([Promise.all(loads).then(() => undefined), bounded]);
}

function whenVisible(): Promise<void> {
  return new Promise((resolve) => {
    if (document.visibilityState !== "hidden") return resolve();
    const onChange = () => {
      if (document.visibilityState === "hidden") return;
      document.removeEventListener("visibilitychange", onChange);
      resolve();
    };
    document.addEventListener("visibilitychange", onChange);
  });
}

/**
 * First-visit tour: cycles `data-identity` through every identity,
 * then settles on the visitor's own identity (the stored choice or the
 * default). Plays once per browser, never under reduced motion, and
 * never writes the persisted identity. Any click, tap or key press
 * skips it. Render `<IdentityTour />` for the ready-made label, or use
 * this hook to build your own.
 */
function useIdentityTour(options: IdentityTourOptions = {}): IdentityTourState {
  const [step, setStep] = React.useState<number | null>(null);
  const optionsRef = React.useRef(options);
  optionsRef.current = options;
  const orderRef = React.useRef<readonly IdentityOption[]>([]);
  const stopRef = React.useRef<() => void>(() => undefined);
  const enabled = options.enabled ?? true;

  React.useEffect(() => {
    const {
      identities = builtInIdentities,
      stepMs = 1000,
      defaultIdentity = DEFAULT_IDENTITY,
      storageKey = IDENTITY_TOUR_STORAGE_KEY,
    } = optionsRef.current;
    if (
      !enabled ||
      identities.length < 2 ||
      prefersReducedMotion() ||
      hasPlayed(storageKey)
    )
      return;

    const root = document.documentElement;
    const settled = root.getAttribute("data-identity") ?? defaultIdentity;
    const settledIndex = identities.findIndex((item) => item.id === settled);
    if (settledIndex === -1) return;
    // The settled identity comes last, so the page lands on it without a final jump.
    const order = [
      ...identities.slice(settledIndex + 1),
      ...identities.slice(0, settledIndex + 1),
    ];
    orderRef.current = order;

    let cancelled = false;
    let running = false;
    let stepTimer: number | undefined;
    let settleTimer: number | undefined;
    const pinned: string[] = [];

    const announce = () =>
      window.dispatchEvent(new Event(IDENTITY_CHANGE_EVENT));
    const release = () => {
      for (const name of pinned) root.style.removeProperty(name);
      pinned.length = 0;
      root.removeAttribute("data-identity-tour");
    };
    const detach = () => {
      document.removeEventListener("pointerdown", stop, true);
      document.removeEventListener("keydown", stop, true);
    };
    function stop() {
      if (!running) return;
      running = false;
      window.clearTimeout(stepTimer);
      detach();
      root.setAttribute("data-identity", settled);
      announce();
      setStep(null);
      settleTimer = window.setTimeout(release, SETTLE_MS);
    }
    stopRef.current = stop;

    const show = (index: number) => {
      root.setAttribute("data-identity", order[index]!.id);
      announce();
      setStep(index);
      stepTimer = window.setTimeout(
        () => (index + 1 < order.length ? show(index + 1) : stop()),
        stepMs,
      );
    };

    void (async () => {
      await afterLoadAndIdle();
      await preloadFonts(order);
      await whenVisible();
      if (cancelled) return;
      markPlayed(storageKey);
      const styles = getComputedStyle(root);
      for (const [name, fallback] of Object.entries(PINNED_LAYOUT_TOKENS)) {
        root.style.setProperty(
          name,
          styles.getPropertyValue(name).trim() || fallback,
        );
        pinned.push(name);
      }
      root.setAttribute("data-identity-tour", "running");
      running = true;
      document.addEventListener("pointerdown", stop, true);
      document.addEventListener("keydown", stop, true);
      show(0);
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(stepTimer);
      window.clearTimeout(settleTimer);
      detach();
      if (running) root.setAttribute("data-identity", settled);
      running = false;
      release();
    };
  }, [enabled]);

  const current = step === null ? null : (orderRef.current[step] ?? null);
  const skip = React.useCallback(() => stopRef.current(), []);
  return {
    running: step !== null,
    step: step ?? 0,
    total: orderRef.current.length,
    current,
    skip,
  };
}

type IdentityTourProps = IdentityTourOptions & {
  className?: string;
  /** Visible text of the skip control. Default "Skip". */
  skipLabel?: string;
  /** Accessible name of the skip control. Default "Skip the identity preview". */
  skipAriaLabel?: string;
  /** One-time message for screen readers when the tour starts. */
  announcement?: string;
};

/**
 * Ready-made tour: runs `useIdentityTour` and shows a small card with
 * the identity on screen, its one-line description and a skip button.
 * Renders nothing before the tour starts and after it ends, so it adds
 * no layout, no markup for crawlers and no focus stop on a normal visit.
 * Place it once on the entry page.
 */
function IdentityTour({
  className,
  skipLabel = "Skip",
  skipAriaLabel = "Skip the identity preview",
  announcement,
  ...options
}: IdentityTourProps) {
  const { running, step, total, current, skip } = useIdentityTour(options);
  const message =
    announcement ??
    `Previewing ${total} visual identities. Press any key to skip.`;
  return (
    <>
      <div role="status" className="sr-only" data-nosnippet>
        {running ? message : ""}
      </div>
      {running && current ? (
        <div
          data-nosnippet
          data-identity-tour-card
          className={cn(
            "fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md animate-fade-up items-center gap-3 rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg",
            className,
          )}
        >
          <div
            className="flex min-w-0 flex-1 flex-col gap-1"
            aria-hidden="true"
          >
            <div className="flex gap-1">
              {Array.from({ length: total }, (_, index) => (
                <span
                  key={index}
                  className={cn(
                    "h-1 w-5 rounded-full bg-border",
                    index <= step && "bg-primary",
                  )}
                />
              ))}
            </div>
            <p
              key={current.id}
              className="animate-fade-in font-(family-name:--zk-font-display) text-base leading-tight font-semibold"
            >
              {current.label}
            </p>
            {current.description ? (
              <p className="text-xs leading-snug text-muted-foreground">
                {current.description}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={skip}
            aria-label={skipAriaLabel}
          >
            {skipLabel}
          </Button>
        </div>
      ) : null}
    </>
  );
}

export {
  IDENTITY_TOUR_STORAGE_KEY,
  IdentityTour,
  useIdentityTour,
  type IdentityTourOptions,
  type IdentityTourProps,
  type IdentityTourState,
};
