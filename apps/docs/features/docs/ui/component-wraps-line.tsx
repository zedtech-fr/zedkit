import Link from "next/link";
import { Text } from "@zedtech/zedkit-ui";
import { componentWrapsLineCopy } from "../i18n/component-wraps-line-copy";
import { wrapTokenHref } from "../wrap-token-href.mjs";

/** Catalog `wraps` field: backtick-separated npm names and plain notes. */
export function parseWrapTokens(wraps: string): string[] {
  const tokens = [...wraps.matchAll(/`([^`]+)`/g)].map((match) => match[1]!);
  if (tokens.length > 0) return tokens;
  const trimmed = wraps.trim();
  return trimmed.length > 0 ? [trimmed] : [];
}

export function ComponentWrapsLine({ wraps }: { wraps: string }) {
  const tokens = parseWrapTokens(wraps);
  if (tokens.length === 0) return null;
  return (
    <Text variant="muted">
      {componentWrapsLineCopy.prefix}{" "}
      {tokens.map((token, index) => {
        const href = wrapTokenHref(token);
        return (
          <Text as="span" key={`${token}-${index}`}>
            {index > 0 ? ", " : null}
            {href ? (
              <Link href={href} className="font-mono text-foreground link-offset hover:underline">
                {token}
              </Link>
            ) : (
              <Text as="span" className="font-mono text-foreground">
                {token}
              </Text>
            )}
          </Text>
        );
      })}
    </Text>
  );
}
