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
    "Open-source building blocks for modern apps: small TypeScript packages for UI, SEO, Nest, and agent tooling.",
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
