import { readFileSync } from "node:fs";
import { join } from "node:path";

import { Section } from "@zedtech/zedkit-ui";

import { featuredRegistryBrick, registryBrickNames } from "@/content/registry-site";
import { PUBLIC_SITE_URL } from "@/lib/site";
import { registryShadcnAddCommand } from "@/lib/registry-shadcn-command";
import { HomeInstallOrCopyCopy } from "@/ui/home/home-install-or-copy-copy";
import { HOME_SECTION_REVEAL_CLASS } from "@/ui/home/home-rhythm";

const SNIPPETS_DIR = join(process.cwd(), "home-quickstart", "snippets");

function loadSnippet(name: string) {
  return readFileSync(join(SNIPPETS_DIR, name), "utf8").trim();
}

export function HomeInstallOrCopySection({ npmPackage }: { npmPackage: string }) {
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
  return (
    <Section
      bleed
      spacing="lg"
      containerWidth="reading"
      id="install-or-copy"
      title="Install it or copy it"
      className={HOME_SECTION_REVEAL_CLASS}
    >
      <HomeInstallOrCopyCopy
        packageInstallCmd={packageInstallCmd}
        registryAddCmd={registryAddCmd}
        registryBricks={registryBrickNames}
      />
    </Section>
  );
}
