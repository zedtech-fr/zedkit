/** English copy for the home page. Keys only; no markup. */
import { homeComponentFamiliesCopy } from "@/ui/home/i18n/home-component-families-copy";
import { homeGetStartedCopy } from "@/ui/home/i18n/home-get-started-copy";
import { homeAdminSceneCopy, homeGalleryPreviewCopy } from "@/ui/home/i18n/home-gallery-copy";
import { homeHeroCopy } from "@/ui/home/i18n/home-hero-copy";
import {
  homeEntryPointsCopy,
  homeProofsCopy,
  homeScenariosCopy,
  homeSecondaryCopy,
} from "@/ui/home/i18n/home-marketing-sections-copy";
import { homeUseCasesCopy } from "@/ui/home/i18n/home-use-cases-copy";

export const homeCopy = {
  ...homeHeroCopy,
  getStarted: homeGetStartedCopy,
  componentFamilies: homeComponentFamiliesCopy,
  secondary: homeSecondaryCopy,
  entryPoints: homeEntryPointsCopy,
  scenarios: homeScenariosCopy,
  proofs: homeProofsCopy,
  galleryPreview: homeGalleryPreviewCopy,
  adminScene: homeAdminSceneCopy,
  useCases: homeUseCasesCopy,
} as const;

export type HomeCopy = typeof homeCopy;
