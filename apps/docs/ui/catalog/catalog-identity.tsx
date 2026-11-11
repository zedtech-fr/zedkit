"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import {
  Button,
  Field,
  FieldLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  ThemeScope,
  identities,
  identityPresets,
  isNamedIdentityId,
  isPresetId,
  type IdentityOption,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";

import { identityEditorCopy } from "@/components/i18n/identity-editor-copy";
import { IdentityEditorKeepBar } from "@/components/identity-editor-toolbar";
import { IdentityLookForm } from "@/components/identity-look-form";
import { DEFAULT_IDENTITY } from "@/lib/default-identity";
import { useDraftTokens, useIdentityTokenSheet } from "@/lib/identity-editor-draft";
import { bindLookLibrary } from "@/lib/identity-look-bind";
import { type SaveStatus } from "@/lib/identity-save-status";
import {
  namedIdentityOptions,
  readLibrarySnapshot,
  readNamedIdentities,
  subscribeNamedIdentities,
  type NamedIdentity,
} from "@/lib/named-identities";
import { catalogCopy } from "@/ui/catalog/i18n/catalog-copy";

/**
 * Métier: zedkit publishes generic UI/AI packages and a public docs catalog.
 * Client personas: integrating developers who search Catalog by need; a smaller set who write CSS variables.
 * Customers: not on this page.
 * Customer personas: n/a (assumed: Catalog serves client personas only, not their end customers).
 * UI: search stays first because: client = find-by-need before trying a look.
 * UI: one compact page-level form because: client = stay on results, do not open the demo editor.
 * UI: Simple is four colours plus radius and spacing because: client = not a CSS author by default.
 * UI: preview is a ThemeScope on results, not :root because: client = try a look without restyling docs chrome.
 */
const CATALOG_LOOK = "catalog-look";
const CATALOG_LOOK_SELECTOR = `[data-identity-scope][data-identity="${CATALOG_LOOK}"]`;
const LOOK_CONTROL_ID = "identity-editor-look";
const CATALOG_START_TOKENS: IdentityTokens = isPresetId(DEFAULT_IDENTITY)
  ? identityPresets[DEFAULT_IDENTITY]
  : identityPresets.mist;

function CatalogLookBar({
  identity,
  looks,
  darkPreview,
  onIdentity,
  onDark,
}: {
  identity: string;
  looks: readonly IdentityOption[];
  darkPreview: boolean;
  onIdentity: (id: string) => void;
  onDark: () => void;
}) {
  return (
    <Stack direction="horizontal" gap="sm" className="flex-wrap items-end">
      <Field className="w-full sm:w-look">
        <FieldLabel htmlFor={LOOK_CONTROL_ID}>{identityEditorCopy.toolbar.look}</FieldLabel>
        <Select value={identity} onValueChange={onIdentity}>
          <SelectTrigger
            id={LOOK_CONTROL_ID}
            data-identity-look-control=""
            className="w-full"
            aria-label={identityEditorCopy.toolbar.look}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {looks.map((look) => (
              <SelectItem key={look.id} value={look.id}>
                {look.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Button type="button" variant="outline" aria-pressed={darkPreview} onClick={onDark}>
        {identityEditorCopy.toolbar.previewDark}
      </Button>
    </Stack>
  );
}

function catalogLibrary(
  named: NamedIdentity[],
  identity: string,
  name: string,
  tokens: IdentityTokens,
  setIdentity: (id: string) => void,
  setName: (label: string) => void,
  setStatus: (status: SaveStatus | null) => void,
  load: (tokens: IdentityTokens, keep?: readonly string[]) => void,
) {
  return bindLookLibrary({
    named,
    identity,
    name,
    tokens,
    setIdentity,
    setName,
    setStatus,
    replaceDraft: load,
    fallbackIdentity: DEFAULT_IDENTITY,
    fallbackTokens: CATALOG_START_TOKENS,
    saveSource: "editor",
  });
}

function CatalogIdentity({ children }: { children: ReactNode }) {
  const named = useSyncExternalStore(subscribeNamedIdentities, readNamedIdentities, readNamedIdentities);
  const problem = useSyncExternalStore(subscribeNamedIdentities, () => readLibrarySnapshot().problem, () => undefined);
  const [identity, setIdentity] = useState(DEFAULT_IDENTITY);
  const { tokens, load, patch } = useDraftTokens(CATALOG_START_TOKENS, identity);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<SaveStatus | null>(null);
  const [darkPreview, setDarkPreview] = useState(false);
  const scheme = darkPreview ? "dark" : "light";
  const keep = catalogLibrary(named, identity, name, tokens, setIdentity, setName, setStatus, load);
  useIdentityTokenSheet(tokens, CATALOG_LOOK_SELECTOR);
  return (
    <Stack gap="md">
      <Stack gap="sm" role="group" aria-label={catalogCopy.identity.groupLabel}>
        <CatalogLookBar
          identity={identity}
          looks={[...identities, ...namedIdentityOptions(named)]}
          darkPreview={darkPreview}
          onIdentity={keep.onIdentity}
          onDark={() => setDarkPreview((on) => !on)}
        />
        <IdentityLookForm
          tokens={tokens}
          scheme={scheme}
          defaultMode="simple"
          onPatch={(key, value, palette) => patch(key, value, palette ?? scheme)}
          afterForm={
            <IdentityEditorKeepBar
              name={name}
              namedSelected={isNamedIdentityId(identity)}
              onName={setName}
              status={status}
              problem={problem}
              onSave={keep.onSave}
              onSaveAsNew={keep.onSaveAsNew}
              onRename={keep.onRename}
              onDelete={keep.onDelete}
            />
          }
        />
      </Stack>
      <ThemeScope identity={CATALOG_LOOK} mode={scheme} className="bg-background text-foreground">
        {children}
      </ThemeScope>
    </Stack>
  );
}

export { CatalogIdentity };
