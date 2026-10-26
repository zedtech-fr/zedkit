import type { Metadata } from "next";
import type { ReactNode } from "react";

import { docsPageMetadata } from "@/lib/docs-metadata";
import { homePage } from "@/lib/site";
import { Provider } from "./provider";
import "./globals.css";
import "./docs-shell-tokens.css";

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
    <html lang="en" data-docs-shell suppressHydrationWarning>
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
