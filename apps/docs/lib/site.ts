import type { OpenGraphImage, SiteMetadata } from "@zedtech/zedkit-seo";

export const docsSite: SiteMetadata = {
  name: "zedkit",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://zedkit.app",
  defaultLocale: "en",
  locales: ["en"],
};

export const homePage = {
  title: "zedkit",
  description:
    "Build the parts you need. TypeScript packages for admin UI, backend helpers, SEO, and coding-agent setup.",
};

export function pageUrl(pathname: string): string {
  const base = docsSite.url.replace(/\/$/, "");
  if (pathname === "/" || pathname === "") return `${base}/`;
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${base}${path}`;
}

export function defaultOgImage(): OpenGraphImage {
  return {
    url: pageUrl("/opengraph-image"),
    width: 1200,
    height: 630,
  };
}
