import type { Metadata } from "next";
import type { ReactNode } from "react";

import { docsPageMetadata } from "@/lib/docs-metadata";
import { homePage } from "@/lib/site";
import { DEFAULT_IDENTITY } from "@/lib/default-identity";
import { IdentityScript } from "@zedtech/zedkit-ui";
import { preload } from "react-dom";
import geistLatin from "@fontsource-variable/geist/files/geist-latin-wght-normal.woff2";
import { Provider } from "./provider";
import "./globals.css";
import "./code-syntax.css";
import "./docs-typography.css";
import "./docs-shell-tokens.css";
import "./docs-tables.css";
import "./fonts";

const baseMetadata = docsPageMetadata("/", homePage);

export const metadata: Metadata = {
  ...baseMetadata,
  title: {
    default: homePage.title,
    template: `%s · ${homePage.title}`,
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  // The default identity sets Geist: fetch the Latin file with the page, so the
  // first paint already uses it and the text does not shift when it arrives.
  preload(typeof geistLatin === "string" ? geistLatin : geistLatin.src, {
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  });
  return (
    <html lang="en" data-docs-shell suppressHydrationWarning>
      <head>
        <IdentityScript defaultIdentity={DEFAULT_IDENTITY} />
      </head>
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
