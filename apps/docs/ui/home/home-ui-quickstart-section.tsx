import { readFileSync } from "node:fs";
import { join } from "node:path";

import { Section } from "@zedtech/zedkit-ui";

import { HomeUiQuickstartCopy } from "@/ui/home/home-ui-quickstart-copy";

const SNIPPETS_DIR = join(process.cwd(), "home-quickstart", "snippets");

function loadSnippet(name: string) {
  return readFileSync(join(SNIPPETS_DIR, name), "utf8").trimEnd();
}

export function HomeUiQuickstartSection({
  npmPackage,
  siteUrl,
  featuredBrick,
  registryBricks,
}: {
  npmPackage: string;
  siteUrl: string;
  featuredBrick: string;
  registryBricks: string[];
}) {
  const installCmd = loadSnippet("install.sh");
  const expectedInstall = `pnpm add ${npmPackage}`;
  if (installCmd !== expectedInstall) {
    throw new Error(`home-quickstart install.sh must be exactly: ${expectedInstall}`);
  }
  return (
    <Section id="quickstart" title="UI quickstart (about five minutes)" className="w-full max-w-2xl">
      <HomeUiQuickstartCopy
        globalsCss={loadSnippet("globals.css")}
        pageTsx={loadSnippet("page.tsx")}
        npmPackage={npmPackage}
        siteUrl={siteUrl}
        featuredBrick={featuredBrick}
        registryBricks={registryBricks}
      />
    </Section>
  );
}
