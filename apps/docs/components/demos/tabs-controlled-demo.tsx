"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Stack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
} from "@zedtech/zedkit-ui";

const views = {
  day: { label: "Day", appointments: 6, detail: "Tuesday 27 October: 6 appointments, first at 08:30." },
  week: { label: "Week", appointments: 31, detail: "Week 44: 31 appointments, busiest day is Thursday." },
  month: { label: "Month", appointments: 118, detail: "October: 118 appointments, 4 free slots left on Friday." },
} as const;

type View = keyof typeof views;

/** Controlled tabs: the page owns the state, so a button outside the tabs can drive them. */
export function TabsControlledDemo() {
  const [view, setView] = useState<View>("week");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clinic agenda</CardTitle>
        <CardDescription>Dr. Amara Diallo · Rue des Lilas</CardDescription>
      </CardHeader>
      <CardContent>
        <Stack gap={4}>
          <Stack direction="horizontal" gap={3}>
            <Badge variant="secondary" className="whitespace-nowrap">Showing: {views[view].label}</Badge>
            <Button variant="outline" size="sm" onClick={() => setView("month")}>
              Jump to the month
            </Button>
          </Stack>
          <Tabs value={view} onValueChange={(next) => setView(next as View)}>
            <TabsList aria-label="Agenda range">
              {(Object.keys(views) as View[]).map((key) => (
                <TabsTrigger key={key} value={key}>
                  {views[key].label}
                </TabsTrigger>
              ))}
            </TabsList>
            {(Object.keys(views) as View[]).map((key) => (
              <TabsContent key={key} value={key}>
                <Text>{views[key].detail}</Text>
              </TabsContent>
            ))}
          </Tabs>
        </Stack>
      </CardContent>
    </Card>
  );
}
