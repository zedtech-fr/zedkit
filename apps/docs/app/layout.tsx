import type { Metadata } from "next";
import type { ReactNode } from "react";

import { docsPageMetadata } from "@/lib/docs-metadata";
import { homePage } from "@/lib/site";
import { IdentityScript } from "@zedtech/zedkit-ui";
import { Provider } from "./provider";
import "./fonts";
import "./globals.css";

const baseMetadata = docsPageMetadata("/", homePage);

export const metadata: Metadata = {
  ...baseMetadata,
  title: {
    default: homePage.title,
    template: `%s · ${homePage.title}`,
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <IdentityScript />
      </head>
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
