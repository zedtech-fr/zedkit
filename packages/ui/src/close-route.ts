"use client";

export interface CloseRouteOptions {
  back: () => void;
  replace: (href: string) => void;
  fallback: string;
}

interface NavigationEntryLike {
  id: string;
  sameDocument: boolean;
}

interface NavigationLike {
  currentEntry: NavigationEntryLike | null;
  entries: () => NavigationEntryLike[];
}

/**
 * Route-modal close action: go back when the previous history entry
 * belongs to the app (Navigation API, same-document check), else
 * replace with the fallback list URL. Legacy fallback without the
 * Navigation API: back when history runs deeper than one entry.
 * Call from the modal `onClose` after its exit animation has played.
 */
export function closeRoute({ back, replace, fallback }: CloseRouteOptions): void {
  const navigation = (window as Window & { navigation?: NavigationLike }).navigation;
  if (navigation?.currentEntry && typeof navigation.entries === "function") {
    const entries = navigation.entries();
    const current = entries.findIndex((entry) => entry.id === navigation.currentEntry?.id);
    const previous = current > 0 ? entries[current - 1] : undefined;
    if (previous?.sameDocument) {
      back();
      return;
    }
    replace(fallback);
    return;
  }
  if (window.history.length > 1) {
    back();
    return;
  }
  replace(fallback);
}
