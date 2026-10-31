"use client";

import Link from "next/link";
import { Button, SecretField, Stack, Text } from "@zedtech/zedkit-ui";
import { DocsActionLabel } from "@/components/docs-action-label";
import { HOME_CARD_CONTENT_GAP } from "@/ui/home/home-rhythm";

export function HomeGetStartedAiBlock({ initCommand }: { initCommand: string }) {
  const setupAiSlash = "/setup-ai";
  return (
    <Stack gap={HOME_CARD_CONTENT_GAP} id="ai-setup" className="scroll-mt-24">
      <Text variant="muted">
        Run init in your repo, then <Text as="span" className="font-mono text-sm">/setup-ai</Text> in the agent.
        Full walkthrough in the docs.
      </Text>
      <SecretField multiline value={initCommand} aria-label="AI init command" copyLabel="Copy init command" />
      <SecretField
        multiline
        value={setupAiSlash}
        aria-label="setup-ai slash command"
        copyLabel="Copy setup-ai command"
      />
      <Stack direction="horizontal" gap={2} className="flex-wrap" data-docs-ctas="">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/docs/set-up-your-coding-agents#what-gets-installed">
            <DocsActionLabel>What gets installed</DocsActionLabel>
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/docs/ai/set-up-ai-agent-instructions-skills-subagents-and-commands-in-a-repo">
            <DocsActionLabel>AI setup docs</DocsActionLabel>
          </Link>
        </Button>
      </Stack>
    </Stack>
  );
}
