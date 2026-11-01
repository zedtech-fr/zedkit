import { readFileSync } from "node:fs";
import { join } from "node:path";

import { Section } from "@zedtech/zedkit-ui";

import { featuredRegistryBrick } from "@/content/registry-site";
import { PUBLIC_SITE_URL } from "@/lib/site";
import { registryShadcnAddCommand } from "@/lib/registry-shadcn-command";
import { registryShadcnGithubCommand } from "@/lib/registry-shadcn-github-command";
import { HomeGetStartedCopy } from "@/ui/home/home-get-started-copy";
import { HOME_MARKETING_ROOT_PROPS, HOME_SECTION_REVEAL_CLASS } from "@/ui/home/home-rhythm";

const SNIPPETS_DIR = join(process.cwd(), "home-quickstart", "snippets");

export function loadHomeInitCommand() {
  const initCommand = readFileSync(join(SNIPPETS_DIR, "ai-init.sh"), "utf8").trim();
  if (initCommand !== "npx @zedtech/zedkit-ai init") {
    throw new Error("home-quickstart/snippets/ai-init.sh must be exactly: npx @zedtech/zedkit-ai init");
  }
  return initCommand;
}

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
  const registryThemeAddCmd = loadSnippet("registry-theme-add.sh");
  const expectedTheme = registryShadcnAddCommand(PUBLIC_SITE_URL, "theme");
  if (registryThemeAddCmd !== expectedTheme) {
    throw new Error(
      `home-quickstart/snippets/registry-theme-add.sh must be exactly: ${expectedTheme}`,
    );
  }

  return (
    <Section
      bleed
      spacing="md"
      containerWidth="wide"
      id="get-started"
      title="Get started"
      description="Install from npm, import a component, and render it in your app."
      className={HOME_SECTION_REVEAL_CLASS}
      {...HOME_MARKETING_ROOT_PROPS}
    >
      <HomeGetStartedCopy
        packageInstallCmd={packageInstallCmd}
        registryInstallCmd={registryShadcnGithubCommand(featuredRegistryBrick)}
      />
    </Section>
  );
}
