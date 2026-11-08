import Link from "next/link";
import { Container, Separator, Stack, Text } from "@zedtech/zedkit-ui";
import { siteFooterLinkSpecs } from "@/lib/site-links.mjs";

const linkClassName = "inline-flex min-h-floor items-center rounded-sm text-dense text-muted-foreground link-offset hover:underline focus-ring";

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
        <Stack gap="lg" className="py-section-sm">
          <Text variant="muted" as="p">Maintained by ZED TECH</Text>
          <Separator />
          <Stack direction="horizontal" gap="lg" className="flex-wrap">
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
