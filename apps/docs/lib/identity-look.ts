import { identityPresets, isPresetId, type IdentityTokens } from "@zedtech/zedkit-ui";

function tokensForLook(
  id: string,
  named: readonly { id: string; tokens: IdentityTokens }[],
): IdentityTokens | undefined {
  if (isPresetId(id)) return identityPresets[id];
  return named.find((item) => item.id === id)?.tokens;
}

export { tokensForLook };
