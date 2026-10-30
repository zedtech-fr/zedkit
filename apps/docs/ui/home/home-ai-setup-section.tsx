import { readFileSync } from "node:fs";
import { join } from "node:path";

import { Section } from "@zedtech/zedkit-ui";

import { HomeAiSetupCopy } from "@/ui/home/home-ai-setup-copy";
import { HOME_SECTION_REVEAL_CLASS } from "@/ui/home/home-rhythm";

const SNIPPET_PATH = join(process.cwd(), "home-quickstart", "snippets", "ai-init.sh");
const EXPECTED_INIT = "npx @zedtech/zedkit-ai init";

function loadInitCommand() {
  const command = readFileSync(SNIPPET_PATH, "utf8").trim();
  if (command !== EXPECTED_INIT) {
    throw new Error(`home-quickstart/snippets/ai-init.sh must be exactly: ${EXPECTED_INIT}`);
  }
  return command;
}

export function HomeAiSetupSection() {
  const initCommand = loadInitCommand();
  return (
    <Section
      bleed
      tone="muted"
      spacing="lg"
      containerWidth="reading"
      id="ai-setup"
      title="Set up your coding agent"
      className={HOME_SECTION_REVEAL_CLASS}
    >
      <HomeAiSetupCopy initCommand={initCommand} />
    </Section>
  );
}
