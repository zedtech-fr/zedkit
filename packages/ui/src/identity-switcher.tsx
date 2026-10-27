"use client";

import * as React from "react";
import { Palette } from "lucide-react";

import {
  IDENTITY_STORAGE_KEY,
  applyIdentity,
  identities as builtInIdentities,
  useIdentity,
  type IdentityOption,
} from "./identity.js";
import { cn } from "./utils.js";

type IdentitySwitcherProps = Omit<React.ComponentProps<"select">, "value" | "defaultValue" | "onChange" | "children"> & {
  /** Choices to offer. Default: the identities shipped in `identities.css`. */
  identities?: readonly IdentityOption[];
  /** Shown as selected while no identity is set. Default: the first choice. */
  defaultIdentity?: string;
  storageKey?: string;
  /** Accessible name of the control. Default "Identity". */
  label?: string;
  /** Show the label text next to the control (otherwise screen-reader only). */
  showLabel?: boolean;
  onIdentityChange?: (id: string) => void;
};

/**
 * Select control that switches the active identity: it writes
 * `data-identity` on <html> (tokens follow, no component re-render) and
 * persists the choice in localStorage. Pair with <IdentityScript /> in
 * the root layout so the stored identity applies before hydration.
 * Renders nothing when there is no identity to choose.
 */
function IdentitySwitcher({
  identities = builtInIdentities,
  defaultIdentity,
  storageKey = IDENTITY_STORAGE_KEY,
  label = "Identity",
  showLabel = false,
  onIdentityChange,
  className,
  id,
  ...props
}: IdentitySwitcherProps) {
  const generatedId = React.useId();
  const selectId = id ?? generatedId;
  const current = useIdentity(defaultIdentity ?? identities[0]?.id ?? "");

  if (identities.length === 0) return null;

  function choose(next: string) {
    applyIdentity(next, storageKey);
    onIdentityChange?.(next);
  }

  return (
    <div data-slot="identity-switcher" className="inline-flex items-center gap-2">
      <Palette aria-hidden="true" className="size-icon-control text-muted-foreground" />
      <label htmlFor={selectId} className={cn("text-sm text-muted-foreground", !showLabel && "sr-only")}>
        {label}
      </label>
      <select
        id={selectId}
        value={current}
        onChange={(event) => choose(event.target.value)}
        className={cn(
          "h-control-height-sm rounded-md border border-input bg-background px-3 text-control text-foreground focus-ring-control",
          className,
        )}
        {...props}
      >
        {identities.map((item) => (
          <option key={item.id} value={item.id}>
            {defaultIdentity && item.id === defaultIdentity ? `${item.label} (default)` : item.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export { IdentitySwitcher, type IdentitySwitcherProps };
