import dynamic from "next/dynamic";
import Link from "next/link";
import { Button, Container, Stack } from "@zedtech/zedkit-ui";
import { DocsActionLabel } from "@/components/docs-action-label";
import { HomeHeroLead } from "@/ui/home/home-hero-lead";
import { HOME_HERO_PREVIEW_SHELL_CLASS, HOME_SECTION_CONTENT_GAP } from "@/ui/home/home-rhythm";

const HomeHeroPreview = dynamic(
  () => import("@/ui/home/home-hero-preview").then((mod) => ({ default: mod.HomeHeroPreview })),
  {
    // Reserve the controls row and code line too, so the interactive
    // preview lands without shifting the hero grid.
    loading: () => (
      <Stack gap={3} aria-hidden="true">
        <Stack className="h-7" />
        <Stack className={HOME_HERO_PREVIEW_SHELL_CLASS} data-home-hero-preview />
        <Stack className="h-3" />
      </Stack>
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

const HomeGetStartedSection = dynamic(
  () => import("@/ui/home/home-get-started-section").then((mod) => ({ default: mod.HomeGetStartedSection })),
  {
    loading: () => (
      <section id="get-started" aria-busy="true" className="min-h-96 w-full scroll-mt-24">
        <section id="ai-setup" className="sr-only" />
        <section id="install-or-copy" className="sr-only" />
        <section id="quickstart" className="sr-only" />
      </section>
    ),
  },
);

const HomeHeroDashboard = dynamic(
  () => import("@/ui/home/home-hero-dashboard").then((mod) => ({ default: mod.HomeHeroDashboard })),
  { loading: () => <div aria-busy="true" className="min-h-80 w-full" data-home-dashboard-card /> },
);

export function HomeHero({
  featuredPackage,
  version,
  releasesHref,
  latestChange,
}: {
  featuredPackage: string;
  version: string;
  releasesHref: string;
  /** Still passed by the page; the short hero proof no longer prints the counts. */
  stats: { packages: number; needs: number };
  uiStats: { components: number; livePreviews: number };
  latestChange: string;
}) {
  return (
    <>
      <Container width="wide" className="py-section-lg">
        <Stack gap={HOME_SECTION_CONTENT_GAP} className="w-full min-w-0">
          <Stack
            gap={HOME_SECTION_CONTENT_GAP}
            className="grid w-full min-w-0 items-start gap-8 lg:grid-cols-2 lg:items-center"
          >
            <HomeHeroLead
              version={version}
              releasesHref={releasesHref}
              latestChange={latestChange}
            />
            <HomeHeroPreview />
          </Stack>
          <Stack direction="horizontal" gap={2} className="flex-wrap items-center" data-home-secondary-actions>
            <Button asChild variant="ghost" size="sm" className="w-fit">
              <Link href="#ai-setup">Set up your coding agent</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="w-fit">
              <Link href="/docs"><DocsActionLabel>Open documentation</DocsActionLabel></Link>
            </Button>
          </Stack>
        </Stack>
      </Container>
      <Container id="demo" width="wide" className="scroll-mt-24 py-section-lg">
        <HomeHeroDashboard />
      </Container>
      <HomeUseCasesSection />
      <HomeGetStartedSection npmPackage={featuredPackage} />
    </>
  );
}
