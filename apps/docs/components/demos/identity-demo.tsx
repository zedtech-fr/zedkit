"use client";

import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Heading,
  IDENTITY_CHANGE_EVENT,
  IdentityPicker,
  IdentitySwitcher,
  Stack,
  Text,
  identities,
  useIdentity,
} from "@zedtech/zedkit-ui";
import { identityCopy } from "@/components/demos/i18n/identity-copy";

/** A demo-only storage key keeps the visitor's own docs choice untouched. */
const DEMO_STORAGE_KEY = "harbor-demo-identity";

/**
 * The switcher re-skins the whole page, as it does in an app. Restore the
 * look the page had when the demo mounted, so leaving the page leaves no trace.
 */
function useRestoreIdentityOnUnmount() {
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.getAttribute("data-identity");
    return () => {
      if (previous === null) root.removeAttribute("data-identity");
      else root.setAttribute("data-identity", previous);
      window.dispatchEvent(new Event(IDENTITY_CHANGE_EVENT));
    };
  }, []);
}

function CurrentLook() {
  const current = useIdentity("mist");
  const label = identities.find((item) => item.id === current)?.label ?? current;
  return (
    <Text variant="muted" role="status" data-demo-current-look className="trim-margin!">
      {identityCopy.switcher.currentLook}<Text as="span" className="font-medium text-foreground">{label}</Text>
    </Text>
  );
}

/** Live switcher in a site header: the whole page follows the choice. */
export function IdentitySwitcherDemo() {
  useRestoreIdentityOnUnmount();
  return (
    <Stack gap="lg" className="content-shrink">
      <Stack
        direction="horizontal"
        gap="md"
        className="content-shrink flex-wrap items-center justify-between rounded-lg border border-border bg-background surface-pad-inline surface-pad-block"
      >
        <Text as="span" className="font-semibold">
          {identityCopy.studio}
        </Text>
        <IdentitySwitcher storageKey={DEMO_STORAGE_KEY} showLabel label={identityCopy.look} />
      </Stack>
      <CurrentLook />
      <Text variant="muted" className="trim-margin! text-caption">
        {identityCopy.switcher.note}
      </Text>
    </Stack>
  );
}

const SCOPED_LOOKS = identities;

/** One scoped card: Save and Cancel really change its state. */
function ScopedCard({ look }: { look: (typeof identities)[number] }) {
  const [saved, setSaved] = useState(false);
  return (
    <Stack
      gap="md"
      data-demo-specimen=""
      data-identity-scope=""
      data-identity={look.id}
      data-demo-scope={look.id}
      className="content-shrink rounded-xl border border-border bg-background surface-pad-md font-sans text-foreground"
    >
      <Stack direction="horizontal" gap="sm" className="items-center justify-between">
        <Heading level={2} className="text-compact-heading trim-margin!">
          {look.label}
        </Heading>
        <Badge variant="secondary" className="w-fit" role="status">
          {saved ? identityCopy.scope.savedBadge : identityCopy.scope.badge}
        </Badge>
      </Stack>
      <Text variant="muted" className="trim-margin!">
        {look.description}
      </Text>
      <Stack direction="horizontal" gap="sm">
        <Button size="sm" disabled={saved} onClick={() => setSaved(true)}>
          {identityCopy.scope.save}
        </Button>
        <Button size="sm" variant="outline" disabled={!saved} onClick={() => setSaved(false)}>
          {identityCopy.scope.cancel}
        </Button>
      </Stack>
    </Stack>
  );
}

/** The same card under each identity, side by side, without touching the page. */
export function IdentityScopeDemo() {
  return (
    <Stack gap="sm" className="content-shrink">
      <Text variant="muted" className="text-caption">
        {identityCopy.scope.note}
      </Text>
      <Stack className="content-shrink gap-stack-md sm:grid sm:grid-pair xl:grid-trio">
        {SCOPED_LOOKS.map((look) => (
          <ScopedCard key={look.id} look={look} />
        ))}
      </Stack>
    </Stack>
  );
}

/** Touch picker: a 44px trigger and a sheet, with a custom short list. */
export function IdentityPickerDemo() {
  useRestoreIdentityOnUnmount();
  const [last, setLast] = useState<string | null>(null);
  return (
    <Stack gap="md" className="content-shrink">
      <Stack
        direction="horizontal"
        gap="md"
        className="content-shrink items-center justify-between rounded-lg border border-border bg-background surface-pad-inline surface-pad-block"
      >
        <Text as="span" className="font-semibold">
          {identityCopy.studio}
        </Text>
        <IdentityPicker
          storageKey={DEMO_STORAGE_KEY}
          label={identityCopy.look}
          description={identityCopy.picker.description}
          identities={identities.filter((item) => ["mist", "press", "tide"].includes(item.id))}
          onIdentityChange={setLast}
        />
      </Stack>
      <Text variant="muted" role="status" className="trim-margin!">
        {last ? identityCopy.picker.chosen(last) : identityCopy.picker.nothing}
      </Text>
    </Stack>
  );
}
