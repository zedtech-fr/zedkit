import type {
  Article,
  BreadcrumbList,
  Organization,
  WebPage,
  WithContext,
} from "schema-dts";

export interface OrganizationJsonLdOptions {
  name: string;
  url: string;
  logoUrl?: string;
  sameAs?: string[];
}

export function buildOrganizationJsonLd(options: OrganizationJsonLdOptions): WithContext<Organization> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${options.url.replace(/\/$/, "")}/#organization`,
    name: options.name,
    url: options.url,
    ...(options.logoUrl === undefined ? {} : { logo: options.logoUrl }),
    ...(options.sameAs === undefined ? {} : { sameAs: options.sameAs }),
  };
}

export interface WebPageJsonLdOptions {
  title: string;
  description: string;
  url: string;
  breadcrumb?: BreadcrumbList;
}

export function buildWebPageJsonLd(options: WebPageJsonLdOptions): WithContext<WebPage> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: options.title,
    description: options.description,
    url: options.url,
    ...(options.breadcrumb === undefined ? {} : { breadcrumb: options.breadcrumb }),
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): WithContext<BreadcrumbList> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export interface ArticleJsonLdOptions {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  imageUrl?: string;
}

export function buildArticleJsonLd(options: ArticleJsonLdOptions): WithContext<Article> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: options.title,
    description: options.description,
    url: options.url,
    datePublished: options.datePublished,
    ...(options.dateModified === undefined ? {} : { dateModified: options.dateModified }),
    ...(options.authorName === undefined
      ? {}
      : { author: { "@type": "Person", name: options.authorName } }),
    ...(options.imageUrl === undefined ? {} : { image: options.imageUrl }),
  };
}
