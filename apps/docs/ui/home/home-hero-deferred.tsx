import dynamic from "next/dynamic";
import { Stack } from "@zedtech/zedkit-ui";
import { featuredRegistryBrick, registryBrickNames } from "@/content/registry-site";
import { docsSite } from "@/lib/site";
import { HOME_SECTION_CONTENT_GAP } from "@/ui/home/home-rhythm";

const HomeUseCasesSection = dynamic(
  () => import("@/ui/home/home-use-cases-section").then((mod) => ({ default: mod.HomeUseCasesSection })),
  {
    loading: () => (
      <section id="use-cases" aria-busy="true" className="min-h-[140vh] w-full max-w-none scroll-mt-24" />
    ),
  },
);

const HomeAiSetupSection = dynamic(
  () => import("@/ui/home/home-ai-setup-section").then((mod) => ({ default: mod.HomeAiSetupSection })),
  { loading: () => <section id="ai-setup" aria-busy="true" className="min-h-64 w-full scroll-mt-24" /> },
);

const HomeInstallOrCopySection = dynamic(
  () => import("@/ui/home/home-install-or-copy-section").then((mod) => ({ default: mod.HomeInstallOrCopySection })),
  {
    loading: () => (
      <section id="install-or-copy" aria-busy="true" className="min-h-64 w-full scroll-mt-24" />
    ),
  },
);

const HomeUiQuickstartSection = dynamic(
  () => import("@/ui/home/home-ui-quickstart-section").then((mod) => ({ default: mod.HomeUiQuickstartSection })),
  { loading: () => <section id="quickstart" aria-busy="true" className="min-h-64 w-full scroll-mt-24" /> },
);

const HomeHeroDashboard = dynamic(
  () => import("@/ui/home/home-hero-dashboard").then((mod) => ({ default: mod.HomeHeroDashboard })),
  { loading: () => <div aria-busy="true" className="min-h-80 w-full" data-home-dashboard-card /> },
);

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
