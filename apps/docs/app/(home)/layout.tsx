import type { ReactNode } from "react";
import { SiteLayout } from "@/ui/site-layout";
import { HomeMarketingHeader } from "@/ui/site-headers";

export default function Layout({ children }: { children: ReactNode }) {
  return <SiteLayout header={HomeMarketingHeader}>{children}</SiteLayout>;
}
