import type { ReactNode } from "react";
import { SiteLayout } from "@/components/site-chrome/site-layout";
import { HomeMarketingHeader } from "@/components/site-chrome/site-headers";

export default function Layout({ children }: { children: ReactNode }) {
  return <SiteLayout header={HomeMarketingHeader}>{children}</SiteLayout>;
}
