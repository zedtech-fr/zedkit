import { Heading, SecretField, Stack, Text } from "@zedtech/zedkit-ui";
import { MAP_SETUP_MINI_PROMPT } from "@/lib/ai-setup-onboarding.generated";
import { publicIssueHref } from "@/features/reviews/compose";
import { HOME_CARD_CONTENT_GAP, HOME_METADATA_TEXT_CLASS } from "@/ui/home/home-rhythm";
import { homeCopy } from "@/ui/home/i18n/home-copy";
import { HomeHeroLeadActions } from "@/ui/home/home-hero-lead-actions";

export async function HomeHeroLead({ className }: { className?: string }) {
  const issuesHref = await publicIssueHref();
  return (
    <Stack gap="blocks" className={`content-shrink items-start ${className ?? ""}`} data-home-hero-lead="">
      <Stack gap="sm" className="content-shrink items-start">
        <Text typeRole="label" className={`text-muted-foreground ${HOME_METADATA_TEXT_CLASS}`} data-home-hero-category="">
          {homeCopy.hero.titleCategory}
        </Text>
        <Heading level={1} typeRole="display" className="text-balance">
          {homeCopy.hero.title}
        </Heading>
      </Stack>
      <Text variant="muted" typeRole="lead" data-home-hero-sub="">
        {homeCopy.hero.sub}
      </Text>
      <Stack gap={HOME_CARD_CONTENT_GAP} className="items-start">
        <Stack gap="sm" className="w-full items-start" data-home-hero-prompt="">
          <SecretField
            multiline
            value={MAP_SETUP_MINI_PROMPT}
            aria-label={homeCopy.hero.promptAriaLabel}
            copyLabel={homeCopy.hero.promptCopyLabel}
          />
          <Text variant="muted" typeRole="caption" className={HOME_METADATA_TEXT_CLASS}>
            {homeCopy.hero.promptCaption}
          </Text>
        </Stack>
        <HomeHeroLeadActions issuesHref={issuesHref} />
        <Text variant="muted" typeRole="caption" className={HOME_METADATA_TEXT_CLASS}>
          {homeCopy.hero.facts}
        </Text>
      </Stack>
    </Stack>
  );
}
