"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHandle,
  IDENTITY_CHANGE_EVENT,
  Stack,
  Text,
  useIdentity,
} from "@zedtech/zedkit-ui";

import { IdentityDock, IdentityDockSwatch, IdentityDockTrigger } from "@/features/identity/dock/ui/identity-dock-chrome";
import { identityDockCopy } from "@/features/identity/dock/i18n/identity-dock-copy";
import { IdentityDockAssistantPanel } from "@/features/identity/dock/ui/identity-dock-assistant-panel";
import { useCreatorHandoff } from "@/features/identity/dock/ui/use-creator-handoff";
import { useIdentityDockKeyboard } from "@/features/identity/dock/ui/use-identity-dock-keyboard";
import { DEFAULT_IDENTITY } from "@/lib/default-identity";
import { docsSiteDefaultTokens } from "@/features/identity/ui/docs-site-default-tokens";
import { readDockSiteTokens } from "@/features/identity/ui/docs-site-look";
import { consumeCreateArrival } from "@/features/identity/ui/identity-create-arrival";
import { IDENTITY_DOCK_OPEN } from "@/features/identity/dock/ui/identity-dock-open";
import { useIdentityAssistantStore } from "@/features/identity/ui/identity-assistant-store";
import { IDENTITY_EDITOR_HREF } from "@/lib/site-links.mjs";

function useEditorDockAutoOpen(
  onEditor: boolean,
  pathname: string,
  setBrief: (value: string) => void,
  setExpanded: (open: boolean) => void,
) {
  useCreatorHandoff((brief) => {
    if (brief) setBrief(brief);
    setExpanded(true);
  });
  useEffect(() => {
    if (!onEditor) return;
    const arrived = consumeCreateArrival();
    if (window.location.hash === "#create" || arrived) {
      setExpanded(true);
      return;
    }
    setExpanded(false);
  }, [onEditor, pathname, setExpanded]);
}

function useIdentityDockOpenRequest(setBrief: (value: string) => void, setExpanded: (open: boolean) => void) {
  useEffect(() => {
    const open = (event: Event) => {
      const brief = (event as CustomEvent<unknown>).detail;
      if (typeof brief === "string" && brief.trim() !== "") setBrief(brief);
      setExpanded(true);
    };
    window.addEventListener(IDENTITY_DOCK_OPEN, open);
    return () => window.removeEventListener(IDENTITY_DOCK_OPEN, open);
  }, [setBrief, setExpanded]);
}

function useDockSiteTokens() {
  const identityId = useIdentity(DEFAULT_IDENTITY);
  const [tokens, setTokens] = useState(docsSiteDefaultTokens);
  useLayoutEffect(() => {
    const sync = () => setTokens(readDockSiteTokens(identityId));
    sync();
    window.addEventListener(IDENTITY_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(IDENTITY_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [identityId]);
  return [tokens, setTokens] as const;
}

function IdentityDockWidget() {
  const pathname = usePathname();
  const onEditor = pathname === IDENTITY_EDITOR_HREF;
  const [tokens, setTokens] = useDockSiteTokens();
  const { expanded, setExpanded, setBrief } = useIdentityAssistantStore();
  const triggerRef = useIdentityDockKeyboard(expanded, setExpanded);
  const panelRef = useRef<HTMLDivElement>(null);

  useEditorDockAutoOpen(onEditor, pathname, setBrief, setExpanded);
  useIdentityDockOpenRequest(setBrief, setExpanded);

  useEffect(() => {
    if (!expanded) return;
    const id = requestAnimationFrame(() => panelRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [expanded]);

  return (
    <>
      <IdentityDock data-testid="identity-dock">
        <IdentityDockTrigger
          ref={triggerRef}
          aria-expanded={expanded}
          aria-label={identityDockCopy.pillLabel}
          aria-keyshortcuts="Control+I Meta+I"
          title={identityDockCopy.shortcutHint}
          tabIndex={expanded ? -1 : undefined}
          onClick={() => setExpanded(true)}
        >
          <IdentityDockSwatch />
          <Text typeRole="label" className="truncate">
            {identityDockCopy.pillLabel}
          </Text>
        </IdentityDockTrigger>
      </IdentityDock>
      <Drawer open={expanded} onOpenChange={setExpanded} direction="right" mobile="sheet" modal={false} handleOnly noBodyStyles>
        <DrawerContent
          ref={panelRef}
          size="lg"
          modal={false}
          aria-label={identityDockCopy.panelTitle}
          data-slot="identity-dock-panel"
          data-state={expanded ? "open" : "closed"}
          className="flex pane-shrink flex-col gap-flush flush [&>:not([data-slot^=drawer-],[data-vaul-handle],button)]:px-flush"
        >
          <DrawerHandle data-dock-handle="" className="trim-bottom w-handle shrink-0" />
          <Stack data-state="open" className="pane-shrink flex-1 gap-flush">
            <IdentityDockAssistantPanel tokens={tokens} onTokens={setTokens} />
          </Stack>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export { IdentityDockWidget };
