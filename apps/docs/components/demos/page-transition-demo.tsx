"use client";

import { useState } from "react";
import { Button, PageTransition, PersistentShell, Stack, Text } from "@zedtech/zedkit-ui";
import { pageTransitionCopy } from "@/components/demos/i18n/page-transition-copy";

/**
 * Métier: public TypeScript kit; docs site is the reading surface.
 * Client personas: maintainers copying a layout pattern (assumed: they want a default).
 * Customers: developers visiting zedkit.app to read a need.
 * Customer personas: hurried, often on a laptop; second click must feel instant.
 * UI: chrome stays; only the article moves, because: customer = reading, not watching a reload.
 */
export function PageTransitionDemo() {
  const [route, setRoute] = useState<"install" | "tokens">("install");
  const article = route === "install" ? pageTransitionCopy.install : pageTransitionCopy.tokens;
  return (
    <PersistentShell
      header={<Text>{pageTransitionCopy.header}</Text>}
      sidebar={<Text>{pageTransitionCopy.sidebar}</Text>}
    >
      <Stack gap="md">
        <Stack direction="horizontal" gap="sm">
          <Button
            type="button"
            variant={route === "install" ? "default" : "outline"}
            aria-pressed={route === "install"}
            onClick={() => setRoute("install")}
          >
            {pageTransitionCopy.installNav}
          </Button>
          <Button
            type="button"
            variant={route === "tokens" ? "default" : "outline"}
            aria-pressed={route === "tokens"}
            onClick={() => setRoute("tokens")}
          >
            {pageTransitionCopy.tokensNav}
          </Button>
        </Stack>
        <PageTransition routeKey={route}>
          <Text>{article}</Text>
        </PageTransition>
      </Stack>
    </PersistentShell>
  );
}
