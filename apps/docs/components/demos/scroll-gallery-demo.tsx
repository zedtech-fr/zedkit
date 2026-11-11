import { ScrollGallery, Stack, Tabs, TabsContent, TabsList, TabsTrigger } from "@zedtech/zedkit-ui";
import { scrollGalleryCopy } from "@/components/demos/i18n/scroll-gallery-copy";

const LOOKS = [
  ["one", scrollGalleryCopy.lookLabels.one],
  ["two", scrollGalleryCopy.lookLabels.two],
  ["three", scrollGalleryCopy.lookLabels.three],
  ["four", scrollGalleryCopy.lookLabels.four],
  ["five", scrollGalleryCopy.lookLabels.five],
] as const;

/** Identity chips in a single scroll row (tabs inside ScrollGallery). */
export function ScrollGalleryIdentityDemo() {
  return (
    <Tabs defaultValue="one">
      <ScrollGallery data-example-width="" className="w-full">
        <TabsList className="inline-flex w-max flex-nowrap" aria-label={scrollGalleryCopy.looksAriaLabel}>
          {LOOKS.map(([value, label]) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </ScrollGallery>
      {LOOKS.map(([value, label]) => (
        <TabsContent key={value} value={value} className="text-dense text-muted-foreground">
          {label}
        </TabsContent>
      ))}
    </Tabs>
  );
}

/** Filter-style links in a horizontal snap row. */
export function ScrollGalleryChipsDemo() {
  return (
    <ScrollGallery data-example-width="">
      <Stack direction="horizontal" gap="sm" className="w-max">
        <a className="shrink-0 snap-start rounded-md border px-control-inline py-control-block-lg" href="#alpha">
          {scrollGalleryCopy.chips.alpha}
        </a>
        <a className="shrink-0 snap-start rounded-md border px-control-inline py-control-block-lg" href="#beta">
          {scrollGalleryCopy.chips.beta}
        </a>
        <a className="shrink-0 snap-start rounded-md border px-control-inline py-control-block-lg" href="#gamma">
          {scrollGalleryCopy.chips.gamma}
        </a>
        <a className="shrink-0 snap-start rounded-md border px-control-inline py-control-block-lg" href="#delta">
          {scrollGalleryCopy.chips.delta}
        </a>
      </Stack>
    </ScrollGallery>
  );
}
