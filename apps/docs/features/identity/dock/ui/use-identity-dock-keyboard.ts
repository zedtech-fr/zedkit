import { useEffect, useRef } from "react";

export type IdentityDockKeyIntent = "open" | "close" | null;

/** Maps a key event plus dock state to open, close, or ignore. */
export function identityDockKeyIntent(
  event: { key: string; metaKey: boolean; ctrlKey: boolean },
  state: { expanded: boolean; typing: boolean },
): IdentityDockKeyIntent {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "i" && !state.typing) {
    return "open";
  }
  if (event.key === "Escape" && state.expanded) {
    return "close";
  }
  return null;
}

/** True only on the open→closed edge, never on mount. */
export function shouldRestoreTriggerFocus(wasExpanded: boolean, expanded: boolean): boolean {
  return wasExpanded && !expanded;
}

/** Opens with Ctrl/Cmd+I; Escape closes and returns focus to the trigger (D2). */
export function useIdentityDockKeyboard(expanded: boolean, setExpanded: (open: boolean) => void) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable);
      const intent = identityDockKeyIntent(event, { expanded, typing });
      if (intent === "open") {
        event.preventDefault();
        setExpanded(true);
        return;
      }
      if (intent === "close") {
        event.preventDefault();
        setExpanded(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, setExpanded]);

  // Focus goes back to the trigger only when the dock closes, never on mount: hydration lands late on the home
  // page, and a mount-time focus() takes the focus from whatever the visitor already reached.
  const wasExpanded = useRef(false);
  useEffect(() => {
    const restore = shouldRestoreTriggerFocus(wasExpanded.current, expanded);
    wasExpanded.current = expanded;
    if (!restore) return;
    const id = requestAnimationFrame(() => triggerRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [expanded]);

  return triggerRef;
}
