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
const HOLD_MS = 150;
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
  /** Time between two identities, in milliseconds. Default 500 (six identities play in about 3.5 seconds). */
  stepMs?: number;
  /** Identity the scene settles on when `data-identity` is absent from `<html>`. */
  defaultIdentity?: string;
  /** Set to false to never play. */
  enabled?: boolean;
  /**
   * Paint each identity's own background behind the scene, edge to edge of
   * the window, a little beyond the scene's top and bottom. For a whole
   * hero, not for a card.
   */
  backdrop?: boolean;
  className?: string;
};

/**
 * Hero-sized scene that crossfades through every identity, then settles
 * on the visitor's own. The scene is rendered once for real (always
 * there, in the page flow, so nothing is delayed or moved) and, while the
 * animation plays, once more per identity in an absolutely positioned,
 * hidden-from-assistive-tech layer wrapped in an `IdentityScope`. Each
 * layer fades in over the previous one, so colours, backgrounds, type,
 * radii and shadows all change together and nothing dips in between;
 * the last layer is the visitor's own identity, and fading the layers out
 * reveals the real scene.
 *
 * It plays on every mount, after the page has loaded and gone idle. It
 * never changes `data-identity` on `<html>` and never touches
 * localStorage. A pointer press, key press, wheel or touch stops it;
 * `prefers-reduced-motion: reduce` turns it off. The layers repeat the
 * scene's text unchanged: keep it identical in every identity, and
 * keep interactive content in the real scene (the layers are inert).
 */
function IdentityCycle({
  children,
  identities = builtInIdentities,
  stepMs = 500,
  defaultIdentity = DEFAULT_IDENTITY,
  enabled = true,
  backdrop = false,
  className,
}: IdentityCycleProps) {
  const [layers, setLayers] = React.useState<readonly IdentityOption[]>([]);
  // Layers up to `active` are shown; the stack fades out from `keepFrom` once settling.
  const [active, setActive] = React.useState(-1);
  const [keepFrom, setKeepFrom] = React.useState<number | null>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
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
    let shown = -1;
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
    // Fade the top layers out over the real scene; the ones beneath are fully covered, so they just go.
    function settle(from: number) {
      ended = true;
      detach();
      clear();
      setKeepFrom(Math.max(0, from));
      later(() => {
        setLayers([]);
        setActive(-1);
        setKeepFrom(null);
      }, FADE_MS + 50);
    }
    // First gesture: fade back to the real scene.
    function cut() {
      if (ended) return;
      settle(shown - 1);
    }
    const show = (index: number) => {
      shown = index;
      setActive(index);
      if (index + 1 < order.length) later(() => show(index + 1), step);
      else later(() => settle(index), FADE_MS + HOLD_MS);
    };

    void (async () => {
      await afterLoadAndIdle();
      await preloadFonts(order);
      await whenVisible();
      if (cancelled) return;
      const root = rootRef.current;
      if (root) {
        // The backdrop reaches both window edges: say how far they are from the scene.
        const box = root.getBoundingClientRect();
        root.style.setProperty("--zk-cycle-bleed-l", `${Math.max(0, box.left)}px`);
        root.style.setProperty(
          "--zk-cycle-bleed-r",
          `${Math.max(0, document.documentElement.clientWidth - box.right)}px`,
        );
      }
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

  return (
    <div
      ref={rootRef}
      className={cn("relative", className)}
      data-identity-cycle=""
    >
      {children}
      {layers.map((item, index) => (
        <IdentityScope
          key={item.id}
          identity={item.id}
          aria-hidden="true"
          inert
          data-identity-cycle-layer={item.id}
          data-identity-backdrop={backdrop ? "" : undefined}
          className={cn(
            "pointer-events-none absolute inset-x-0 transition-opacity duration-400 ease-in-out motion-reduce:transition-none",
            backdrop ? "-inset-y-3" : "inset-y-0",
            keepFrom === null
              ? index <= active
                ? "opacity-100"
                : "opacity-0"
              : index < keepFrom
                ? "hidden"
                : "opacity-0",
          )}
        >
          {/* contain: paint keeps the copy out of the page's largest-contentful-paint candidates. */}
          <div
            className={cn(
              "absolute contain-paint",
              backdrop ? "-inset-x-3 inset-y-0 px-3 py-3" : "inset-0",
            )}
          >
            {children}
          </div>
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
