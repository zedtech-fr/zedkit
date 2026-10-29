import {
  identityPresets,
  isPresetId,
  parseIdentityTokens,
  type IdentityId,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";

const SCALAR_KEYS = [
  "spacing",
  "borderWidth",
  "radius",
  "bodyLeading",
  "headingLeading",
  "headingTracking",
  "labelTracking",
  "shadowSm",
  "shadowMd",
] as const;

const LIGHT_KEYS = ["background", "foreground", "primary", "accent", "border"] as const;

function clonePreset(id: IdentityId): IdentityTokens {
  const preset = identityPresets[id];
  return { ...preset, light: { ...preset.light }, dark: { ...preset.dark } };
}

type IdentityEditorSearch = {
  identity: IdentityId;
  tokens: IdentityTokens;
  darkPreview: boolean;
};

function parseIdentityEditorSearch(search: string): IdentityEditorSearch {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const rawId = params.get("identity") ?? "mist";
  const identity: IdentityId = isPresetId(rawId) ? rawId : "mist";
  const fallback = clonePreset(identity);
  const draft: IdentityTokens = {
    ...fallback,
    light: { ...fallback.light },
    dark: { ...fallback.dark },
  };
  for (const key of SCALAR_KEYS) {
    const value = params.get(key);
    if (value) draft[key] = value;
  }
  for (const key of LIGHT_KEYS) {
    const light = params.get(key);
    if (light) draft.light[key] = light;
    const dark = params.get(`dark-${key}`);
    if (dark) draft.dark[key] = dark;
  }
  const parsed = parseIdentityTokens(draft);
  return {
    identity,
    tokens: parsed.success ? parsed.data : fallback,
    darkPreview: params.get("theme") === "dark",
  };
}

function serializeIdentityEditorSearch(
  identity: IdentityId,
  tokens: IdentityTokens,
  darkPreview: boolean,
): string {
  const params = new URLSearchParams();
  params.set("identity", identity);
  if (darkPreview) params.set("theme", "dark");
  const base = identityPresets[identity];
  for (const key of SCALAR_KEYS) {
    if (tokens[key] !== base[key]) params.set(key, tokens[key]);
  }
  for (const key of LIGHT_KEYS) {
    if (tokens.light[key] !== base.light[key]) params.set(key, tokens.light[key]);
    if (tokens.dark[key] !== base.dark[key]) params.set(`dark-${key}`, tokens.dark[key]);
  }
  return params.toString();
}

export { LIGHT_KEYS, SCALAR_KEYS, parseIdentityEditorSearch, serializeIdentityEditorSearch };
