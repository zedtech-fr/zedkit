import { readFileSync } from "node:fs";
import { join } from "node:path";

import { Section } from "@zedtech/zedkit-ui";

import { featuredRegistryBrick, registryBrickNames } from "@/content/registry-site";
import { PUBLIC_SITE_URL } from "@/lib/site";
import { registryShadcnAddCommand } from "@/lib/registry-shadcn-command";
import { HomeGetStartedCopy } from "@/ui/home/home-get-started-copy";
import { HOME_SECTION_REVEAL_CLASS } from "@/ui/home/home-rhythm";

const SNIPPETS_DIR = join(process.cwd(), "home-quickstart", "snippets");

function loadSnippet(name: string) {
  return readFileSync(join(SNIPPETS_DIR, name), "utf8").trim();
}

export function HomeGetStartedSection({ npmPackage }: { npmPackage: string }) {
  const packageInstallCmd = loadSnippet("install.sh");
  const expectedInstall = `pnpm add ${npmPackage}`;
  if (packageInstallCmd !== expectedInstall) {
    throw new Error(`home-quickstart/snippets/install.sh must be exactly: ${expectedInstall}`);
  }
  const registryAddCmd = loadSnippet("registry-add.sh");
  const expectedRegistry = registryShadcnAddCommand(PUBLIC_SITE_URL, featuredRegistryBrick);
  if (registryAddCmd !== expectedRegistry) {
    throw new Error(
      `home-quickstart/snippets/registry-add.sh must be exactly: ${expectedRegistry}`,
    );
  }
  const initCommand = loadSnippet("ai-init.sh");
  if (initCommand !== "npx @zedtech/zedkit-ai init") {
    throw new Error("home-quickstart/snippets/ai-init.sh must be exactly: npx @zedtech/zedkit-ai init");
  }

  return (
    <Section
      bleed
      spacing="md"
      containerWidth="reading"
      id="get-started"
      title="Start building"
      description="Agent setup, npm or registry install, then the UI quickstart — step-by-step detail stays in the docs."
      className={HOME_SECTION_REVEAL_CLASS}
    >
      <HomeGetStartedCopy
        initCommand={initCommand}
        packageInstallCmd={packageInstallCmd}
        registryAddCmd={registryAddCmd}
        registryBricks={registryBrickNames}
      />
    </Section>
  );
}
