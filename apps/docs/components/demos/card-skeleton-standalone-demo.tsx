"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardSkeleton, CardTitle, Stack } from "@zedtech/zedkit-ui";

export function CardSkeletonStandaloneDemo() {
  const [loading, setLoading] = useState(true);
  return (
    <Stack gap={3} className="min-w-0">
      {loading ? (
        <CardSkeleton label="Loading report" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>October report</CardTitle>
            <CardDescription>148 orders, €12,430 revenue</CardDescription>
          </CardHeader>
          <CardContent>Best week: 14 to 20 October.</CardContent>
        </Card>
      )}
      <Stack direction="horizontal">
        <Button variant="outline" onClick={() => setLoading(!loading)}>
          {loading ? "Show the report" : "Show the skeleton"}
        </Button>
      </Stack>
    </Stack>
  );
}
