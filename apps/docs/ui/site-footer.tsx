import Link from "next/link";
import { Separator, Stack, Text } from "@zedtech/zedkit-ui";
import { siteFooterLinkSpecs } from "@/lib/site-links.mjs";

const linkClassName = "text-sm text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm";

/** Discreet maintainer block — same on home, docs, and 404. */
export function SiteMaintainerFooter({ changelogHref }: { changelogHref: string }) {
  const links = siteFooterLinkSpecs(changelogHref);

  return (
    <footer role="contentinfo" className="mt-auto border-t border-border">
      <Stack gap={4} className="mx-auto w-full max-w-6xl px-6 py-8">
        <Text variant="muted" as="p">Maintained by ZED TECH</Text>
        <Separator />
        <Stack direction="horizontal" gap={4} className="flex-wrap">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={linkClassName}
              {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
            >
              {item.label}
            </Link>
          ))}
        </Stack>
      </Stack>
    </footer>
  );
}
