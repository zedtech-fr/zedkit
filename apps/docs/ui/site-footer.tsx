import Link from "next/link";
import { Container, Stack, Text } from "@zedtech/zedkit-ui";
import { siteFooterLinkSpecs } from "@/lib/site-links.mjs";
import { siteChromeCopy } from "@/ui/i18n/site-chrome-copy";

const linkClassName = "inline-flex min-h-target items-center rounded-sm text-dense text-muted-foreground link-offset hover:underline focus-ring";

/** Slim credit row — same on home, docs, and 404. */
export function SiteMaintainerFooter({
  embeddedInMain,
}: {
  /** Docs pages: footer sits inside `<main>` — omit top-level contentinfo landmark. */
  embeddedInMain?: boolean;
}) {
  const links = siteFooterLinkSpecs();

  return (
    <footer
      {...(embeddedInMain ? {} : { role: "contentinfo" })}
      className="mt-auto border-t border-border"
    >
      <Container width="wide">
        <Stack direction="horizontal" gap="lg" className="flex-wrap py-section-sm">
          <Text variant="muted" as="span" className="me-auto">
            {siteChromeCopy.brand.name}, {siteChromeCopy.footer.credit}
          </Text>
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={linkClassName}
              {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
            >
              {siteChromeCopy.footer.links[item.copyKey]}
            </Link>
          ))}
        </Stack>
      </Container>
    </footer>
  );
}
