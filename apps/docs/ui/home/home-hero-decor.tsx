import { Stack, Text } from "@zedtech/zedkit-ui";

const tickerItems = ["admin ui", "backend", "seo", "coding agents", "zedkit-ui", "zedkit-core", "zedkit-server", "zedkit-seo"];

/**
 * Decorative ticker: an identity opts in through the `--zk-deco-ticker`
 * display token (retro-square shows it, the others hide it). Purely visual,
 * hidden from assistive tech.
 */
export function HomeHeroDecor() {
  return (
    <Stack aria-hidden="true" className="identity-ticker w-full overflow-hidden border-y border-border py-2">
      <Stack direction="horizontal" gap={6} className="marquee-track">
        {[...tickerItems, ...tickerItems].map((item, index) => (
          <Text key={`${item}-${index}`} variant="muted" className="font-mono text-sm tracking-widest whitespace-nowrap uppercase">
            {item} /
          </Text>
        ))}
      </Stack>
    </Stack>
  );
}
