"use client";

import { useEffect, useRef, useState } from "react";
import { identityPresets } from "@zedtech/zedkit-ui";

import {
  compactPreviewSpacing,
  hasReviewAppearanceQuery,
  parseReviewAppearance,
} from "../model/review-appearance";

/** Pin identity+mode only when the share URL has appearance keys; else inherit `html`. */
export function useReviewAppearanceScope() {
  const scopeRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  useEffect(() => {
    setSearch(window.location.search);
  }, []);
  const appearance = parseReviewAppearance(search);
  const pin = hasReviewAppearanceQuery(search);
  const tokens = identityPresets[appearance.identity] ?? identityPresets.glass;
  const compact =
    appearance.density === "compact" ? compactPreviewSpacing(tokens.spacing) : undefined;
  useEffect(() => {
    const node = scopeRef.current;
    if (!node) return;
    if (compact) node.style.setProperty("--spacing", compact);
    else node.style.removeProperty("--spacing");
  }, [compact]);
  return {
    scopeRef,
    identity: pin ? appearance.identity : undefined,
    mode: pin ? appearance.mode : undefined,
  };
}
