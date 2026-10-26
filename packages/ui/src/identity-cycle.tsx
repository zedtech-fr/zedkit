"use client";

import * as React from "react";

import {
  DEFAULT_IDENTITY,
  identities as builtInIdentities,
  type IdentityOption,
} from "./identity.js";
import { cn } from "./utils.js";

/** Time given to fetch fonts before the animation starts anyway. */
const FONT_WAIT_MS = 1500;
/** Wait before the first fade, so the hidden layers are laid out at opacity 0 first. */
const ARM_MS = 80;
/** Time the last identity stays on screen before the layers are removed. */
const HOLD_MS = 250;
/** Duration of one crossfade. Matches `duration-400` below. */
const FADE_MS = 400;

type IdentityScopeProps = React.ComponentProps<"div"> & {
  /** Identity id to render this subtree with (`mist`, `press`, ...). */
  identity: string;
};

/**
 * Renders its children with another identity than the page's, without
 * changing `data-identity` on `<html>`. Tokens, fonts, radii and shadows
 * come from the identity; colours follow the page's light or dark mode.
 * Meant for previews and decorative scenes: it does not re-skin overlays
 * that portal out of it (dialogs, popovers).
 */
function IdentityScope({
  identity,
  className,
  ...props
}: IdentityScopeProps) {
  return (
    <div
      data-identity-scope=""
      data-identity={identity}
      className={cn("font-sans text-foreground", className)}
      {...props}
    />
  );
}

function prefersReducedMotion() {
  return (
    typeof window.matchMedia !== "function" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Resolves once the page has loaded and the browser is idle, so the animation never competes with LCP. */
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

/** Fetch the fonts of every identity in the cycle, bounded by FONT_WAIT_MS, so no step swaps fonts mid-fade. */
function preloadFonts(list: readonly IdentityOption[]): Promise<void> {
  if (!document.fonts || typeof document.fonts.load !== "function")
    return Promise.resolve();
  const loads: Promise<unknown>[] = [];
  for (const item of list) {
    for (const family of item.fonts ?? []) {
      for (const weight of [400, 600])
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

const GESTURES = ["pointerdown", "keydown", "wheel", "touchstart"] as const;

type IdentityCycleProps = {
  /** The scene: rendered once for real and once more per identity while the animation plays. */
  children: React.ReactNode;
  /** Identities to cross through. Default: the built-in set. */
  identities?: readonly IdentityOption[];
  /** Time between two identities, in milliseconds. Default 550 (six identities play in about 3.5 seconds). */
  stepMs?: number;
  /** Identity the scene settles on when `data-identity` is absent from `<html>`. */
  defaultIdentity?: string;
  /** Set to false to never play. */
  enabled?: boolean;
  className?: string;
};

/**
 * Hero-sized preview that crossfades through every identity, then
 * settles on the visitor's own. The scene is rendered once for real
 * (always there, in the page flow, so nothing is delayed or moved) and,
 * while the animation plays, once more per identity in an absolutely
 * positioned, hidden-from-assistive-tech layer wrapped in an
 * `IdentityScope`. Only opacity changes.
 *
 * It plays on every mount, after the page has loaded and gone idle. It
 * never changes `data-identity` on `<html>` and never touches
 * localStorage. A pointer press, key press, wheel or touch stops it;
 * `prefers-reduced-motion: reduce` turns it off. Keep the text and the
 * calls to action of the page outside of it: only decoration belongs
 * in the scene.
 */
function IdentityCycle({
  children,
  identities = builtInIdentities,
  stepMs = 550,
  defaultIdentity = DEFAULT_IDENTITY,
  enabled = true,
  className,
}: IdentityCycleProps) {
  const [layers, setLayers] = React.useState<readonly IdentityOption[]>([]);
  const [active, setActive] = React.useState(-1);
  const optionsRef = React.useRef({ identities, stepMs, defaultIdentity });
  optionsRef.current = { identities, stepMs, defaultIdentity };

  React.useEffect(() => {
    const { identities: list, stepMs: step, defaultIdentity: fallback } =
      optionsRef.current;
    if (!enabled || list.length < 2 || prefersReducedMotion()) return;

    const settled =
      document.documentElement.getAttribute("data-identity") ?? fallback;
    const settledIndex = list.findIndex((item) => item.id === settled);
    if (settledIndex === -1) return;
    // The settled identity comes last, so the page lands on it without a final jump.
    const order = [
      ...list.slice(settledIndex + 1),
      ...list.slice(0, settledIndex + 1),
    ];

    let cancelled = false;
    let ended = false;
    const timers: number[] = [];
    const later = (callback: () => void, ms: number) =>
      timers.push(window.setTimeout(callback, ms));
    const detach = () => {
      for (const name of GESTURES)
        document.removeEventListener(name, cut, true);
    };
    const clear = () => {
      for (const timer of timers) window.clearTimeout(timer);
      timers.length = 0;
    };
    // Last step done: the top layer already looks like the page, so removing the layers changes nothing.
    function finish() {
      ended = true;
      detach();
      clear();
      setLayers([]);
      setActive(-1);
    }
    // First gesture: fade back to the real scene, then drop the layers.
    function cut() {
      if (ended) return;
      ended = true;
      detach();
      clear();
      setActive(-1);
      later(() => setLayers([]), FADE_MS + 50);
    }
    const show = (index: number) => {
      setActive(index);
      later(
        index + 1 < order.length ? () => show(index + 1) : finish,
        index + 1 < order.length ? step : FADE_MS + HOLD_MS,
      );
    };

    void (async () => {
      await afterLoadAndIdle();
      await preloadFonts(order);
      await whenVisible();
      if (cancelled) return;
      for (const name of GESTURES)
        document.addEventListener(name, cut, { capture: true, passive: true });
      setLayers(order);
      later(() => show(0), ARM_MS);
    })();

    return () => {
      cancelled = true;
      ended = true;
      detach();
      clear();
    };
  }, [enabled]);

  const running = layers.length > 0;
  return (
    <div className={cn("relative", className)} data-identity-cycle="">
      <div
        data-identity-cycle-base=""
        className={cn(
          running &&
            "transition-opacity duration-400 ease-in-out motion-reduce:transition-none",
          running && active >= 0 && "opacity-0",
        )}
      >
        {children}
      </div>
      {layers.map((item, index) => (
        <IdentityScope
          key={item.id}
          identity={item.id}
          aria-hidden="true"
          inert
          data-identity-cycle-layer={item.id}
          className={cn(
            "pointer-events-none absolute inset-0 transition-opacity duration-400 ease-in-out motion-reduce:transition-none",
            index === active ? "opacity-100" : "opacity-0",
          )}
        >
          {children}
        </IdentityScope>
      ))}
    </div>
  );
}

export {
  IdentityCycle,
  IdentityScope,
  type IdentityCycleProps,
  type IdentityScopeProps,
};
