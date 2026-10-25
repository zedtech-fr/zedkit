import { buildPageMetadata, type PageContent } from "@zedtech/zedkit-seo";

import { defaultOgImage, docsSite } from "./site";

export function docsPageMetadata(
  pathname: string,
  page: PageContent,
  robots?: { index?: boolean; follow?: boolean },
) {
  return buildPageMetadata({
    site: docsSite,
    page,
    locale: "en",
    pathname,
    localeInPath: false,
    ogImage: defaultOgImage(),
    ...(robots === undefined ? {} : { robots }),
  });
}
