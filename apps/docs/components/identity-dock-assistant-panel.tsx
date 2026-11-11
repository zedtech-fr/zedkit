"use client";

import { Stack, type IdentityTokens } from "@zedtech/zedkit-ui";

import { IdentityDockActionBar } from "@/components/identity-dock-action-bar";
import { IdentityDockCustomize } from "@/components/identity-dock-customize";
import { IdentityDockPanelToolbar } from "@/components/identity-dock-panel-toolbar";
import { patchTokens } from "@/lib/identity-editor-patch";
import { repairContrast } from "@/lib/identity-contrast-repair";
import { applyWidgetSpecimenPreview } from "@/lib/identity-widget-specimen-preview";
import { dispatchIdentityEditorDraftApply } from "@/lib/identity-editor-draft-apply";
import { useIdentityAssistantStore } from "@/lib/identity-assistant-store";
import { useDocsSiteIdentityApply } from "@/lib/use-docs-site-identity-apply";
import { IDENTITY_EDITOR_HREF } from "@/lib/site-links.mjs";

/** One field from the dock customize form: validate through the token schema, then repaint specimens. */
function patchDockPreview(
  previewTokens: IdentityTokens,
  onPreviewTokens: (tokens: IdentityTokens) => void,
  key: string,
  value: string,
  palette?: "light" | "dark",
) {
  const next = patchTokens(previewTokens, key, value, palette ?? "light", []);
  if (next === previewTokens) return false;
  onPreviewTokens(next);
  applyWidgetSpecimenPreview(next);
  if (typeof window !== "undefined" && window.location.pathname === IDENTITY_EDITOR_HREF) {
    dispatchIdentityEditorDraftApply(next);
  }
  return true;
}

/**
 * The "Make it yours" drawer: a manual customize form (Classic by default, Expert behind its tab),
 * a colour checker, and footer CTAs. There is no AI conversation or text input here.
 */
export function IdentityDockAssistantPanel({
  previewTokens,
  onPreviewTokens,
  onResetPreview,
}: {
  previewTokens: IdentityTokens;
  onPreviewTokens: (tokens: IdentityTokens) => void;
  onResetPreview: () => void;
}) {
  const { setExpanded } = useIdentityAssistantStore();
  const site = useDocsSiteIdentityApply();

  return (
    <Stack className="pane-shrink flex-1 gap-flush overflow-hidden" data-slot="identity-dock-body">
      <IdentityDockPanelToolbar onClose={() => setExpanded(false)} />
      <Stack gap="md" data-dock-scroll="" className="pane-shrink flex-1 overflow-y-auto overscroll-y-contain px-control-inline pt-start">
        <IdentityDockCustomize
          tokens={previewTokens}
          onPatchPreview={(key, value, palette) => patchDockPreview(previewTokens, onPreviewTokens, key, value, palette)}
        />
      </Stack>
      <IdentityDockActionBar
        appliedSite={site.appliedSite}
        onApplySite={() => site.applySite(repairContrast(previewTokens).tokens)}
        onRemoveFromSite={site.removeFromSite}
        onReset={onResetPreview}
        onPreview={() => setExpanded(false)}
      />
    </Stack>
  );
}
