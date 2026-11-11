"use client";

import { useId, useLayoutEffect, useState, useSyncExternalStore, type ReactNode } from "react";
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
  applyIdentityTokenSheet,
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
import { useDraftTokens } from "@/lib/identity-editor-draft";
import { freeLabel } from "@/lib/identity-library";
import { saveStatus, type SaveStatus } from "@/lib/identity-save-status";
import {
  deleteNamedIdentity,
  namedIdentityOptions,
  readLibrarySnapshot,
  readNamedIdentities,
  renameNamedIdentity,
  saveNamedIdentity,
  subscribeNamedIdentities,
  type NamedIdentity,
} from "@/lib/named-identities";
import { catalogCopy } from "@/ui/catalog/i18n/catalog-copy";

/**
 * Métier: zedkit publishes generic UI/AI packages and a public docs catalog.
 * Client personas: integrating developers who search Catalog by need; a smaller set who write CSS variables.
 * Customers: not on this page.
 * UI: search stays first (find-by-need); one compact page-level form; Simple is four colours plus radius and spacing; preview is a ThemeScope on results, not :root.
 */
const CATALOG_LOOK = "catalog-look";
const CATALOG_LOOK_SELECTOR = `[data-identity-scope][data-identity="${CATALOG_LOOK}"]`;

function catalogStartTokens(): IdentityTokens {
  return isPresetId(DEFAULT_IDENTITY) ? identityPresets[DEFAULT_IDENTITY] : identityPresets.mist;
}

function tokensForLook(id: string, named: NamedIdentity[]): IdentityTokens | undefined {
  if (isPresetId(id)) return identityPresets[id];
  return named.find((item) => item.id === id)?.tokens;
}

function useCatalogLookSheet(tokens: IdentityTokens) {
  useLayoutEffect(() => {
    const sheet = applyIdentityTokenSheet(tokens, CATALOG_LOOK_SELECTOR);
    return () => {
      sheet.remove();
    };
  }, [tokens]);
}

function CatalogLookBar({
  identity,
  looks,
  lookId,
  darkPreview,
  onIdentity,
  onDark,
}: {
  identity: string;
  looks: readonly IdentityOption[];
  lookId: string;
  darkPreview: boolean;
  onIdentity: (id: string) => void;
  onDark: () => void;
}) {
  return (
    <Stack direction="horizontal" gap="sm" className="flex-wrap items-end">
      <Field className="w-full sm:w-look">
        <FieldLabel htmlFor={lookId}>{identityEditorCopy.toolbar.look}</FieldLabel>
        <Select value={identity} onValueChange={onIdentity}>
          <SelectTrigger id={lookId} className="w-full">
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

function bindCatalogKeep(
  named: NamedIdentity[],
  identity: string,
  name: string,
  tokens: IdentityTokens,
  start: IdentityTokens,
  setIdentity: (id: string) => void,
  setName: (label: string) => void,
  setStatus: (status: SaveStatus | null) => void,
  load: (tokens: IdentityTokens, keep?: readonly string[]) => void,
) {
  const save = (label: string, replace: boolean) => {
    const result = saveNamedIdentity(label, tokens, { replace, source: "editor" });
    setStatus(saveStatus(result, named));
    if (!result.ok) return;
    setIdentity(result.item.id);
    setName(result.item.label);
  };
  return {
    onSave: (replace = false) => save(name, replace),
    onSaveAsNew: () => save(freeLabel(named, name), false),
    onRename() {
      const result = renameNamedIdentity(identity, name);
      setStatus(saveStatus(result, named, "renamed"));
      if (result.ok) setName(result.item.label);
    },
    onDelete() {
      deleteNamedIdentity(identity);
      setStatus(null);
      setIdentity(DEFAULT_IDENTITY);
      load(start, []);
      setName("");
    },
  };
}

function CatalogIdentity({ children }: { children: ReactNode }) {
  const named = useSyncExternalStore(subscribeNamedIdentities, readNamedIdentities, readNamedIdentities);
  const libraryProblem = useSyncExternalStore(
    subscribeNamedIdentities,
    () => readLibrarySnapshot().problem,
    () => undefined,
  );
  const start = catalogStartTokens();
  const [identity, setIdentity] = useState(DEFAULT_IDENTITY);
  const draft = useDraftTokens(start, identity);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<SaveStatus | null>(null);
  const [darkPreview, setDarkPreview] = useState(false);
  const lookId = useId();
  const { tokens, load, patch } = draft;
  const scheme = darkPreview ? "dark" : "light";
  const keep = bindCatalogKeep(named, identity, name, tokens, start, setIdentity, setName, setStatus, load);
  useCatalogLookSheet(tokens);

  return (
    <Stack gap="md">
      <Stack gap="sm" role="group" aria-label={catalogCopy.identity.groupLabel}>
        <CatalogLookBar
          identity={identity}
          looks={[...identities, ...namedIdentityOptions(named)]}
          lookId={lookId}
          darkPreview={darkPreview}
          onIdentity={(id) => {
            setIdentity(id);
            setStatus(null);
            const next = tokensForLook(id, named);
            if (next) load(next, []);
            setName(named.find((item) => item.id === id)?.label ?? name);
          }}
          onDark={() => setDarkPreview((on) => !on)}
        />
        <IdentityLookForm
          tokens={tokens}
          scheme={scheme}
          defaultMode="simple"
          onPatch={(key, value, palette) => patch(key, value, palette ?? scheme)}
          afterSimple={
            <IdentityEditorKeepBar
              name={name}
              namedSelected={isNamedIdentityId(identity)}
              onName={setName}
              status={status}
              problem={libraryProblem}
              {...keep}
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
