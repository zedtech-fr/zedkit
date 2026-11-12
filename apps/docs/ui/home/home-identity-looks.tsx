"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import {
  Heading,
  Stack,
  Tabs,
  TabsContent,
  Text,
  ThemeScope,
} from "@zedtech/zedkit-ui";
import { isIdentityId, type IdentityId } from "@/ui/home/home-identity-facts";
import { homeIdentityLooksCopy } from "@/ui/home/home-identity-looks-copy";
import { HomeIdentityExampleMist } from "@/ui/home/home-identity-example-mist";
import { HomeIdentityLooksTabs } from "@/ui/home/home-identity-looks-tabs";
import {
  HOME_LOOKS_GRID,
  HOME_METADATA_TEXT_CLASS,
  HOME_PARALLAX_SCROLL_PROPS,
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
 *   no extra links row under the specimen, because: the mockup section ends at the caption; destinations already live (dock, docs, editor, kit-demos URL).
 *   caption colour is --muted-foreground (shell CSS), because: a reader in any dock look or dark mode must still read the attribute at 4.5:1; accent and leftover --zk-subtle-foreground do not.
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
          <Stack className="content-shrink rounded-xl" data-identity-frame-stage="" {...HOME_PARALLAX_SCROLL_PROPS}>
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
    </Stack>
  );
}
