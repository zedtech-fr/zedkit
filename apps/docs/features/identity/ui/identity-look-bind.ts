import { type IdentityTokens } from "@zedtech/zedkit-ui";

import { freeLabel, type IdentitySource } from "@/lib/identity-library";
import { tokensForLook } from "./identity-look";
import { saveStatus, type SaveStatus } from "@/lib/identity-save-status";
import {
  deleteNamedIdentity,
  renameNamedIdentity,
  saveNamedIdentity,
  type NamedIdentity,
} from "./named-identities.ts";

type BindLookLibraryArgs = {
  named: NamedIdentity[];
  identity: string;
  name: string;
  tokens: IdentityTokens;
  setIdentity: (id: string) => void;
  setName: (label: string) => void;
  setStatus: (status: SaveStatus | null) => void;
  replaceDraft: (tokens: IdentityTokens, keep?: readonly string[]) => void;
  fallbackIdentity: string;
  fallbackTokens: IdentityTokens;
  saveSource?: IdentitySource;
  onDeleted?: (identity: string) => void;
};

function bindLookLibrary(args: BindLookLibraryArgs) {
  const save = (label: string, replace: boolean) => {
    const result = saveNamedIdentity(label, args.tokens, {
      replace,
      ...(args.saveSource ? { source: args.saveSource } : {}),
    });
    args.setStatus(saveStatus(result, args.named));
    if (!result.ok) return;
    args.setIdentity(result.item.id);
    args.setName(result.item.label);
  };
  return {
    onIdentity(id: string) {
      args.setIdentity(id);
      args.setStatus(null);
      const next = tokensForLook(id, args.named);
      if (next) args.replaceDraft(next, []);
      args.setName(args.named.find((item) => item.id === id)?.label ?? args.name);
    },
    onSave: (replace = false) => save(args.name, replace),
    // A name that is taken is never replaced silently: the visitor chose "save as new", so it gets a free one.
    onSaveAsNew: () => save(freeLabel(args.named, args.name), false),
    onRename() {
      const result = renameNamedIdentity(args.identity, args.name);
      args.setStatus(saveStatus(result, args.named, "renamed"));
      if (result.ok) args.setName(result.item.label);
    },
    onDelete() {
      deleteNamedIdentity(args.identity);
      args.setStatus(null);
      args.setIdentity(args.fallbackIdentity);
      args.replaceDraft(args.fallbackTokens, []);
      args.setName("");
      args.onDeleted?.(args.identity);
    },
  };
}

export { bindLookLibrary };
