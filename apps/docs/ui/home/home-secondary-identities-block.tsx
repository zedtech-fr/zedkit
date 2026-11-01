import Link from "next/link";
import { Button, Stack, Text } from "@zedtech/zedkit-ui";
import { IDENTITY_EDITOR_HREF } from "@/lib/site-links.mjs";
import { HomeIdentityShowcase } from "@/ui/home/home-identity-showcase";
import { HOME_PERSUASION_TEXT_CLASS } from "@/ui/home/home-rhythm";
import { homeCopy } from "@/ui/home/i18n/home-copy";

export function HomeSecondaryIdentitiesBlock() {
  return (
    <Stack gap={3} id="use-cases" className="scroll-mt-24 border-t border-border pt-6">
      <Text className="font-medium">{homeCopy.secondary.identities.heading}</Text>
      <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
        {homeCopy.secondary.identities.body}
      </Text>
      <HomeIdentityShowcase />
      <Stack direction="horizontal" gap={2} className="flex-wrap">
        <Button asChild variant="outline" size="sm" className="w-fit">
          <Link href={IDENTITY_EDITOR_HREF}>{homeCopy.secondary.identities.tryEditor}</Link>
        </Button>
        <Button asChild variant="link" size="sm" className="w-fit">
          <Link href="/docs/start-without-writing-code">{homeCopy.secondary.identities.startWithoutCode}</Link>
        </Button>
      </Stack>
    </Stack>
  );
}
