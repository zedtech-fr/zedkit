import dynamic from "next/dynamic";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Container, Stack } from "@zedtech/zedkit-ui";
import { featuredPackage } from "@/content/gallery";
import { HomeHeroLead } from "@/ui/home/home-hero-lead";
import { HOME_HERO_PREVIEW_SHELL_CLASS, HOME_SECTION_CONTENT_GAP } from "@/ui/home/home-rhythm";

const SNIPPETS_DIR = join(process.cwd(), "home-quickstart", "snippets");

function loadPackageInstallCmd() {
  const cmd = readFileSync(join(SNIPPETS_DIR, "install.sh"), "utf8").trim();
  const expected = `pnpm add ${featuredPackage}`;
  if (cmd !== expected) {
    throw new Error(`home-quickstart/snippets/install.sh must be exactly: ${expected}`);
  }
  return cmd;
}

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

/** Hero band only: proposition + working specimen (sections below are code-split). */
export function HomeHero() {
  const packageInstallCmd = loadPackageInstallCmd();
  return (
    <Container width="wide" data-home-hero-band="">
      <Stack
        gap={HOME_SECTION_CONTENT_GAP}
        className="grid w-full min-w-0 items-start gap-8 lg:grid-cols-2 lg:items-start"
      >
        <HomeHeroLead packageInstallCmd={packageInstallCmd} />
        <HomeHeroPreview />
      </Stack>
    </Container>
  );
}
