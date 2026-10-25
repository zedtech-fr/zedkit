"use client";

import { Card, CardContent, CardHeader, CardTitle, Text } from "@zedtech/zedkit-ui";
import { DemoFrame } from "@/components/demo-frame";
import { demoRegistry } from "@/components/demos/registry";

export function HomeHeroDashboard() {
  const { Demo } = demoRegistry.HomeAdminDashboardDemo;
  return (
    <Card className="w-full min-w-0">
      <CardHeader>
        <CardTitle>Try the admin dashboard</CardTitle>
        <Text variant="muted" className="text-sm">
          Add, edit, and delete apps in the table — no backend. Switch preview to loading, empty, or error.
        </Text>
      </CardHeader>
      <CardContent>
        <DemoFrame>
          <Demo />
        </DemoFrame>
      </CardContent>
    </Card>
  );
}
