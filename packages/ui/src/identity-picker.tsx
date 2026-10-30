"use client";

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
  IDENTITY_STORAGE_KEY,
  applyIdentity,
  identities as builtInIdentities,
  identitiesWithCurrentLook,
  useIdentity,
  type IdentityOption,
} from "./identity.js";
import { cn } from "./utils.js";
import { useUiMessages } from "./ui-provider.js";

type IdentityPickerProps = {
  /** Choices to offer. Default: the identities shipped in `identities.css`. */
  identities?: readonly IdentityOption[];
  /** Shown as selected while no identity is set. Default: the first choice. */
  defaultIdentity?: string;
  storageKey?: string;
  /** Accessible name of the list and the sheet title. Default: kit messages `identity`. */
  label?: string;
  /** Line under the sheet title. */
  description?: string;
  onIdentityChange?: (id: string) => void;
  className?: string;
};

/**
 * Touch-first identity chooser: a trigger that shows the current identity
 * name (44px tap target) and a bottom sheet listing every identity
 * with its one-line description. A choice applies at once, so the page
 * behind the sheet is the live preview. Same storage and event contract
 * as `IdentitySwitcher`; pair with `<IdentityScript />`. Renders nothing
 * when there is no identity to choose.
 */
function IdentityPicker({
  identities = builtInIdentities,
  defaultIdentity,
  storageKey = IDENTITY_STORAGE_KEY,
  label,
  description,
  onIdentityChange,
  className,
}: IdentityPickerProps) {
  const messages = useUiMessages();
  const title = label ?? messages.identity;
  const current = useIdentity(defaultIdentity ?? identities[0]?.id ?? "");
  const options = identitiesWithCurrentLook(identities, current, messages.identityCustom);

  if (identities.length === 0) return null;

  const currentLabel = options.find((item) => item.id === current)?.label ?? current;

  function choose(next: string) {
    applyIdentity(next, storageKey);
    onIdentityChange?.(next);
  }

  return (
    <Drawer data-slot="identity-picker">
      <DrawerTrigger asChild>
        <button
          type="button"
          aria-label={`${title}: ${currentLabel}`}
          className={cn(
            "inline-flex min-h-overlay-touch-target min-w-overlay-touch-target items-center justify-center gap-2 rounded-md px-3 text-sm font-medium text-foreground focus-ring-control",
            className,
          )}
        >
          <Palette aria-hidden="true" className="size-4 text-muted-foreground" />
          <span>{currentLabel}</span>
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHandle />
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description ?? messages.identityDescription}</DrawerDescription>
        </DrawerHeader>
        <div role="radiogroup" aria-label={title} className="flex flex-col gap-1 overflow-y-auto px-4 pb-6">
          {options.map((item) => {
            const selected = item.id === current;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => choose(item.id)}
                className={cn(
                  "flex min-h-overlay-touch-target items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left focus-ring-control transition-colors",
                  selected ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted",
                )}
              >
                <span className="min-w-0">
                  <span className="block font-medium text-foreground">
                    {item.label}
                    {defaultIdentity && item.id === defaultIdentity ? (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">{messages.identityDefault}</span>
                    ) : null}
                  </span>
                  {item.description ? (
                    <span className="block text-sm text-muted-foreground">{item.description}</span>
                  ) : null}
                </span>
                {selected ? <Check aria-hidden="true" className="size-4 shrink-0 text-primary" /> : null}
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export { IdentityPicker, type IdentityPickerProps };
