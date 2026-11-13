"use client";

import { useEffect, useState } from "react";
import { identityContrastWarnings, Stack, type IdentityTokens } from "@zedtech/zedkit-ui";

import { IdentityDockActionBar } from "@/features/identity/dock/ui/identity-dock-action-bar";
import { IdentityDockCustomize } from "@/features/identity/dock/ui/identity-dock-customize";
import { IdentityDockPanelToolbar } from "@/features/identity/dock/ui/identity-dock-panel-toolbar";
import { identityDockCopy } from "@/features/identity/dock/i18n/identity-dock-copy";
import { identityEditorCopy } from "@/features/identity/editor/i18n/identity-editor-copy";
import { docsSiteDefaultTokens } from "@/features/identity/ui/docs-site-default-tokens";
import { applyDocsSiteLook, resetDocsSiteLook } from "@/features/identity/ui/docs-site-look";
import { dispatchIdentityEditorDraftApply } from "@/features/identity/ui/identity-editor-draft-apply";
import { patchTokens } from "@/features/identity/ui/identity-editor-patch";
import { useIdentityAssistantStore } from "@/features/identity/ui/identity-assistant-store";
import { IDENTITY_EDITOR_HREF } from "@/lib/site-links.mjs";

/** One field from the dock customize form: validate through the token schema, then repaint the site. */
function patchDockLook(
  tokens: IdentityTokens,
  onTokens: (tokens: IdentityTokens) => void,
  entries: readonly (readonly [string, string])[],
  palette?: "light" | "dark",
) {
  const next = entries.reduce((acc, [key, value]) => patchTokens(acc, key, value, palette ?? "light", []), tokens);
  if (next === tokens) return false;
  onTokens(next);
  applyDocsSiteLook(next);
  if (typeof window !== "undefined" && window.location.pathname === IDENTITY_EDITOR_HREF) {
    dispatchIdentityEditorDraftApply(next);
  }
  return true;
}

/**
 * The "Make it yours" drawer: a manual customize form (Classic by default, Expert behind its tab),
 * a colour checker, and Reset. There is no AI conversation or text input here.
 */
export function IdentityDockAssistantPanel({
  tokens,
  onTokens,
}: {
  tokens: IdentityTokens;
  onTokens: (tokens: IdentityTokens) => void;
}) {
  const { setExpanded } = useIdentityAssistantStore();
  const [status, setStatus] = useState("");
  const warningCount = identityContrastWarnings(tokens).length;

  useEffect(() => {
    const message =
      warningCount === 0
        ? identityEditorCopy.simple.contrastOk
        : identityEditorCopy.simple.contrastNeedFix(warningCount);
    const id = window.setTimeout(() => setStatus(message), 400);
    return () => window.clearTimeout(id);
  }, [warningCount]);

  return (
    <Stack className="pane-shrink flex-1 gap-flush overflow-hidden" data-slot="identity-dock-body">
      <IdentityDockPanelToolbar onClose={() => setExpanded(false)} />
      <Stack gap="md" data-dock-scroll="" className="pane-shrink flex-1 overflow-y-auto overscroll-y-contain px-control-inline pt-start">
        <IdentityDockCustomize
          tokens={tokens}
          onPatchPreview={(key, value, palette) => patchDockLook(tokens, onTokens, [[key, value]], palette)}
          onPatchPreviewMany={(entries) => patchDockLook(tokens, onTokens, entries)}
        />
      </Stack>
      <IdentityDockActionBar
        status={status}
        onReset={() => {
          resetDocsSiteLook();
          onTokens(docsSiteDefaultTokens());
          setStatus(identityDockCopy.statusRestored);
        }}
      />
    </Stack>
  );
}
