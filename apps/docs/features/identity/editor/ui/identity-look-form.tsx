"use client";

import { type ReactNode } from "react";
import { Stack, Tabs, TabsContent, TabsList, TabsTrigger, type IdentityTokens } from "@zedtech/zedkit-ui";

import { identityEditorCopy } from "@/features/identity/editor/i18n/identity-editor-copy";
import { SimpleFields, type PatchMany } from "./identity-classic-fields";
import { EditorFields } from "./identity-editor-fields";

function IdentityLookForm({
  tokens,
  scheme,
  defaultMode,
  onPatch,
  onPatchMany,
  afterForm,
  afterShape,
  idPrefix = "identity-editor",
  stickyTabs = false,
}: {
  tokens: IdentityTokens;
  scheme: "light" | "dark";
  defaultMode: "simple" | "expert";
  onPatch: (key: string, value: string, palette?: "light" | "dark") => void;
  onPatchMany: PatchMany;
  afterForm?: ReactNode;
  afterShape?: ReactNode;
  /** Field ids are prefixed per host so the dock and the editor page never share an id. */
  idPrefix?: string;
  /** Keep the Classic/Expert tabs pinned while the host scrolls (dock drawer). */
  stickyTabs?: boolean;
}) {
  const copy = identityEditorCopy.modes;
  return (
    <Stack gap="md">
      <Tabs defaultValue={defaultMode}>
        <TabsList aria-label={copy.label} className={stickyTabs ? "sticky pin-top z-header" : undefined}>
          <TabsTrigger value="simple">{copy.simple}</TabsTrigger>
          <TabsTrigger value="expert">{copy.expert}</TabsTrigger>
        </TabsList>
        <TabsContent value="simple">
          <SimpleFields tokens={tokens} scheme={scheme} idPrefix={idPrefix} onPatch={onPatch} onPatchMany={onPatchMany} />
        </TabsContent>
        <TabsContent value="expert">
          <EditorFields tokens={tokens} scheme={scheme} idPrefix={idPrefix} onPatch={onPatch} afterShape={afterShape} />
        </TabsContent>
      </Tabs>
      {afterForm}
    </Stack>
  );
}

export { IdentityLookForm };
