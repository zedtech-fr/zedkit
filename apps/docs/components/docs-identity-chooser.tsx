"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  applyCustomIdentity,
  IdentityPicker,
  IdentitySwitcher,
  identities as builtInIdentities,
} from "@zedtech/zedkit-ui";

import { DEFAULT_IDENTITY } from "@/lib/default-identity";
import { namedIdentityOptions, readNamedIdentities, subscribeNamedIdentities } from "@/lib/named-identities";

function useNamedList() {
  return useSyncExternalStore(subscribeNamedIdentities, readNamedIdentities, readNamedIdentities);
}

function useChooser() {
  const named = useNamedList();
  const identities = [...builtInIdentities, ...namedIdentityOptions(named)];
  const onIdentityChange = useCallback(
    (id: string) => {
      const saved = named.find((item) => item.id === id);
      if (saved) applyCustomIdentity(saved.tokens, saved.id);
    },
    [named],
  );
  return { identities, onIdentityChange };
}

function DocsIdentitySwitcher() {
  const { identities, onIdentityChange } = useChooser();
  return (
    <IdentitySwitcher
      defaultIdentity={DEFAULT_IDENTITY}
      identities={identities}
      onIdentityChange={onIdentityChange}
    />
  );
}

function DocsIdentityPicker() {
  const { identities, onIdentityChange } = useChooser();
  return (
    <IdentityPicker
      defaultIdentity={DEFAULT_IDENTITY}
      identities={identities}
      onIdentityChange={onIdentityChange}
    />
  );
}

export { DocsIdentityPicker, DocsIdentitySwitcher };
