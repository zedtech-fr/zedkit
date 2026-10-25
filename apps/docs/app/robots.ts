import type { MetadataRoute } from "next";
import { buildRobots } from "@zedtech/zedkit-seo";

import { docsSite } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return buildRobots({
    siteUrl: docsSite.url,
    disallow: ["/api/"],
  });
}
