import { ScrollGallery, Stack, Tabs, TabsContent, TabsList, TabsTrigger } from "@zedtech/zedkit-ui";

const LOOKS = [
  ["one", "One"],
  ["two", "Two"],
  ["three", "Three"],
  ["four", "Four"],
  ["five", "Five"],
] as const;

/** Identity chips in a single scroll row (tabs inside ScrollGallery). */
export function ScrollGalleryIdentityDemo() {
  return (
    <Tabs defaultValue="one">
      <ScrollGallery data-example-width="" className="w-full">
        <TabsList className="inline-flex w-max flex-nowrap" aria-label="Looks">
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
      <Stack direction="horizontal" gap={2} className="w-max">
        <a className="shrink-0 snap-start rounded-md border px-control-inline py-control-block-lg" href="#alpha">
          Alpha
        </a>
        <a className="shrink-0 snap-start rounded-md border px-control-inline py-control-block-lg" href="#beta">
          Beta
        </a>
        <a className="shrink-0 snap-start rounded-md border px-control-inline py-control-block-lg" href="#gamma">
          Gamma
        </a>
        <a className="shrink-0 snap-start rounded-md border px-control-inline py-control-block-lg" href="#delta">
          Delta
        </a>
      </Stack>
    </ScrollGallery>
  );
}
