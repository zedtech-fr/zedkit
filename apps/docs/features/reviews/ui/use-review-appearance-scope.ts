"use client";

import { useEffect, useRef, useState } from "react";
import { identityPresets } from "@zedtech/zedkit-ui";

import { DEFAULT_IDENTITY } from "@/lib/default-identity";
import {
  compactPreviewSpacing,
  listScopeAppearance,
  type ReviewScopeAppearance,
} from "../model/review-appearance";

/** Pin identity+mode only when the share URL has appearance keys; else inherit `html`. */
export function useReviewAppearanceScope(
  resolve: (search: string) => ReviewScopeAppearance = listScopeAppearance,
) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  useEffect(() => {
    setSearch(window.location.search);
  }, []);
  const scope = resolve(search);
  const tokens = identityPresets[scope.identity ?? DEFAULT_IDENTITY] ?? identityPresets.glass;
  const compact =
    scope.density === "compact" ? compactPreviewSpacing(tokens.spacing) : undefined;
  useEffect(() => {
    const node = scopeRef.current;
    if (!node) return;
    if (compact) node.style.setProperty("--spacing", compact);
    else node.style.removeProperty("--spacing");
  }, [compact]);
  return {
    scopeRef,
    identity: scope.identity,
    mode: scope.mode,
  };
}
