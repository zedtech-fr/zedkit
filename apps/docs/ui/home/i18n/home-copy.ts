/** English copy for the home page. Keys only; no markup. */
import { homeGalleryPreviewCopy } from "@/ui/home/i18n/home-gallery-copy";
import { homeHeroCopy } from "@/ui/home/i18n/home-hero-copy";

export const homeCopy = {
  ...homeHeroCopy,
  galleryPreview: homeGalleryPreviewCopy,
} as const;

export type HomeCopy = typeof homeCopy;
