"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle, Text } from "@zedtech/zedkit-ui";

// Below-fold interactive table: keep it out of the first-load JS.
const HomeAdminDashboardDemo = dynamic(
  () => import("@/components/demos/home-admin-dashboard-demo").then((mod) => mod.HomeAdminDashboardDemo),
  { ssr: false, loading: () => <div className="min-h-72" aria-hidden="true" /> },
);

export function HomeHeroDashboard() {
  return (
    <Card className="w-full min-w-0" data-home-dashboard-card>
      <CardHeader>
        <CardTitle className="text-lg">Try the admin dashboard</CardTitle>
        <Text variant="muted" className="text-sm">
          Add, edit, and delete apps in the table — no backend. Switch preview to loading, empty, or error.
        </Text>
      </CardHeader>
      <CardContent className="min-w-0 p-0 pt-0">
        <HomeAdminDashboardDemo />
      </CardContent>
    </Card>
  );
}
