"use client";

import { type ReactNode } from "react";
import { Stack, Tabs, TabsContent, TabsList, TabsTrigger, type IdentityTokens } from "@zedtech/zedkit-ui";

import { identityEditorCopy } from "@/components/i18n/identity-editor-copy";
import { SimpleFields, type PatchMany } from "@/components/identity-classic-fields";
import { EditorFields } from "@/components/identity-editor-fields";

function LookFormPanels({
  tokens,
  scheme,
  idPrefix,
  onPatch,
  onPatchMany,
  afterShape,
}: {
  tokens: IdentityTokens;
  scheme: "light" | "dark";
  idPrefix: string;
  onPatch: (key: string, value: string, palette?: "light" | "dark") => void;
  onPatchMany: PatchMany;
  afterShape?: ReactNode;
}) {
  return (
    <>
      <TabsContent value="simple">
        <SimpleFields tokens={tokens} scheme={scheme} idPrefix={idPrefix} onPatch={onPatch} onPatchMany={onPatchMany} />
      </TabsContent>
      <TabsContent value="expert">
        <EditorFields tokens={tokens} scheme={scheme} idPrefix={idPrefix} onPatch={onPatch} afterShape={afterShape} />
      </TabsContent>
    </>
  );
}

function IdentityLookForm({
  tokens,
  scheme,
  defaultMode,
  onPatch,
  onPatchMany,
  afterForm,
  afterShape,
  idPrefix = "identity-editor",
  tabs = "owned",
}: {
  tokens: IdentityTokens;
  scheme: "light" | "dark";
  /** Owned tabs only. Ignored when `tabs="embedded"` — the parent `Tabs` owns the default. */
  defaultMode?: "simple" | "expert";
  onPatch: (key: string, value: string, palette?: "light" | "dark") => void;
  onPatchMany: PatchMany;
  afterForm?: ReactNode;
  afterShape?: ReactNode;
  /** Field ids are prefixed per host so the dock and the editor page never share an id. */
  idPrefix?: string;
  /** `owned` wraps Classic/Expert tabs. `embedded` renders panels for a parent `Tabs`. */
  tabs?: "owned" | "embedded";
}) {
  const copy = identityEditorCopy.modes;
  const panels = (
    <LookFormPanels
      tokens={tokens}
      scheme={scheme}
      idPrefix={idPrefix}
      onPatch={onPatch}
      onPatchMany={onPatchMany}
      afterShape={afterShape}
    />
  );
  if (tabs === "embedded") {
    return (
      <Stack gap="md">
        {panels}
        {afterForm}
      </Stack>
    );
  }
  return (
    <Stack gap="md">
      <Tabs defaultValue={defaultMode ?? "simple"}>
        <TabsList aria-label={copy.label}>
          <TabsTrigger value="simple">{copy.simple}</TabsTrigger>
          <TabsTrigger value="expert">{copy.expert}</TabsTrigger>
        </TabsList>
        {panels}
      </Tabs>
      {afterForm}
    </Stack>
  );
}

export { IdentityLookForm };
