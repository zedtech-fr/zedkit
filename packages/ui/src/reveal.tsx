"use client";

import * as React from "react";

import { cn } from "./utils.js";

type RevealState = "pending" | "in";
type RevealTag = "div" | "section" | "article" | "header" | "ul" | "ol" | "li" | "p" | "span";

const OBSERVER_OPTIONS: IntersectionObserverInit = { threshold: 0.12, rootMargin: "0px 0px -6% 0px" };

/**
 * Shared scroll-reveal state. Content is visible on the server and
 * before hydration. After mount, only elements that start below the
 * fold are hidden, then revealed once when they scroll into view.
 * Under `prefers-reduced-motion: reduce` nothing is ever hidden.
 */
function useRevealState<T extends HTMLElement>(once: boolean) {
  const ref = React.useRef<T>(null);
  const [state, setState] = React.useState<RevealState | undefined>(undefined);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduced =
      typeof window.matchMedia !== "function" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canObserve = typeof IntersectionObserver !== "undefined";
    if (reduced || !canObserve) return;
    const startsInView = node.getBoundingClientRect().top < window.innerHeight * 0.92;
    if (startsInView) return;
    setState("pending");
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setState("in");
          if (once) observer.disconnect();
        } else if (!once) {
          setState("pending");
        }
      }
    }, OBSERVER_OPTIONS);
    observer.observe(node);
    return () => observer.disconnect();
  }, [once]);

  return { ref, state };
}

type SharedProps = Omit<React.HTMLAttributes<HTMLElement>, "children"> & {
  children?: React.ReactNode;
  /** Element to render. Default `div`. */
  as?: RevealTag;
  /** Reveal again each time it re-enters the viewport. Default: once. */
  repeat?: boolean;
};

type RevealProps = SharedProps & {
  /** Entrance style. `fade-up` moves slightly; `fade` and `pop` do not slide. */
  variant?: "fade-up" | "fade" | "pop";
  /** Delay in stagger steps (1 step = the identity stagger token). */
  delay?: 1 | 2 | 3 | 4 | 5 | 6;
};

/**
 * Reveal-on-scroll wrapper. Timing, distance and easing come from the
 * active identity tokens. Safe without JavaScript and under reduced motion.
 */
function Reveal({ as = "div", variant = "fade-up", delay, repeat = false, className, children, ...props }: RevealProps) {
  const { ref, state } = useRevealState<HTMLElement>(!repeat);
  return React.createElement(
    as,
    {
      ref,
      className: cn(className),
      "data-reveal": state,
      "data-reveal-variant": variant === "fade-up" ? undefined : variant,
      "data-reveal-delay": delay,
      ...props,
    },
    children,
  );
}

/**
 * Staggered reveal: direct children enter one after another, spaced by
 * the identity stagger step, once the group scrolls into view.
 */
function Stagger({ as = "div", repeat = false, className, children, ...props }: SharedProps) {
  const { ref, state } = useRevealState<HTMLElement>(!repeat);
  return React.createElement(as, { ref, className: cn(className), "data-stagger": state, ...props }, children);
}

export { Reveal, Stagger, type RevealProps, type SharedProps as StaggerProps };
