import Link from "next/link";
import { Button, Stack, Text } from "@zedtech/zedkit-ui";
import { IDENTITY_EDITOR_HREF } from "@/lib/site-links.mjs";
import { HomeIdentitySpecimenStrip } from "@/ui/home/home-identity-specimen-strip";
import { HOME_PERSUASION_TEXT_CLASS } from "@/ui/home/home-rhythm";

export function HomeSecondaryIdentitiesBlock() {
  return (
    <Stack gap={3} id="use-cases" className="scroll-mt-24 border-t border-border pt-6">
      <Text className="font-medium">Six visual identities</Text>
      <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
        Tide, Mist, Press, Volt, Maison, and Glass — switch Display on the hero demo, or open the editor.
      </Text>
      <HomeIdentitySpecimenStrip />
      <Stack direction="horizontal" gap={2} className="flex-wrap">
        <Button asChild variant="outline" size="sm" className="w-fit">
          <Link href={IDENTITY_EDITOR_HREF}>Try the demo editor</Link>
        </Button>
        <Button asChild variant="link" size="sm" className="w-fit">
          <Link href="/docs/start-without-writing-code">Start without writing code</Link>
        </Button>
      </Stack>
    </Stack>
  );
}
