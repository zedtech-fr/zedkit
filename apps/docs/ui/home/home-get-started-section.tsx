import { readFileSync } from "node:fs";
import { join } from "node:path";

import { Section } from "@zedtech/zedkit-ui";

import { featuredRegistryBrick, registryBrickNames } from "@/content/registry-site";
import { PUBLIC_SITE_URL } from "@/lib/site";
import { registryShadcnAddCommand } from "@/lib/registry-shadcn-command";
import { registryShadcnGithubCommand } from "@/lib/registry-shadcn-github-command";
import { HomeGetStartedCopy } from "@/ui/home/home-get-started-copy";
import { HOME_MARKETING_ROOT_PROPS, HOME_SECTION_REVEAL_CLASS } from "@/ui/home/home-rhythm";

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
  const registryThemeAddCmd = loadSnippet("registry-theme-add.sh");
  const expectedTheme = registryShadcnAddCommand(PUBLIC_SITE_URL, "theme");
  if (registryThemeAddCmd !== expectedTheme) {
    throw new Error(
      `home-quickstart/snippets/registry-theme-add.sh must be exactly: ${expectedTheme}`,
    );
  }
  const initCommand = loadSnippet("ai-init.sh");
  if (initCommand !== "npx @zedtech/zedkit-ai init") {
    throw new Error("home-quickstart/snippets/ai-init.sh must be exactly: npx @zedtech/zedkit-ai init");
  }
  const npmGlobalsCss = loadSnippet("npm-globals.css");
  const npmPageTsx = loadSnippet("npm-page.tsx");
  const registryPageTsx = loadSnippet("registry-page.tsx");

  return (
    <Section
      bleed
      spacing="lg"
      containerWidth="wide"
      id="get-started"
      title="Start building"
      description="Install the package or copy a brick, then a short UI path. Agent setup is optional."
      className={HOME_SECTION_REVEAL_CLASS}
      {...HOME_MARKETING_ROOT_PROPS}
    >
      <HomeGetStartedCopy
        initCommand={initCommand}
        packageInstallCmd={packageInstallCmd}
        registryInstallCmd={registryShadcnGithubCommand(featuredRegistryBrick)}
        registryComponentCount={registryBrickNames.filter((name) => name !== "theme").length}
        registryAddCmd={registryAddCmd}
        npmInstallCmd={packageInstallCmd}
        npmGlobalsCss={npmGlobalsCss}
        npmPageTsx={npmPageTsx}
        registryThemeAddCmd={registryThemeAddCmd}
        registryPageTsx={registryPageTsx}
      />
    </Section>
  );
}
