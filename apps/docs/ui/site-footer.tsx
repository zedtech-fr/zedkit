import Link from "next/link";
import { Container, Separator, Stack, Text } from "@zedtech/zedkit-ui";
import { siteFooterLinkSpecs } from "@/lib/site-links.mjs";

const linkClassName = "rounded-sm text-sm text-muted-foreground underline-offset-4 hover:underline focus-ring";

/** Discreet maintainer block — same on home, docs, and 404. */
export function SiteMaintainerFooter({
  changelogHref,
  embeddedInMain,
}: {
  changelogHref: string;
  /** Docs pages: footer sits inside `<main>` — omit top-level contentinfo landmark. */
  embeddedInMain?: boolean;
}) {
  const links = siteFooterLinkSpecs(changelogHref);

  return (
    <footer
      {...(embeddedInMain ? {} : { role: "contentinfo" })}
      className="mt-auto border-t border-border"
    >
      <Container width="wide">
        <Stack gap={4} className="py-8">
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
      </Container>
    </footer>
  );
}
