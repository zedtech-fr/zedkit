"use client";

import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  applyIdentity,
  discardCustomIdentity,
  IDENTITY_CHANGE_EVENT,
  identities,
  identityContrastWarnings,
  identityPresets,
  isNamedIdentityId,
  Stack,
  Text,
  type IdentityContrastWarning,
  type IdentityOption,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";

import { identityEditorCopy } from "@/components/i18n/identity-editor-copy";
import { ContrastChips, DRAFT_SELECTOR, DraftCard } from "@/components/identity-editor-fields";
import { IdentityLookForm } from "@/components/identity-look-form";
import { IdentityEditorExport } from "@/components/identity-editor-export";
import { IdentityEditorKeepBar, IdentityEditorPreviewBar } from "@/components/identity-editor-toolbar";
import { DEFAULT_IDENTITY } from "@/lib/default-identity";
import { IDENTITY_EDITOR_DRAFT_APPLY } from "@/lib/identity-editor-draft-apply";
import { useDraftTokens, useIdentityTokenSheet } from "@/lib/identity-editor-draft";
import { bindLookLibrary } from "@/lib/identity-look-bind";
import { tokensForLook } from "@/lib/identity-look";
import {
  namedIdentityOptions,
  readLibrarySnapshot,
  readNamedIdentities,
  subscribeNamedIdentities,
  type NamedIdentity,
} from "@/lib/named-identities";
import { type SaveStatus } from "@/lib/identity-save-status";
import { clearDocsSiteIdentity } from "@/lib/site-identity-storage";
import { parseIdentityEditorSearch, serializeIdentityEditorSearch } from "@/lib/identity-editor-search";

type EditorBodyProps = {
  identity: string;
  looks: readonly IdentityOption[];
  name: string;
  namedSelected: boolean;
  tokens: IdentityTokens;
  darkPreview: boolean;
  onIdentity: (id: string) => void;
  onName: (value: string) => void;
  onSave: (replace?: boolean) => void;
  onSaveAsNew: () => void;
  onRename: () => void;
  onDelete: () => void;
  onRemoveFromSite: () => void;
  saveStatus: SaveStatus | null;
  libraryProblem: "unavailable" | "corrupt" | undefined;
  onDark: () => void;
  onReset: () => void;
  onPatch: (key: string, value: string, palette?: "light" | "dark") => void;
  onPatchMany: (entries: readonly (readonly [string, string])[]) => void;
  onFix: (warning: IdentityContrastWarning) => void;
  onUndo: () => void;
  onLoad: (tokens: IdentityTokens, darkKept: readonly string[]) => void;
  onApplySite: () => void;
  canUndo: boolean;
  appliedSite: boolean;
};

function bindNamedLooks(
  named: NamedIdentity[],
  identity: string,
  name: string,
  tokens: IdentityTokens,
  setIdentity: (id: string) => void,
  setName: (label: string) => void,
  remember: (next: IdentityTokens, keep?: readonly string[]) => void,
  setStatus: (status: SaveStatus | null) => void,
  detachSite: () => void,
) {
  const keep = bindLookLibrary({
    named,
    identity,
    name,
    tokens,
    setIdentity,
    setName,
    setStatus,
    replaceDraft: remember,
    fallbackIdentity: "mist",
    fallbackTokens: identityPresets.mist,
    onDeleted(id) {
      if (document.documentElement.getAttribute("data-identity") === id) {
        discardCustomIdentity();
        applyIdentity(DEFAULT_IDENTITY);
      }
    },
  });
  return {
    looks: [...identities, ...namedIdentityOptions(named)],
    namedSelected: isNamedIdentityId(identity),
    ...keep,
    onReset() {
      remember(tokensForLook(identity, named) ?? identityPresets.mist, []);
    },
    /** Undo "apply to the whole site": the site goes back to its own look, and this editor stops driving it. */
    onRemoveFromSite() {
      clearDocsSiteIdentity();
      discardCustomIdentity();
      applyIdentity(DEFAULT_IDENTITY);
      detachSite();
    },
  };
}

function IdentityEditorBody(props: EditorBodyProps) {
  const scheme = props.darkPreview ? "dark" : "light";
  // The order is the task: choose a look, read the hint, see the card, make the first adjustment, then keep
  // the look. On a phone the stylesheet places the card between the hint and the adjustments;
  // from `lg` it is the right column and stays in view while the left column scrolls.
  return (
    <Stack gap="list" className="content-shrink lg:grid lg:items-start" data-slot="identity-editor">
      <DraftCard darkPreview={props.darkPreview} />
      <Stack gap="list" className="content-shrink max-lg:contents lg:col-start-first lg:row-start-first">
        <IdentityEditorPreviewBar
          identity={props.identity}
          looks={props.looks}
          darkPreview={props.darkPreview}
          canUndo={props.canUndo}
          onIdentity={props.onIdentity}
          onDark={props.onDark}
          onUndo={props.onUndo}
          onReset={props.onReset}
        />
        <Stack gap="sm" data-editor-section="hint">
          <Text>{identityEditorCopy.panel.hint}</Text>
          {props.appliedSite ? <Text role="status">{identityEditorCopy.panel.applied}</Text> : null}
        </Stack>
        <Stack className="empty:hidden" data-editor-section="contrast">
          <ContrastChips warnings={identityContrastWarnings(props.tokens)} onFix={props.onFix} />
        </Stack>
        <Stack data-editor-section="fields">
          <IdentityLookForm
            tokens={props.tokens}
            scheme={scheme}
            defaultMode="expert"
            onPatch={props.onPatch}
            onPatchMany={props.onPatchMany}
            afterShape={
              <IdentityEditorKeepBar
                name={props.name}
                namedSelected={props.namedSelected}
                onName={props.onName}
                onSave={props.onSave}
                onSaveAsNew={props.onSaveAsNew}
                onRename={props.onRename}
                onDelete={props.onDelete}
                onApplySite={props.onApplySite}
                onRemoveFromSite={props.onRemoveFromSite}
                appliedSite={props.appliedSite}
                status={props.saveStatus}
                problem={props.libraryProblem}
              />
            }
          />
        </Stack>
        <Stack data-editor-section="export">
          <IdentityEditorExport tokens={props.tokens} onLoad={props.onLoad} />
        </Stack>
      </Stack>
    </Stack>
  );
}

type FollowSiteIdentityArgs = {
  ready: boolean;
  identity: string;
  tokens: IdentityTokens;
  darkPreview: boolean;
  darkKept: readonly string[];
  named: NamedIdentity[];
  onIdentity: (id: string) => void;
  appliedSite: boolean;
  detachSite: () => void;
};

// Follow identity switches made outside the editor (header chooser,
// another tab): resync fields and URL to the applied look, then stop
// driving the site. The one exception is an unapplied dirty draft —
// the editing session wins over the header there. Adopting goes
// through the same path as the Look select, so Undo keeps the draft.
function useFollowSiteIdentity(args: FollowSiteIdentityArgs) {
  const siteIdentity = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (!args.ready) return;
    const sync = () => {
      const applied = document.documentElement.getAttribute("data-identity");
      if (!applied || applied === siteIdentity.current) return;
      const first = siteIdentity.current === null;
      siteIdentity.current = applied;
      if (first || applied === args.identity) return;
      const clean = [...new URLSearchParams(serializeIdentityEditorSearch(args.identity, args.tokens, args.darkPreview, args.darkKept)).keys()]
        .every((key) => key === "identity" || key === "theme");
      if (!clean && !args.appliedSite) return;
      if (tokensForLook(applied, args.named)) args.onIdentity(applied);
      if (args.appliedSite) args.detachSite();
    };
    sync();
    window.addEventListener(IDENTITY_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(IDENTITY_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  });
}

function IdentityEditorPanel() {
  const named = useSyncExternalStore(subscribeNamedIdentities, readNamedIdentities, readNamedIdentities);
  // Read as a store, with no server value: what storage holds is only known in the browser, so the first paint agrees.
  const libraryProblem = useSyncExternalStore(subscribeNamedIdentities, () => readLibrarySnapshot().problem, () => undefined);
  const [identity, setIdentity] = useState("mist");
  const draft = useDraftTokens(identityPresets.mist, identity);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<SaveStatus | null>(null);
  const [darkPreview, setDarkPreview] = useState(false);
  const [ready, setReady] = useState(false);
  const { tokens, darkKept, remember, undo, applySite, detachSite, appliedSite, past, load, patch, patchMany, fix, applySuggest } = draft;
  const bound = bindNamedLooks(named, identity, name, tokens, setIdentity, setName, remember, setStatus, detachSite);

  useLayoutEffect(() => {
    const parsed = parseIdentityEditorSearch(window.location.search);
    setIdentity(parsed.identity);
    load(parsed.tokens, parsed.darkKept);
    const saved = readNamedIdentities().find((item) => item.id === parsed.identity);
    if (saved) setName(saved.label);
    if (parsed.darkPreview) setDarkPreview(true);
    setReady(true);
  }, []);

  useFollowSiteIdentity({ ready, identity, tokens, darkPreview, darkKept, named, onIdentity: bound.onIdentity, appliedSite, detachSite });

  useLayoutEffect(() => {
    const onApply = (event: Event) => {
      const detail = (event as CustomEvent<IdentityTokens>).detail;
      if (detail) applySuggest(detail, false);
    };
    window.addEventListener(IDENTITY_EDITOR_DRAFT_APPLY, onApply);
    return () => window.removeEventListener(IDENTITY_EDITOR_DRAFT_APPLY, onApply);
  }, [applySuggest]);

  useIdentityTokenSheet(tokens, DRAFT_SELECTOR, ready);

  useLayoutEffect(() => {
    if (!ready) return;
    const query = serializeIdentityEditorSearch(identity, tokens, darkPreview, darkKept);
    const create = window.location.hash === "#create" ? "#create" : "";
    window.history.replaceState(null, "", `${window.location.pathname}?${query}${create}`);
  }, [darkKept, darkPreview, identity, ready, tokens]);

  return (
    <IdentityEditorBody
      identity={identity}
      name={name}
      tokens={tokens}
      darkPreview={darkPreview}
      {...bound}
      onName={setName}
      onDark={() => setDarkPreview(!darkPreview)}
      onPatch={(key, value, palette) => patch(key, value, palette ?? (darkPreview ? "dark" : "light"))}
      onPatchMany={patchMany}
      onFix={fix}
      saveStatus={status}
      libraryProblem={libraryProblem}
      onUndo={undo}
      onLoad={remember}
      onApplySite={applySite}
      canUndo={past.length > 0}
      appliedSite={appliedSite}
    />
  );
}

export { IdentityEditorPanel };
