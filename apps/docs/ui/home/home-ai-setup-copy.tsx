"use client";

import Link from "next/link";
import { Button, Heading, SecretField, Stack, Text } from "@zedtech/zedkit-ui";
import { DocsActionLabel } from "@/components/docs-action-label";
import { HOME_CARD_CONTENT_GAP, HOME_SECTION_CONTENT_GAP } from "@/ui/home/home-rhythm";

export function HomeAiSetupCopy({ initCommand }: { initCommand: string }) {
  const setupAiSlash = "/setup-ai";
  return (
    <Stack gap={HOME_SECTION_CONTENT_GAP} className="w-full min-w-0">
      <Text>
        zedkit configures Cursor, Claude Code, Codex and other agents for your repo: instructions
        (AGENTS.md), skills, subagents and commands.
      </Text>
      <Stack gap={HOME_CARD_CONTENT_GAP}>
        <Heading level={3}>1. In your project folder, run</Heading>
        <SecretField value={initCommand} aria-label="AI init command" copyLabel="Copy init command" />
      </Stack>
      <Stack gap={HOME_CARD_CONTENT_GAP}>
        <Heading level={3}>2. Open the project in Cursor or Claude Code and run</Heading>
        <SecretField value={setupAiSlash} aria-label="setup-ai slash command" copyLabel="Copy setup-ai command" />
        <Text variant="muted">
          The agent reads your repo, runs the commands it finds and fills AGENTS.md with what it
          verified. If you already have a setup, it audits it first and improves it in place.
        </Text>
        <Text variant="muted">Other tools: run the setup-ai skill from your agent chat.</Text>
      </Stack>
      <Stack gap={HOME_CARD_CONTENT_GAP}>
        <Text variant="muted">
          Init copies files into your repo (about 100 files, listed in the output) and never
          overwrites an existing file.
        </Text>
        <Text variant="muted">The installer has no account and sends nothing.</Text>
        <Text variant="muted">
          Undo: commit first, then delete .agents, .cursor, .claude, CLAUDE.md (and AGENTS.md if it
          is new).
        </Text>
        <Text variant="muted">Needs Node.js 22 or newer.</Text>
      </Stack>
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
