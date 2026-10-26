"use client";

import * as React from "react";
import { Check, Palette } from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer.js";
import {
  DEFAULT_IDENTITY,
  IDENTITY_CHANGE_EVENT,
  IDENTITY_STORAGE_KEY,
  identities as builtInIdentities,
  type IdentityOption,
} from "./identity.js";
import { cn } from "./utils.js";

type IdentityPickerProps = {
  /** Choices to offer. Default: the identities shipped in `identities.css`. */
  identities?: readonly IdentityOption[];
  defaultIdentity?: string;
  storageKey?: string;
  /** Accessible name of the list and the sheet title. Default "Identity". */
  label?: string;
  onIdentityChange?: (id: string) => void;
  className?: string;
};

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(IDENTITY_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(IDENTITY_CHANGE_EVENT, callback);
  };
}

/**
 * Touch-first identity chooser: a trigger that shows the current identity
 * name (tap target `min-h-tap`) and a bottom sheet listing every identity
 * with its one-line description. A choice applies at once, so the page
 * behind the sheet is the live preview. Same storage and event contract
 * as `IdentitySwitcher`; pair with `<IdentityScript />`.
 */
function IdentityPicker({
  identities = builtInIdentities,
  defaultIdentity = DEFAULT_IDENTITY,
  storageKey = IDENTITY_STORAGE_KEY,
  label = "Identity",
  onIdentityChange,
  className,
}: IdentityPickerProps) {
  const current = React.useSyncExternalStore(
    subscribe,
    () => document.documentElement.getAttribute("data-identity") ?? defaultIdentity,
    () => defaultIdentity,
  );
  const currentLabel = identities.find((item) => item.id === current)?.label ?? current;

  function choose(next: string) {
    document.documentElement.setAttribute("data-identity", next);
    window.localStorage.setItem(storageKey, next);
    window.dispatchEvent(new Event(IDENTITY_CHANGE_EVENT));
    onIdentityChange?.(next);
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button
          type="button"
          aria-label={`${label}: ${currentLabel}`}
          className={cn(
            "inline-flex min-h-tap min-w-tap items-center justify-center gap-2 rounded-md px-3 text-sm font-medium text-foreground focus-ring-control",
            className,
          )}
        >
          <Palette aria-hidden="true" className="size-icon-control text-muted-foreground" />
          <span>{currentLabel}</span>
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHandle />
        <DrawerHeader>
          <DrawerTitle>{label}</DrawerTitle>
          <DrawerDescription>The page behind this sheet updates as you choose.</DrawerDescription>
        </DrawerHeader>
        <div role="radiogroup" aria-label={label} className="flex flex-col gap-1 overflow-y-auto px-4 pb-6">
          {identities.map((item) => {
            const selected = item.id === current;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => choose(item.id)}
                className={cn(
                  "flex min-h-tap items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left focus-ring-control transition-colors",
                  selected ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted",
                )}
              >
                <span className="min-w-0">
                  <span className="block font-medium text-foreground">{item.label}</span>
                  {item.description ? (
                    <span className="block text-sm text-muted-foreground">{item.description}</span>
                  ) : null}
                </span>
                {selected ? <Check aria-hidden="true" className="size-icon-control shrink-0 text-primary" /> : null}
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export { IdentityPicker, type IdentityPickerProps };
