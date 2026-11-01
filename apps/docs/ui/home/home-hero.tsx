import dynamic from "next/dynamic";
import { Container, Stack } from "@zedtech/zedkit-ui";
import { HomeHeroLead } from "@/ui/home/home-hero-lead";
import { homeCopy } from "@/ui/home/i18n/home-copy";
import { HOME_HERO_PREVIEW_SHELL_CLASS, HOME_SECTION_CONTENT_GAP } from "@/ui/home/home-rhythm";

const HomeHeroPreview = dynamic(
  () => import("@/ui/home/home-hero-preview").then((mod) => ({ default: mod.HomeHeroPreview })),
  {
    loading: () => (
      <Stack
        aria-hidden="true"
        className={`${HOME_HERO_PREVIEW_SHELL_CLASS} rounded-xl border border-border bg-card`}
        data-home-hero-preview
      >
        <Stack className="min-h-32 border-b border-border" />
        <Stack className="min-h-40" />
      </Stack>
    ),
  },
);

/** Hero band: proposition + pinned examples that crossfade as the page scrolls. */
export function HomeHero() {
  return (
    <Container width="wide" data-home-hero-band="">
      <div data-scroll-scenes="" data-scene-count="3" data-home-hero-scenes="">
        <Stack data-scroll-scenes-stage="" className="min-w-0" gap={HOME_SECTION_CONTENT_GAP}>
          <HomeHeroLead className="min-w-0" />
          <HomeHeroPreview />
          <ol data-scroll-scenes-progress="" aria-hidden="true">
            {homeCopy.heroSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </Stack>
      </div>
    </Container>
  );
}
