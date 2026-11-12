"use client";

import { HomeLink } from "@/ui/home/home-link";
import { useRef, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import {
  Button,
  Heading,
  Stack,
  Tabs,
  TabsContent,
  Text,
  ThemeScope,
} from "@zedtech/zedkit-ui";
import { IDENTITY_EDITOR_HREF } from "@/lib/site-links.mjs";
import { isIdentityId, type IdentityId } from "@/ui/home/home-identity-facts";
import { homeIdentityLooksCopy } from "@/ui/home/home-identity-looks-copy";
import { HomeIdentityExampleMist } from "@/ui/home/home-identity-example-mist";
import { HomeIdentityLooksTabs } from "@/ui/home/home-identity-looks-tabs";
import {
  HOME_LOOKS_GRID,
  HOME_METADATA_TEXT_CLASS,
  HOME_PERSUASION_TEXT_CLASS,
} from "@/ui/home/home-rhythm";
import { useLookFade } from "@/ui/home/use-look-fade";
import { useMotionOk } from "@/ui/home/use-motion-ok";

const noop = () => () => {};

/**
 * Compose-UI brief:
 * Métier: zedkit publishes npm packages and a docs site, not a hosted app.
 * Client personas: integrating developers, hurried, on a laptop or a phone; they need to see that a look is one attribute.
 * Customers: the developer's own users — this page does not sell to them.
 * Customer personas: n/a on the docs home (the specimen stands in for their product screen).
 * UI decisions:
 *   one compact Project settings screen for every look, because: a look is type+shape+density+color, not a different product.
 *   specimen | copy from lg, copy+pills first on a phone, because: client is hurried; the look control must stay reachable.
 *   Glass included as a pill, because: the mockup and #208 name four looks and the caption.
 *   no identity form in the band, because: dock (#110) owns customization.
 */

/** One stage, one compact Project settings screen. The look restyles it; the page scrolls normally. */
export function HomeIdentityLooks() {
  const [identity, setIdentity] = useState<IdentityId>("glass");
  const stageRef = useRef<HTMLDivElement>(null);
  const motionOk = useMotionOk();
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const mode = mounted && resolvedTheme === "dark" ? "dark" : "light";
  useLookFade(stageRef, identity, motionOk);

  return (
    <Stack gap="md" className="content-shrink" data-home-identity-looks="" data-scroll-anchor="">
      <Tabs
        value={identity}
        onValueChange={(next: string) => {
          if (isIdentityId(next)) setIdentity(next);
        }}
        className={HOME_LOOKS_GRID}
      >
        <Stack gap="md" className="content-shrink lg:col-start-next">
          <Stack gap="tight">
            <Heading id="identities-heading" level={2} typeRole="title">
              {homeIdentityLooksCopy.title}
            </Heading>
            <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
              {homeIdentityLooksCopy.body}
            </Text>
          </Stack>
          <HomeIdentityLooksTabs />
          <Text
            variant="muted"
            typeRole="caption"
            className={`font-mono ${HOME_METADATA_TEXT_CLASS}`}
            data-identity-caption=""
          >
            {`<html data-identity="${identity}">`}
          </Text>
        </Stack>
        <TabsContent value={identity} className="trim-top content-shrink lg:col-start-first lg:row-start-first">
          <Stack className="content-shrink rounded-xl" data-identity-frame-stage="">
            <ThemeScope
              ref={stageRef}
              identity={identity}
              mode={mode}
              data-home-identity-stage=""
              className="content-shrink rounded-xl bg-primary surface-pad-sm sm:surface-pad-md"
            >
              <HomeIdentityExampleMist />
            </ThemeScope>
          </Stack>
        </TabsContent>
      </Tabs>
      <HomeIdentityLooksLinks />
    </Stack>
  );
}

function HomeIdentityLooksLinks() {
  return (
    <Stack direction="horizontal" gap="sm" className="flex-wrap">
      <Button asChild variant="outline" size="sm" className="w-fit">
        <HomeLink href={`${IDENTITY_EDITOR_HREF}#create`}>{homeIdentityLooksCopy.openEditor}</HomeLink>
      </Button>
      <Button asChild variant="link" size="sm" className="w-fit">
        <HomeLink href="/features/identity-kit-demos">{homeIdentityLooksCopy.seeInComponents}</HomeLink>
      </Button>
      <Button asChild variant="link" size="sm" className="w-fit">
        <HomeLink href="/docs/start-without-writing-code">{homeIdentityLooksCopy.startWithoutCode}</HomeLink>
      </Button>
    </Stack>
  );
}
