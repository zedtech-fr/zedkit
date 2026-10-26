"use client";

import { Card, CardContent, CardHeader, CardTitle, Text } from "@zedtech/zedkit-ui";
import { demoRegistry } from "@/components/demos/registry";

export function HomeHeroDashboard() {
  const { Demo } = demoRegistry.HomeAdminDashboardDemo;
  return (
    <Card className="w-full min-w-0" data-home-dashboard-card>
      <CardHeader>
        <CardTitle>Try the admin dashboard</CardTitle>
        <Text variant="muted" className="text-sm">
          Add, edit, and delete apps in the table — no backend. Switch preview to loading, empty, or error.
        </Text>
      </CardHeader>
      <CardContent className="min-w-0 p-0 pt-0">
        <Demo />
      </CardContent>
    </Card>
  );
}
