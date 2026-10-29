import { Stack } from "@zedtech/zedkit-ui";
import { featuredRegistryBrick, registryBrickNames } from "@/content/registry-site";
import { docsSite } from "@/lib/site";
import { HomeAiSetupSection } from "@/ui/home/home-ai-setup-section";
import { HomeHeroDashboard } from "@/ui/home/home-hero-dashboard";
import { HomeInstallOrCopySection } from "@/ui/home/home-install-or-copy-section";
import { HomeUiQuickstartSection } from "@/ui/home/home-ui-quickstart-section";
import { HomeUseCasesSection } from "@/ui/home/home-use-cases-section";
import { HOME_SECTION_CONTENT_GAP } from "@/ui/home/home-rhythm";

/** Below-the-fold hero sections — already code-split via `dynamic()` in home-view. */
export function HomeHeroDeferred({ featuredPackage }: { featuredPackage: string }) {
  return (
    <Stack gap={HOME_SECTION_CONTENT_GAP} className="min-w-0 items-start">
      <HomeUseCasesSection />
      <HomeAiSetupSection />
      <HomeInstallOrCopySection npmPackage={featuredPackage} />
      <HomeUiQuickstartSection
        npmPackage={featuredPackage}
        siteUrl={docsSite.url}
        featuredBrick={featuredRegistryBrick}
        registryBricks={registryBrickNames}
      />
      <HomeHeroDashboard />
    </Stack>
  );
}
