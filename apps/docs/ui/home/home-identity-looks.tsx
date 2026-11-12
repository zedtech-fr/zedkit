"use client";

import { HomeLink } from "@/ui/home/home-link";
import { useState, useSyncExternalStore, type ComponentType } from "react";
import { useTheme } from "next-themes";
import {
  Button,
  Heading,
  Stack,
  Tabs,
  TabsContent,
  Text,
  ThemeScope,
  signatureMotionClass,
} from "@zedtech/zedkit-ui";
import { IDENTITY_EDITOR_HREF } from "@/lib/site-links.mjs";
import { HOME_IDENTITY_FACTS, isIdentityId, type IdentityId } from "@/ui/home/home-identity-facts";
import { homeIdentityLooksCopy } from "@/ui/home/home-identity-looks-copy";
import { HomeIdentityExampleMaison } from "@/ui/home/home-identity-example-maison";
import { HomeIdentityExampleMist } from "@/ui/home/home-identity-example-mist";
import { HomeIdentityExamplePress } from "@/ui/home/home-identity-example-press";
import { HomeIdentityLooksTabs } from "@/ui/home/home-identity-looks-tabs";
import {
  HOME_LOOKS_GRID,
  HOME_METADATA_TEXT_CLASS,
  HOME_PERSUASION_TEXT_CLASS,
} from "@/ui/home/home-rhythm";

const noop = () => () => {};

/** One product screen per look: each is shown doing the job it suits, not the same page restyled. */
const EXAMPLES: Record<IdentityId, ComponentType> = {
  mist: HomeIdentityExampleMist,
  press: HomeIdentityExamplePress,
  maison: HomeIdentityExampleMaison,
};

/** One stage, one example at a time. The page scrolls normally: nothing is pinned or clipped. */
export function HomeIdentityLooks() {
  const [identity, setIdentity] = useState<IdentityId>("mist");
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const mode = mounted && resolvedTheme === "dark" ? "dark" : "light";
  const facts = HOME_IDENTITY_FACTS[identity];
  const Example = EXAMPLES[identity];

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
          <Stack gap="tight">
            <Text
              variant="muted"
              typeRole="caption"
              className={`font-mono ${HOME_METADATA_TEXT_CLASS}`}
              data-identity-caption=""
            >
              {`<html data-identity="${identity}">`}
            </Text>
            <Text variant="muted" typeRole="caption" className={HOME_METADATA_TEXT_CLASS}>
              {`${facts.label}: ${facts.type}; ${facts.shape}.`}
            </Text>
          </Stack>
        </Stack>
        <TabsContent value={identity} className="trim-top content-shrink lg:col-start-first lg:row-start-first">
          <Stack className="content-shrink rounded-xl border border-border" data-identity-frame-stage="">
            <ThemeScope
              identity={identity}
              mode={mode}
              data-home-identity-stage=""
              className="content-shrink rounded-xl bg-background surface-pad-sm sm:surface-pad-md"
            >
              <Stack data-identity-example="" key={identity} className={signatureMotionClass.settle}>
                <Example />
              </Stack>
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
