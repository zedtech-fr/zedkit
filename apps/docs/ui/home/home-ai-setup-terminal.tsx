import { Stack, Surface, Text } from "@zedtech/zedkit-ui";
import { AI_SETUP_KIT } from "@/lib/ai-setup-onboarding.generated";
import { homeAiSetupCopy } from "@/ui/home/i18n/home-ai-setup-copy";

const { terminal } = homeAiSetupCopy;

function Prompt({ children }: { children: string }) {
  return (
    <>
      <span aria-hidden="true" className="text-muted-foreground select-none">
        ${" "}
      </span>
      {children}
    </>
  );
}

/** Manifest counters: skills / agents / files, still manifest-derived so a rename fails the build. */
function ManifestCounters() {
  const skills = AI_SETUP_KIT.skills.length;
  const agents = AI_SETUP_KIT.agents.length;
  const files = AI_SETUP_KIT.installed.length + AI_SETUP_KIT.written.length;
  return (
    <Stack direction="horizontal" gap="md" className="flex-wrap" data-home-ai-counters="">
      <Stack gap="tight">
        <Text typeRole="lead" as="span" className="text-foreground">{skills}</Text>
        <Text variant="muted" typeRole="label">skills</Text>
      </Stack>
      <Stack gap="tight">
        <Text typeRole="lead" as="span" className="text-foreground">{agents}</Text>
        <Text variant="muted" typeRole="label">agents</Text>
      </Stack>
      <Stack gap="tight">
        <Text typeRole="lead" as="span" className="text-foreground">{files}</Text>
        <Text variant="muted" typeRole="label">files</Text>
      </Stack>
    </Stack>
  );
}

/** The files `zedkit-ai setup` copies and `/setup-ai` adds, as counters. Rows come from the kit manifest. */
export function HomeAiSetupTerminal({ className }: { className?: string | undefined }) {
  return (
    <Surface
      variant="solid"
      elevation={1}
      radius="xl"
      className={`content-shrink overflow-hidden ${className ?? ""}`}
      data-home-ai-terminal=""
    >
      <Stack direction="horizontal" gap="sm" className="items-center border-b border-border surface-pad-inline surface-pad-block-sm">
        <Text as="span" typeRole="label" className="text-muted-foreground">
          {terminal.title}
        </Text>
      </Stack>
      <Stack gap="md" className="surface-pad-md">
        <pre
          role="region"
          aria-label={terminal.regionLabel}
          className="trim-margin font-mono text-zk-type-small whitespace-pre"
        >
          <code>
            <Prompt>{terminal.installCommand}</Prompt>
            {"\n"}
            <Prompt>{terminal.validateCommand}</Prompt>
            {"\n"}
            <span className="text-muted-foreground">{terminal.validateResult}</span>
          </code>
        </pre>
        <ManifestCounters />
        <Text variant="muted" typeRole="caption" className="text-muted-foreground">
          # {terminal.writtenComment}: {AI_SETUP_KIT.written.map((f) => f.path).join(", ")}
        </Text>
      </Stack>
    </Surface>
  );
}
