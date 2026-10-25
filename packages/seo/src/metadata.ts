/**
 * Page metadata, shaped for Next.js `Metadata` (generateMetadata return).
 * Structural on purpose: no Next dependency, assignable where used.
 */
export interface PageMetadata {
  title: string;
  description: string;
  keywords?: string[];
  authors?: Array<{ name: string }>;
  creator?: string;
  publisher?: string;
  metadataBase?: URL;
  alternates?: {
    canonical?: string;
    languages?: Record<string, string>;
  };
  openGraph?: {
    type: "website" | "article";
    locale?: string;
    url?: string;
    siteName?: string;
    title?: string;
    description?: string;
    images?: Array<{ url: string; width?: number; height?: number; alt?: string }>;
  };
  twitter?: {
    card: "summary" | "summary_large_image";
    title?: string;
    description?: string;
    images?: string[];
  };
  robots?: {
    index: boolean;
    follow: boolean;
    googleBot?: {
      index: boolean;
      follow: boolean;
      "max-video-preview"?: number;
      "max-image-preview"?: "none" | "standard" | "large";
      "max-snippet"?: number;
    };
  };
}

export interface SiteMetadata {
  name: string;
  url: string;
  defaultLocale: string;
  locales: string[];
}

export interface PageContent {
  title: string;
  description: string;
  keywords?: string[];
}

export interface OpenGraphImage {
  url: string;
  width: number;
  height: number;
}

export interface BuildPageMetadataOptions {
  site: SiteMetadata;
  page: PageContent;
  /** Active locale, e.g. `"en"`. */
  locale: string;
  /** Full pathname including the locale prefix, e.g. `/en/work/slug`. */
  pathname: string;
  /** Brand or page social image. */
  ogImage?: OpenGraphImage;
  /** Open Graph locale tag, e.g. `"en_US"`. Defaults to `<locale>_<LOCALE>`. */
  openGraphLocale?: string;
  /** Page-level robots overrides (e.g. `{ index: false }` for drafts). */
  robots?: { index?: boolean; follow?: boolean };
  /** When false, canonical and social URLs use `pathname` as-is (no `/${locale}` prefix). Default true. */
  localeInPath?: boolean;
}

function stripLocale(pathname: string, locales: string[]): string {
  for (const locale of locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1) || "/";
    }
  }
  return pathname || "/";
}

export function buildPageMetadata(options: BuildPageMetadataOptions): PageMetadata {
  const { site, page, locale } = options;
  const localeInPath = options.localeInPath ?? true;
  const barePath = localeInPath ? stripLocale(options.pathname, site.locales) : options.pathname || "/";
  const suffix = barePath === "/" ? "" : barePath.startsWith("/") ? barePath : `/${barePath}`;
  const canonical = localeInPath ? `/${locale}${suffix}` : suffix === "" ? "/" : suffix;
  const languages: Record<string, string> = {};
  if (localeInPath) {
    for (const available of site.locales) {
      languages[available] = `/${available}${suffix}`;
    }
    languages["x-default"] = `/${site.defaultLocale}${suffix}`;
  } else {
    languages["x-default"] = canonical;
  }
  const baseUrl = site.url.replace(/\/$/, "");
  const absoluteUrl = canonical === "/" ? `${baseUrl}/` : `${baseUrl}${canonical}`;
  const index = options.robots?.index ?? true;
  const follow = options.robots?.follow ?? true;
  const image = options.ogImage;
  const ogLocale =
    options.openGraphLocale ??
    (locale.length > 0 ? `${locale}_${locale.toUpperCase()}` : "en_US");
  return {
    title: page.title,
    description: page.description,
    ...(page.keywords === undefined ? {} : { keywords: page.keywords }),
    authors: [{ name: site.name }],
    creator: site.name,
    publisher: site.name,
    metadataBase: new URL(site.url),
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      type: "website",
      locale: ogLocale,
      url: absoluteUrl,
      siteName: site.name,
      title: page.title,
      description: page.description,
      ...(image === undefined
        ? {}
        : {
            images: [{ url: image.url, width: image.width, height: image.height, alt: site.name }],
          }),
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      ...(image === undefined ? {} : { images: [image.url] }),
    },
    robots: {
      index,
      follow,
      googleBot: {
        index,
        follow,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}
