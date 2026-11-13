"use client";

import { Stack, Text, identityContrastWarnings, type IdentityTokens } from "@zedtech/zedkit-ui";

import { identityAssistantCopy as copy } from "@/components/i18n/identity-assistant-copy";
import { identityEditorCopy } from "@/features/identity/editor/i18n/identity-editor-copy";
import { ContrastChips } from "@/features/identity/editor/ui/identity-editor-fields";
import { IdentityLookForm } from "@/features/identity/editor/ui/identity-look-form";

type PatchPreview = (key: string, value: string, palette?: "light" | "dark") => void;

/** Colour checker: explains the contrast rules, then lists each failing pair with its one-click Fix. */
function DockContrastChecker(props: { tokens: IdentityTokens; onPatchPreview: PatchPreview }) {
  const warnings = identityContrastWarnings(props.tokens);
  const simple = identityEditorCopy.simple;
  return (
    <Stack gap="sm" data-dock-contrast="">
      <Stack gap="tight">
        <Text typeRole="label" className="font-medium text-foreground">
          {simple.contrast}
        </Text>
        <Text variant="muted" typeRole="label">
          {simple.contrastHint}
        </Text>
      </Stack>
      {warnings.length > 0 ? (
        <ContrastChips warnings={warnings} onFix={(warning) => props.onPatchPreview(warning.token, warning.suggestedForeground, warning.scheme)} />
      ) : (
        <Text variant="muted" typeRole="label">
          {simple.contrastOk}
        </Text>
      )}
    </Stack>
  );
}

/** The dock drawer body: Classic (default) / Expert customize form plus the colour checker. No AI conversation. */
function IdentityDockCustomize(props: {
  tokens: IdentityTokens;
  onPatchPreview: PatchPreview;
  onPatchPreviewMany: (entries: readonly (readonly [string, string])[]) => void;
}) {
  return (
    <Stack gap="md" data-dock-customize="">
      <Stack gap="tight">
        <Text typeRole="label" className="font-medium text-foreground">
          {copy.views.customize}
        </Text>
        <Text variant="muted" typeRole="label">
          {copy.views.customizeHint}
        </Text>
      </Stack>
      <IdentityLookForm tokens={props.tokens} scheme="light" defaultMode="simple" idPrefix="identity-dock" stickyTabs onPatch={props.onPatchPreview} onPatchMany={props.onPatchPreviewMany} />
      <DockContrastChecker tokens={props.tokens} onPatchPreview={props.onPatchPreview} />
    </Stack>
  );
}

export { IdentityDockCustomize };
