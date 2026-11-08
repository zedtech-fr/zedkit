"use client";

import { Button, Field, FieldLabel, Heading, Stack, Text, Textarea } from "@zedtech/zedkit-ui";

import { identityBriefCopy } from "@/components/i18n/identity-brief-copy";
import { DetectedLinks } from "@/components/identity-detected-links";
import { LIMITS } from "@/lib/identity-assistant-limits";
import { useIdentityAssistantStore } from "@/lib/identity-assistant-store";
import { HOME_PERSUASION_TEXT_CLASS, HOME_SMALL_TEXT_CLASS } from "@/ui/home/home-rhythm";
import { homeYoursCopy as copy } from "@/ui/home/i18n/home-yours-copy";

/**
 * The end of the identity examples: an invitation, an example brief, optional reference links, one action.
 * The action opens the assistant widget in place, with the brief carried in. Nothing is sent to the assistant
 * from here, and the page stays where it is.
 */
export function HomeYoursScene() {
  const { brief, setBrief, setExpanded } = useIdentityAssistantStore();

  function start() {
    setExpanded(true);
  }

  return (
    <Stack gap="lg" id="your-identity" className="max-w-reading content-shrink border-t border-border pt-section-sm" data-home-yours="" data-scroll-anchor="">
      <Stack gap="sm">
        <Heading level={3} as="h3" className="text-scene-title">
          {copy.title}
        </Heading>
        <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
          {copy.body}
        </Text>
      </Stack>
      <Stack gap="lg" className="max-w-reading content-shrink">
        <Field>
          <FieldLabel htmlFor="home-yours-brief">{copy.briefLabel}</FieldLabel>
          <Textarea id="home-yours-brief" rows={4} maxLength={LIMITS.prompt} placeholder={identityBriefCopy.placeholder} value={brief} onChange={(event) => setBrief(event.target.value)} aria-describedby="home-yours-hint" />
        </Field>
        <Text variant="muted" id="home-yours-hint" className={HOME_SMALL_TEXT_CLASS}>
          {copy.briefHint}
        </Text>
        <DetectedLinks text={brief} onText={setBrief} fieldId="home-yours-brief" />
        <Stack gap="sm">
          <Button type="button" className="w-fit" onClick={start}>
            {copy.start}
          </Button>
          <Text variant="muted" className={HOME_SMALL_TEXT_CLASS}>
            {copy.startHint}
          </Text>
        </Stack>
      </Stack>
    </Stack>
  );
}
