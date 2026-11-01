"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const ThemeScopeContext = React.createContext<HTMLElement | null>(null);

/** Portal mount for overlays opened inside a `ThemeScope`. Unset at the document root. */
function usePortalContainer(): HTMLElement | undefined {
  return React.useContext(ThemeScopeContext) ?? undefined;
}

type ThemeScopeProps = React.ComponentProps<"div"> & {
  /** When set, this node is the nearest identity+mode authority for its subtree and portals. */
  identity?: string | undefined;
  /** Pins light or dark for this subtree; unset inherits the surrounding mode. */
  mode?: "light" | "dark" | undefined;
};

/**
 * Nearest identity+mode boundary. Overlays read `usePortalContainer()` and
 * mount here so they keep `data-identity`, `.dark` and font tokens. Without
 * a provider, Radix/Sonner keep their root (`document.body`) behaviour.
 */
function ThemeScope({ identity, mode, className, children, ...props }: ThemeScopeProps) {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  return (
    <div
      ref={setContainer}
      data-slot="theme-scope"
      {...(identity
        ? { "data-identity-scope": "", "data-identity": identity }
        : {})}
      {...props}
      className={cn(
        "font-sans text-foreground",
        // `dark` is the mode marker the `dark:` variant and identity CSS key on.
        // eslint-disable-next-line better-tailwindcss/no-unknown-classes
        mode === "dark" && "dark",
        className,
      )}
    >
      <ThemeScopeContext.Provider value={container}>{children}</ThemeScopeContext.Provider>
    </div>
  );
}

export { ThemeScope, usePortalContainer, type ThemeScopeProps };
