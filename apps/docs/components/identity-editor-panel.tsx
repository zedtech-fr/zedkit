"use client";

import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import {
  applyIdentity,
  applyIdentityTokenSheet,
  discardCustomIdentity,
  IDENTITY_CHANGE_EVENT,
  identities,
  identityContrastWarnings,
  identityPresets,
  isNamedIdentityId,
  isPresetId,
  Stack,
  Text,
  type IdentityContrastWarning,
  type IdentityOption,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";

import { ContrastChips, DRAFT_SELECTOR, DraftCard, EditorFields } from "@/components/identity-editor-fields";
import { IdentityEditorExport } from "@/components/identity-editor-export";
import { IdentityEditorSuggest } from "@/components/identity-editor-suggest";
import { IdentityEditorToolbar } from "@/components/identity-editor-toolbar";
import { DEFAULT_IDENTITY } from "@/lib/default-identity";
import { useDraftTokens } from "@/lib/identity-editor-draft";
import {
  deleteNamedIdentity,
  namedIdentityOptions,
  readNamedIdentities,
  renameNamedIdentity,
  saveNamedIdentity,
  subscribeNamedIdentities,
  type NamedIdentity,
} from "@/lib/named-identities";
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
  onSave: () => void;
  onRename: () => void;
  onDelete: () => void;
  onDark: () => void;
  onReset: () => void;
  onPatch: (key: string, value: string) => void;
  onFix: (warning: IdentityContrastWarning) => void;
  onSuggestApply: (next: IdentityTokens, toSite: boolean) => void;
  onUndo: () => void;
  onApplySite: () => void;
  canUndo: boolean;
  appliedSite: boolean;
};

function tokensForLook(id: string, named: NamedIdentity[]): IdentityTokens | undefined {
  if (isPresetId(id)) return identityPresets[id];
  return named.find((item) => item.id === id)?.tokens;
}

function bindNamedLooks(
  named: NamedIdentity[],
  identity: string,
  name: string,
  tokens: IdentityTokens,
  setIdentity: (id: string) => void,
  setName: (label: string) => void,
  remember: (next: IdentityTokens, keep?: readonly string[]) => void,
) {
  return {
    looks: [...identities, ...namedIdentityOptions(named)],
    namedSelected: isNamedIdentityId(identity),
    onIdentity(id: string) {
      setIdentity(id);
      const next = tokensForLook(id, named);
      if (next) remember(next, []);
      setName(named.find((item) => item.id === id)?.label ?? name);
    },
    onSave() {
      const saved = saveNamedIdentity(name, tokens);
      if (!saved) return;
      setIdentity(saved.id);
      setName(saved.label);
    },
    onRename() {
      const saved = renameNamedIdentity(identity, name);
      if (saved) setName(saved.label);
    },
    onDelete() {
      deleteNamedIdentity(identity);
      setIdentity("mist");
      remember(identityPresets.mist, []);
      setName("");
      if (document.documentElement.getAttribute("data-identity") === identity) {
        discardCustomIdentity();
        applyIdentity(DEFAULT_IDENTITY);
      }
    },
    onReset() {
      remember(tokensForLook(identity, named) ?? identityPresets.mist, []);
    },
  };
}

function IdentityEditorBody(props: EditorBodyProps) {
  const scheme = props.darkPreview ? "dark" : "light";
  return (
    <Stack gap={6} data-slot="identity-editor">
      <IdentityEditorToolbar
        identity={props.identity}
        looks={props.looks}
        name={props.name}
        namedSelected={props.namedSelected}
        darkPreview={props.darkPreview}
        canUndo={props.canUndo}
        onIdentity={props.onIdentity}
        onName={props.onName}
        onSave={props.onSave}
        onRename={props.onRename}
        onDelete={props.onDelete}
        onDark={props.onDark}
        onUndo={props.onUndo}
        onReset={props.onReset}
        onApplySite={props.onApplySite}
      />
      <Text>Change spacing first, then watch the card.</Text>
      {props.appliedSite ? <Text role="status">Applied to the whole site.</Text> : null}
      <ContrastChips warnings={identityContrastWarnings(props.tokens)} onFix={props.onFix} />
      <IdentityEditorSuggest tokens={props.tokens} onApply={props.onSuggestApply} />
      <DraftCard darkPreview={props.darkPreview} />
      <EditorFields tokens={props.tokens} scheme={scheme} onPatch={props.onPatch} />
      <IdentityEditorExport tokens={props.tokens} />
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
  const [identity, setIdentity] = useState("mist");
  const draft = useDraftTokens(identityPresets.mist, identity);
  const [name, setName] = useState("");
  const [darkPreview, setDarkPreview] = useState(false);
  const [ready, setReady] = useState(false);
  const { setTheme } = useTheme();
  const { tokens, darkKept, remember, undo, applySite, detachSite, appliedSite, past, load, patch, fix, applySuggest } = draft;
  const bound = bindNamedLooks(named, identity, name, tokens, setIdentity, setName, remember);

  useLayoutEffect(() => {
    const parsed = parseIdentityEditorSearch(window.location.search);
    setIdentity(parsed.identity);
    load(parsed.tokens, parsed.darkKept);
    const saved = readNamedIdentities().find((item) => item.id === parsed.identity);
    if (saved) setName(saved.label);
    if (parsed.darkPreview) {
      setDarkPreview(true);
      setTheme("dark");
    }
    setReady(true);
  }, []);

  useFollowSiteIdentity({ ready, identity, tokens, darkPreview, darkKept, named, onIdentity: bound.onIdentity, appliedSite, detachSite });

  useLayoutEffect(() => {
    if (!ready) return;
    const sheet = applyIdentityTokenSheet(tokens, DRAFT_SELECTOR);
    const query = serializeIdentityEditorSearch(identity, tokens, darkPreview, darkKept);
    window.history.replaceState(null, "", `${window.location.pathname}?${query}`);
    return () => {
      sheet.remove();
    };
  }, [darkKept, darkPreview, identity, ready, tokens]);

  return (
    <IdentityEditorBody
      identity={identity}
      name={name}
      tokens={tokens}
      darkPreview={darkPreview}
      {...bound}
      onName={setName}
      onDark={() => {
        setDarkPreview(!darkPreview);
        setTheme(darkPreview ? "light" : "dark");
      }}
      onPatch={(key, value) => patch(key, value, darkPreview ? "dark" : "light")}
      onFix={fix}
      onSuggestApply={applySuggest}
      onUndo={undo}
      onApplySite={applySite}
      canUndo={past.length > 0}
      appliedSite={appliedSite}
    />
  );
}

export { IdentityEditorPanel };
