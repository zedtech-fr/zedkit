/** English copy for the home page. Keys only; no markup. */
import { homeComponentFamiliesCopy } from "@/ui/home/i18n/home-component-families-copy";
import { homeGalleryPreviewCopy } from "@/ui/home/i18n/home-gallery-copy";
import { homeHeroCopy } from "@/ui/home/i18n/home-hero-copy";
import { homeSecondaryCopy } from "@/ui/home/i18n/home-marketing-sections-copy";
import { homePasteCopy } from "@/ui/home/i18n/home-paste-copy";

export const homeCopy = {
  ...homeHeroCopy,
  /** Leftover key for existing header-controls e2e; the paste band owns the strings. */
  getStarted: {
    quickStart: {
      fullSteps: homePasteCopy.fullSteps,
      fullStepsHref: homePasteCopy.fullStepsHref,
    },
  },
  componentFamilies: homeComponentFamiliesCopy,
  secondary: homeSecondaryCopy,
  galleryPreview: homeGalleryPreviewCopy,
} as const;

export type HomeCopy = typeof homeCopy;
