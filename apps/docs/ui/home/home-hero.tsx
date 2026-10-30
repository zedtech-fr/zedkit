import dynamic from "next/dynamic";
import { Container, Stack } from "@zedtech/zedkit-ui";
import { featuredRegistryBrick, registryBrickNames } from "@/content/registry-site";
import { docsSite } from "@/lib/site";
import { HomeHeroLead } from "@/ui/home/home-hero-lead";
import { HomeHeroTailWhenIdle } from "@/ui/home/home-hero-tail-when-idle";
import { HOME_HERO_PREVIEW_SHELL_CLASS, HOME_SECTION_CONTENT_GAP } from "@/ui/home/home-rhythm";

const HomeHeroPreview = dynamic(
  () => import("@/ui/home/home-hero-preview").then((mod) => ({ default: mod.HomeHeroPreview })),
  {
    loading: () => (
      <Stack aria-hidden="true" className={HOME_HERO_PREVIEW_SHELL_CLASS} data-home-hero-preview />
    ),
  },
);

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
  { loading: () => <section id="ai-setup" aria-busy="true" className="min-h-128 w-full scroll-mt-24" /> },
);

const HomeInstallOrCopySection = dynamic(
  () => import("@/ui/home/home-install-or-copy-section").then((mod) => ({ default: mod.HomeInstallOrCopySection })),
  {
    loading: () => (
      <section id="install-or-copy" aria-busy="true" className="min-h-128 w-full scroll-mt-24" />
    ),
  },
);

const HomeUiQuickstartSection = dynamic(
  () => import("@/ui/home/home-ui-quickstart-section").then((mod) => ({ default: mod.HomeUiQuickstartSection })),
  { loading: () => <section id="quickstart" aria-busy="true" className="min-h-128 w-full scroll-mt-24" /> },
);

const HomeHeroDashboard = dynamic(
  () => import("@/ui/home/home-hero-dashboard").then((mod) => ({ default: mod.HomeHeroDashboard })),
  { loading: () => <div aria-busy="true" className="min-h-80 w-full" data-home-dashboard-card /> },
);

export function HomeHero({
  featuredPackage,
  version,
  changelogHref,
}: {
  featuredPackage: string;
  version: string;
  changelogHref: string;
}) {
  return (
    <>
      <Container width="wide" className="py-section-lg">
        <Stack
          gap={HOME_SECTION_CONTENT_GAP}
          className="grid w-full min-w-0 items-start gap-8 lg:grid-cols-2 lg:items-center"
        >
          <HomeHeroLead version={version} changelogHref={changelogHref} />
          <HomeHeroTailWhenIdle
            placeholder={<Stack aria-hidden="true" className={HOME_HERO_PREVIEW_SHELL_CLASS} data-home-hero-preview />}
          >
            <HomeHeroPreview />
          </HomeHeroTailWhenIdle>
        </Stack>
      </Container>
      <HomeUseCasesSection />
      <HomeAiSetupSection />
      <HomeInstallOrCopySection npmPackage={featuredPackage} />
      <HomeUiQuickstartSection
        npmPackage={featuredPackage}
        siteUrl={docsSite.url}
        featuredBrick={featuredRegistryBrick}
        registryBricks={registryBrickNames}
      />
      <Container width="wide" className="py-section-lg">
        <HomeHeroDashboard />
      </Container>
    </>
  );
}
